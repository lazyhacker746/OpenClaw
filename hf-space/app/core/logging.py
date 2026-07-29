"""Structured JSON logging for requests and background tasks."""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Dict

from app.core.request_context import get_request_id, get_task_id


_STANDARD_RECORD_KEYS = set(logging.makeLogRecord({}).__dict__)
_CONFIGURED = False


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "event": getattr(record, "event", record.getMessage()),
            "request_id": getattr(record, "request_id", get_request_id()),
            "task_id": getattr(record, "task_id", get_task_id()),
        }

        for key, value in record.__dict__.items():
            if key in _STANDARD_RECORD_KEYS or key in payload or key.startswith("_"):
                continue
            if key in {"message", "asctime", "event"}:
                continue
            try:
                json.dumps(value)
                payload[key] = value
            except (TypeError, ValueError):
                payload[key] = str(value)

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def configure_logging(level: str = "INFO") -> None:
    global _CONFIGURED
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    root = logging.getLogger()
    root.setLevel(numeric_level)

    formatter = JsonFormatter()
    if not _CONFIGURED:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(numeric_level)
        handler.setFormatter(formatter)
        root.handlers.clear()
        root.addHandler(handler)
        _CONFIGURED = True
    else:
        for handler in root.handlers:
            handler.setLevel(numeric_level)
            handler.setFormatter(formatter)

    # Uvicorn configures its loggers before importing the application. Reusing
    # the same formatter keeps server and application logs machine-readable.
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        server_logger = logging.getLogger(logger_name)
        for handler in server_logger.handlers:
            handler.setFormatter(formatter)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
