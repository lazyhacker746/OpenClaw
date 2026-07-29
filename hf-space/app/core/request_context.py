"""Request and task correlation context shared by logs and workers."""

from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar
from typing import Iterator, Optional


_request_id: ContextVar[str] = ContextVar("clarion_request_id", default="-")
_task_id: ContextVar[str] = ContextVar("clarion_task_id", default="-")


def get_request_id() -> str:
    return _request_id.get()


def get_task_id() -> str:
    return _task_id.get()


@contextmanager
def bind_context(
    *, request_id: Optional[str] = None, task_id: Optional[str] = None
) -> Iterator[None]:
    request_token = _request_id.set(request_id) if request_id else None
    task_token = _task_id.set(task_id) if task_id else None
    try:
        yield
    finally:
        if task_token is not None:
            _task_id.reset(task_token)
        if request_token is not None:
            _request_id.reset(request_token)
