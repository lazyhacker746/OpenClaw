"""FastAPI application factory and production application instance."""

from __future__ import annotations

import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.core.request_context import bind_context


settings = get_settings()
configure_logging(settings.log_level)
logger = get_logger(__name__)


def _internal_error_response(request_id: str) -> JSONResponse:
    response = JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal server error."},
    )
    response.headers["X-Request-ID"] = request_id
    return response


def create_app() -> FastAPI:
    application = FastAPI(title="Clarion API", version="2.0")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def correlation_middleware(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        started = time.perf_counter()
        with bind_context(request_id=request_id):
            logger.info(
                "request_started",
                extra={
                    "event": "request_started",
                    "method": request.method,
                    "path": request.url.path,
                },
            )
            try:
                response = await call_next(request)
            except Exception as exc:
                logger.exception(
                    "unhandled_request_exception",
                    extra={
                        "event": "unhandled_request_exception",
                        "path": request.url.path,
                        "exception_type": type(exc).__name__,
                    },
                )
                response = _internal_error_response(request_id)

            response.headers["X-Request-ID"] = request_id
            logger.info(
                "request_completed",
                extra={
                    "event": "request_completed",
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 2),
                },
            )
            return response

    @application.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        with bind_context(request_id=request_id):
            logger.exception(
                "unhandled_request_exception",
                extra={
                    "event": "unhandled_request_exception",
                    "path": request.url.path,
                    "exception_type": type(exc).__name__,
                },
            )
        return _internal_error_response(request_id)

    application.include_router(api_router)
    logger.info(
        "application_configured",
        extra={
            "event": "application_configured",
            "app_env": settings.app_env,
            "auth_mode": settings.auth_mode,
            "max_concurrent_searches": settings.max_concurrent_searches,
            "task_ttl_minutes": settings.task_ttl_minutes,
        },
    )
    return application


app = create_app()
