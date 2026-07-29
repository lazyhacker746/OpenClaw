import threading
import time
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from app.api.schemas import LeadRequest
from app.services.concurrency import SearchConcurrencyLimiter
from app.services.exports import CsvExportService
from app.services.generation import GenerationService
from app.services.task_registry import InMemoryTaskRegistry


class FakeBackgroundTasks:
    def __init__(self):
        self.calls = []

    def add_task(self, function, *args, **kwargs):
        self.calls.append((function, args, kwargs))


class FakeScraper:
    def __init__(self, results=None, error=None):
        self.results = [] if results is None else results
        self.error = error
        self.calls = []

    def run(self, clean_data):
        self.calls.append(clean_data)
        if self.error:
            raise self.error
        return self.results


class FakeDatabase:
    def __init__(self, profile=None, saved_count=1, events=None):
        self.profile = profile or {"standard_credits": 50, "ai_credits": 10}
        self.saved_count = saved_count
        self.saved_calls = []
        self.deduct_calls = []
        self.events = events

    def check_and_eval_credits(self, user_id):
        return self.profile

    def save_leads_to_db(self, **kwargs):
        self.saved_calls.append(kwargs)
        if self.events is not None:
            self.events.append("save")
        return self.saved_count

    def deduct_user_credits(self, user_id, leads_found, used_ai):
        self.deduct_calls.append((user_id, leads_found, used_ai))
        if self.events is not None:
            self.events.append("deduct")
        return True


class FakeExportService:
    def __init__(self, events=None):
        self.calls = []
        self.events = events

    def export(self, leads, *, category, city):
        self.calls.append((leads, category, city))
        if self.events is not None:
            self.events.append("export")
        return None


class BlockingScraper:
    def __init__(self, leads):
        self.leads = leads
        self.started = threading.Event()
        self.release = threading.Event()
        self._lock = threading.Lock()
        self.calls = 0

    def run(self, clean_data):
        with self._lock:
            self.calls += 1
            call_number = self.calls
        if call_number == 1:
            self.started.set()
            if not self.release.wait(timeout=3):
                raise TimeoutError("test release was not signalled")
        return self.leads


class FailOnceScraper:
    def __init__(self, leads):
        self.leads = leads
        self.calls = 0

    def run(self, clean_data):
        self.calls += 1
        if self.calls == 1:
            raise RuntimeError("first scrape failed")
        return self.leads


def make_request(**overrides):
    values = {
        "city": "Taxila",
        "category": "Gym",
        "target_leads": 1,
        "min_reviews": 20,
        "mode": "1",
        "use_ai": False,
        "sadapay_link": "none",
        "user_id": "user-1",
    }
    values.update(overrides)
    return LeadRequest(**values)


