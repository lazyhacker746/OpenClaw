"""Real process-level concurrency control for Playwright searches."""

from __future__ import annotations

import threading
from contextlib import contextmanager
from typing import Iterator


class SearchConcurrencyLimiter:
    def __init__(self, maximum: int):
        if maximum < 1:
            raise ValueError("maximum must be at least 1")
        self.maximum = maximum
        self._semaphore = threading.BoundedSemaphore(maximum)
        self._lock = threading.Lock()
        self._active = 0
        self._peak = 0

    @contextmanager
    def slot(self) -> Iterator[None]:
        self._semaphore.acquire()
        with self._lock:
            self._active += 1
            self._peak = max(self._peak, self._active)
        try:
            yield
        finally:
            with self._lock:
                self._active -= 1
            self._semaphore.release()

    @property
    def active_count(self) -> int:
        with self._lock:
            return self._active

    @property
    def peak_count(self) -> int:
        with self._lock:
            return self._peak
