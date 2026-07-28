import os
import tempfile
import unittest
from unittest.mock import patch

from app.api.schemas import LeadRequest
from app.services.generation import GenerationService
from app.services.task_registry import InMemoryTaskRegistry


class FakeBackgroundTasks:
    def __init__(self):
        self.calls = []

    def add_task(self, function, *args, **kwargs):
        self.calls.append((function, args, kwargs))


class FakeScraper:
    def __init__(self, results=None):
        self.results = [] if results is None else results
        self.calls = []

    def run(self, clean_data):
        self.calls.append(clean_data)
        return self.results


class FakeDatabase:
    def __init__(self, profile=None, saved_count=1):
        self.profile = profile or {"standard_credits": 50, "ai_credits": 10}
        self.saved_count = saved_count
        self.saved_calls = []
        self.deduct_calls = []

    def check_and_eval_credits(self, user_id):
        return self.profile

    def save_leads_to_db(self, **kwargs):
        self.saved_calls.append(kwargs)
        return self.saved_count

    def deduct_user_credits(self, user_id, leads_found, used_ai):
        self.deduct_calls.append((user_id, leads_found, used_ai))
        return True


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
    def make_service(self, scraper=None, database=None):
        registry = InMemoryTaskRegistry()
        service = GenerationService(
            scraper=scraper or FakeScraper(),
            database=database or FakeDatabase(),
            task_registry=registry,
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

    def test_successful_worker_saves_then_deducts_using_saved_count(self):
        leads = [{"Business Name": "Example", "WhatsApp Link": "https://wa.me/1"}]
        scraper = FakeScraper(results=leads)
        database = FakeDatabase(saved_count=1)
        service, registry = self.make_service(scraper=scraper, database=database)
        request = make_request(use_ai=True)
        clean_data = request.model_dump(exclude={"user_id"})

        with tempfile.TemporaryDirectory() as directory:
            previous = os.getcwd()
            try:
                os.chdir(directory)
                service.run_background_task("task-1", request, clean_data)
            finally:
                os.chdir(previous)

        self.assertEqual(registry.get("task-1"), {"status": "success", "data": leads})
        self.assertEqual(len(database.saved_calls), 1)
        self.assertEqual(database.saved_calls[0]["leads"], leads)
        self.assertEqual(database.deduct_calls, [("user-1", 1, True)])

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

    def test_stage1_preserves_csv_failure_short_circuit_until_stage2(self):
        leads = [{"Business Name": "Example", "WhatsApp Link": "https://wa.me/1"}]
        database = FakeDatabase(saved_count=1)
        service, registry = self.make_service(
            scraper=FakeScraper(results=leads),
            database=database,
        )
        request = make_request()

        with tempfile.TemporaryDirectory() as directory:
            previous = os.getcwd()
            try:
                os.chdir(directory)
                with patch(
                    "app.services.generation.pd.DataFrame.to_csv",
                    side_effect=OSError("read-only"),
                ):
                    service.run_background_task(
                        "task-3",
                        request,
                        request.model_dump(exclude={"user_id"}),
                    )
            finally:
                os.chdir(previous)

        self.assertEqual(database.saved_calls, [])
        self.assertEqual(
            registry.get("task-3"),
            {
                "status": "error",
                "message": ["Scraping engine failed: read-only"],
            },
        )


if __name__ == "__main__":
    unittest.main()