class GenerationServiceTests(unittest.TestCase):
    def make_service(
        self,
        scraper=None,
        database=None,
        limiter=None,
        export_service=None,
    ):
        registry = InMemoryTaskRegistry()
        service = GenerationService(
            scraper=scraper or FakeScraper(),
            database=database or FakeDatabase(),
            task_registry=registry,
            search_limiter=limiter,
            export_service=export_service or FakeExportService(),
        )
        return service, registry

    def test_valid_request_returns_processing_contract_and_queues_worker(self):
        service, registry = self.make_service()
        background = FakeBackgroundTasks()

        response = service.start_search(make_request(), background)

        self.assertEqual(response["status"], "processing")
        self.assertIn("task_id", response)
        self.assertEqual(
            registry.get(response["task_id"]),
            {"status": "starting", "progress": "Initializing Playwright engine..."},
        )
        self.assertEqual(len(background.calls), 1)
        function, args, kwargs = background.calls[0]
        self.assertEqual(function, service.run_background_task)
        self.assertEqual(args[0], response["task_id"])
        self.assertEqual(args[1].user_id, "user-1")
        self.assertEqual(args[3], "-")
        self.assertEqual(kwargs, {})

    def test_standard_credit_error_contract_is_unchanged(self):
        database = FakeDatabase(profile={"standard_credits": 0, "ai_credits": 10})
        service, _ = self.make_service(database=database)

        response = service.start_search(make_request(), FakeBackgroundTasks())

        self.assertEqual(
            response,
            {
                "status": "error",
                "message": [
                    "Insufficient search credits. You have 0 remaining. Next reset in 3 days."
                ],
            },
        )

    def test_ai_credit_error_contract_is_unchanged(self):
        database = FakeDatabase(profile={"standard_credits": 50, "ai_credits": 0})
        service, _ = self.make_service(database=database)

        response = service.start_search(
            make_request(use_ai=True),
            FakeBackgroundTasks(),
        )

        self.assertEqual(
            response,
            {
                "status": "error",
                "message": [
                    "Insufficient AI copy generation credits. You have 0 left. "
                    "Turn off AI or upgrade your tier."
                ],
            },
        )

    def test_successful_worker_saves_deducts_then_exports(self):
        events = []
        leads = [{"Business Name": "Example", "WhatsApp Link": "https://wa.me/1"}]
        scraper = FakeScraper(results=leads)
        database = FakeDatabase(saved_count=1, events=events)
        export_service = FakeExportService(events=events)
        service, registry = self.make_service(
            scraper=scraper,
            database=database,
            export_service=export_service,
        )
        request = make_request(use_ai=True)

        service.run_background_task(
            "task-1",
            request,
            request.model_dump(exclude={"user_id"}),
        )

        self.assertEqual(registry.get("task-1"), {"status": "success", "data": leads})
        self.assertEqual(len(database.saved_calls), 1)
        self.assertEqual(database.saved_calls[0]["leads"], leads)
        self.assertEqual(database.deduct_calls, [("user-1", 1, True)])
        self.assertEqual(events, ["save", "deduct", "export"])

    def test_no_results_returns_existing_error_contract(self):
        service, registry = self.make_service(scraper=FakeScraper(results=[]))
        request = make_request()

        service.run_background_task(
            "task-2",
            request,
            request.model_dump(exclude={"user_id"}),
        )

        self.assertEqual(
            registry.get("task-2"),
            {
                "status": "error",
                "message": ["No leads found matching those exact filters."],
            },
        )

    def test_csv_failure_never_overrides_successful_persistence(self):
        leads = [{"Business Name": "Example", "WhatsApp Link": "https://wa.me/1"}]
        database = FakeDatabase(saved_count=1)
        with TemporaryDirectory() as directory:
            export_service = CsvExportService(Path(directory))
            service, registry = self.make_service(
                scraper=FakeScraper(results=leads),
                database=database,
                export_service=export_service,
            )
            request = make_request()

            with patch(
                "app.services.exports.pd.DataFrame.to_csv",
                side_effect=OSError("read-only"),
            ):
                service.run_background_task(
                    "task-3",
                    request,
                    request.model_dump(exclude={"user_id"}),
                )

        self.assertEqual(len(database.saved_calls), 1)
        self.assertEqual(database.deduct_calls, [("user-1", 1, False)])
        self.assertEqual(registry.get("task-3"), {"status": "success", "data": leads})

    def test_real_concurrency_limit_serializes_playwright_workers(self):
        leads = [{"Business Name": "Example", "WhatsApp Link": "https://wa.me/1"}]
        scraper = BlockingScraper(leads)
        limiter = SearchConcurrencyLimiter(1)
        service, registry = self.make_service(
            scraper=scraper,
            limiter=limiter,
        )
        request = make_request()
        clean_data = request.model_dump(exclude={"user_id"})

        with ThreadPoolExecutor(max_workers=2) as pool:
            first = pool.submit(
                service.run_background_task,
                "task-a",
                request,
                clean_data,
            )
            self.assertTrue(scraper.started.wait(timeout=2))
            second = pool.submit(
                service.run_background_task,
                "task-b",
                request,
                clean_data,
            )
            time.sleep(0.1)
            self.assertEqual(scraper.calls, 1)
            self.assertEqual(limiter.active_count, 1)
            self.assertEqual(
                registry.get("task-b"),
                {
                    "status": "processing",
                    "progress": "Waiting for an available search slot...",
                },
            )
            scraper.release.set()
            first.result(timeout=3)
            second.result(timeout=3)

        self.assertEqual(limiter.peak_count, 1)
        self.assertEqual(registry.get("task-a")["status"], "success")
        self.assertEqual(registry.get("task-b")["status"], "success")

    def test_concurrency_slot_is_released_after_worker_exception(self):
        leads = [{"Business Name": "Example", "WhatsApp Link": "https://wa.me/1"}]
        limiter = SearchConcurrencyLimiter(1)
        scraper = FailOnceScraper(leads)
        service, registry = self.make_service(scraper=scraper, limiter=limiter)
        request = make_request()
        clean_data = request.model_dump(exclude={"user_id"})

        service.run_background_task("task-failed", request, clean_data)
        self.assertEqual(limiter.active_count, 0)
        self.assertEqual(registry.get("task-failed")["status"], "error")

        service.run_background_task("task-next", request, clean_data)
        self.assertEqual(limiter.active_count, 0)
        self.assertEqual(registry.get("task-next")["status"], "success")


if __name__ == "__main__":
    unittest.main()
