"""Central error normalization without speculative schema inference."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class NormalizedError:
    category: str
    public_message: str
    exception_type: str


def normalize_exception(exc: Exception, *, operation: str) -> NormalizedError:
    """Describe the real exception type without guessing a database schema cause."""
    exception_type = type(exc).__name__
    detail = str(exc).strip() or exception_type

    if isinstance(exc, TimeoutError):
        category = "timeout"
    elif isinstance(exc, ConnectionError):
        category = "connection"
    elif isinstance(exc, OSError):
        category = "operating_system"
    else:
        category = "unexpected"

    return NormalizedError(
        category=category,
        public_message=f"{operation} failed: {detail}",
        exception_type=exception_type,
    )
