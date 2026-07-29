"""Liveness and readiness endpoints."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.logging import get_logger
from app.dependencies import database_adapter, search_limiter, settings, task_registry


router = APIRouter()
logger = get_logger(__name__)


@router.get("/health/live")
def live():
    return {"status": "live"}


@router.get("/health/ready")
def ready():
    missing = settings.missing_required_configuration()
    if missing:
        logger.warning(
            "readiness_missing_configuration",
            extra={
                "event": "readiness_missing_configuration",
                "missing": list(missing),
            },
        )
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "checks": {
                    "configuration": "missing",
                    "database": "not_checked",
                },
            },
        )

    database_ready, detail = database_adapter.check_readiness()
    if not database_ready:
        logger.warning(
            "readiness_database_unavailable",
            extra={
                "event": "readiness_database_unavailable",
                "error": detail,
            },
        )
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "checks": {
                    "configuration": "ok",
                    "database": "unavailable",
                },
            },
        )

    return {
        "status": "ready",
        "checks": {"configuration": "ok", "database": "ok"},
        "runtime": {
            "active_searches": search_limiter.active_count,
            "max_concurrent_searches": search_limiter.maximum,
            "tracked_tasks": task_registry.size,
        },
    }
