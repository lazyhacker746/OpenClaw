"""Lead-generation orchestration around the verified legacy behavior."""

from __future__ import annotations

import uuid
from pathlib import Path

from app.core.errors import normalize_exception
from app.core.logging import get_logger
from app.core.request_context import bind_context, get_request_id
from app.services.concurrency import SearchConcurrencyLimiter
from app.services.exports import CsvExportService
from validators import validate_inputs


logger = get_logger(__name__)


class GenerationService:
    def __init__(
        self,
        scraper,
        database,
        task_registry,
        search_limiter=None,
        export_service=None,
    ):
        self.scraper = scraper
        self.database = database
        self.task_registry = task_registry
        self.search_limiter = search_limiter or SearchConcurrencyLimiter(1)
        self.export_service = export_service or CsvExportService(
            Path("/tmp/clarion-exports")
        )

    def start_search(self, request, background_tasks):
        request_id = get_request_id()
        logger.info(
            "search_request_received",
            extra={
                "event": "search_request_received",
                "user_id": request.user_id,
                "category": request.category,
                "city": request.city,
            },
        )

        payload = request.model_dump()
        errors, clean_data = validate_inputs(payload)
        if errors:
            logger.info(
                "search_validation_failed",
                extra={"event": "search_validation_failed", "error_count": len(errors)},
            )
            return {"status": "error", "message": errors}

        profile = self.database.check_and_eval_credits(request.user_id)
        if not profile:
            return {
                "status": "error",
                "message": ["Failed to authenticate your account tier profile."],
            }

        target_leads = clean_data.get("target_leads", 10)
        if profile["standard_credits"] < target_leads:
            return {
                "status": "error",
                "message": [
                    f"Insufficient search credits. You have {profile['standard_credits']} "
                    "remaining. Next reset in 3 days."
                ],
            }

        use_ai = clean_data.get("use_ai", True)
        if use_ai and profile["ai_credits"] < target_leads:
            return {
                "status": "error",
                "message": [
                    f"Insufficient AI copy generation credits. You have "
                    f"{profile['ai_credits']} left. Turn off AI or upgrade your tier."
                ],
            }

        task_id = str(uuid.uuid4())
        self.task_registry.set(
            task_id,
            {"status": "starting", "progress": "Initializing Playwright engine..."},
            request_id=request_id,
        )
        background_tasks.add_task(
            self.run_background_task,
            task_id,
            request,
            clean_data,
            request_id,
        )
        logger.info(
            "search_queued",
            extra={"event": "search_queued", "task_id": task_id},
        )
        return {"status": "processing", "task_id": task_id}

    def get_status(self, task_id: str):
        task_info = self.task_registry.get(task_id)
        if not task_info:
            return {"status": "error", "message": ["Invalid or expired Task ID."]}
        return task_info

    def run_background_task(
        self,
        task_id: str,
        request,
        clean_data: dict,
        request_id: str | None = None,
    ):
        correlated_request_id = request_id or self.task_registry.get_request_id(task_id)
        with bind_context(request_id=correlated_request_id, task_id=task_id):
            self.task_registry.set(
                task_id,
                {
                    "status": "processing",
                    "progress": "Waiting for an available search slot...",
                },
            )
            logger.info(
                "search_worker_waiting",
                extra={"event": "search_worker_waiting"},
            )

            try:
                with self.search_limiter.slot():
                    logger.info(
                        "search_worker_started",
                        extra={
                            "event": "search_worker_started",
                            "active_searches": self.search_limiter.active_count,
                        },
                    )
                    self.task_registry.set(
                        task_id,
                        {
                            "status": "processing",
                            "progress": (
                                f"Scraping {clean_data['category']} in "
                                f"{clean_data['city']}..."
                            ),
                        },
                    )
                    results = self.scraper.run(clean_data)

                    if not results:
                        self.task_registry.set(
                            task_id,
                            {
                                "status": "error",
                                "message": [
                                    "No leads found matching those exact filters."
                                ],
                            },
                        )
                        logger.info(
                            "search_no_results",
                            extra={"event": "search_no_results"},
                        )
                        return

                    self.task_registry.set(
                        task_id,
                        {
                            "status": "processing",
                            "progress": "Saving leads to Cloud Vault...",
                        },
                    )
                    logger.info(
                        "vault_persistence_started",
                        extra={
                            "event": "vault_persistence_started",
                            "lead_count": len(results),
                            "user_id": request.user_id,
                        },
                    )
                    saved_count = self.database.save_leads_to_db(
                        city=clean_data["city"],
                        category=clean_data["category"],
                        leads=results,
                        user_id=request.user_id,
                    )

                    if saved_count > 0:
                        self.database.deduct_user_credits(
                            request.user_id,
                            saved_count,
                            clean_data.get("use_ai", True),
                        )

                    # Temporary export is deliberately after permanent persistence
                    # and is internally best-effort, so it cannot fail the task.
                    self.export_service.export(
                        results,
                        category=clean_data["category"],
                        city=clean_data["city"],
                    )

                    self.task_registry.set(
                        task_id, {"status": "success", "data": results}
                    )
                    logger.info(
                        "search_completed",
                        extra={
                            "event": "search_completed",
                            "result_count": len(results),
                            "saved_count": saved_count,
                        },
                    )
            except Exception as exc:
                normalized = normalize_exception(exc, operation="Scraping engine")
                logger.exception(
                    "search_failed",
                    extra={
                        "event": "search_failed",
                        "error_category": normalized.category,
                        "exception_type": normalized.exception_type,
                    },
                )
                self.task_registry.set(
                    task_id,
                    {
                        "status": "error",
                        "message": [normalized.public_message],
                    },
                )
