"""Thread-safe, bounded in-process task state with TTL expiration.

The registry remains process-local because Playwright tasks also execute inside
this process. The interface is intentionally replaceable so a shared external
store can be introduced later without changing API routes.
"""

from __future__ import annotations

import threading
import time
from collections.abc import Iterator, MutableMapping
from dataclasses import dataclass
from typing import Callable, Dict, Optional


_TERMINAL_STATUSES = {"success", "error"}


@dataclass
class _TaskRecord:
    value: dict
    created_at: float
    updated_at: float
    request_id: str = "-"


class _StorageView(MutableMapping):
    def __init__(self, registry: "InMemoryTaskRegistry"):
        self._registry = registry

    def __getitem__(self, key: str):
        value = self._registry.get(key)
        if value is None:
            raise KeyError(key)
        return value

    def __setitem__(self, key: str, value: dict) -> None:
        self._registry.set(key, value)

    def __delitem__(self, key: str) -> None:
        if not self._registry.delete(key):
            raise KeyError(key)

    def __iter__(self) -> Iterator[str]:
        return iter(self._registry.keys())

    def __len__(self) -> int:
        return self._registry.size

    def clear(self) -> None:
        self._registry.clear()


class InMemoryTaskRegistry:
    def __init__(
        self,
        ttl_seconds: float = 120 * 60,
        max_entries: int = 1000,
        clock: Callable[[], float] = time.monotonic,
    ):
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be positive")
        if max_entries < 1:
            raise ValueError("max_entries must be at least 1")
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self._clock = clock
        self._lock = threading.RLock()
        self._tasks: Dict[str, _TaskRecord] = {}
        self._storage = _StorageView(self)

    @property
    def storage(self):
        """Mapping-compatible view retained for ``api.search_tasks`` callers."""
        return self._storage

    def set(self, task_id: str, value: dict, *, request_id: Optional[str] = None) -> None:
        now = self._clock()
        with self._lock:
            self._cleanup_locked(now)
            existing = self._tasks.get(task_id)
            self._tasks[task_id] = _TaskRecord(
                value=value,
                created_at=existing.created_at if existing else now,
                updated_at=now,
                request_id=request_id or (existing.request_id if existing else "-"),
            )
            self._enforce_bound_locked()

    def get(self, task_id: str):
        with self._lock:
            self._cleanup_locked(self._clock())
            record = self._tasks.get(task_id)
            return record.value if record else None

    def get_request_id(self, task_id: str) -> str:
        with self._lock:
            self._cleanup_locked(self._clock())
            record = self._tasks.get(task_id)
            return record.request_id if record else "-"

    def delete(self, task_id: str) -> bool:
        with self._lock:
            return self._tasks.pop(task_id, None) is not None

    def clear(self) -> None:
        with self._lock:
            self._tasks.clear()

    def cleanup(self) -> int:
        with self._lock:
            return self._cleanup_locked(self._clock())

    def keys(self):
        with self._lock:
            self._cleanup_locked(self._clock())
            return tuple(self._tasks.keys())

    @property
    def size(self) -> int:
        with self._lock:
            self._cleanup_locked(self._clock())
            return len(self._tasks)

    def _cleanup_locked(self, now: float) -> int:
        expired = [
            task_id
            for task_id, record in self._tasks.items()
            if now - record.updated_at >= self.ttl_seconds
        ]
        for task_id in expired:
            del self._tasks[task_id]
        return len(expired)

    def _enforce_bound_locked(self) -> None:
        while len(self._tasks) > self.max_entries:
            terminal = [
                (task_id, record)
                for task_id, record in self._tasks.items()
                if record.value.get("status") in _TERMINAL_STATUSES
            ]
            candidates = terminal or list(self._tasks.items())
            oldest_id, _ = min(candidates, key=lambda item: item[1].updated_at)
            del self._tasks[oldest_id]
