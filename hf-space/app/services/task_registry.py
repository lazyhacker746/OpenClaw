"""Stage 1 compatibility wrapper for search task state.

This deliberately preserves the legacy process-local dictionary semantics.
Thread safety, TTL cleanup, and bounded storage are Stage 2 hardening work.
"""


class InMemoryTaskRegistry:
    def __init__(self):
        self._tasks = {}

    @property
    def storage(self):
        """Expose the underlying mapping for ``api.search_tasks`` compatibility."""
        return self._tasks

    def set(self, task_id: str, value: dict) -> None:
        self._tasks[task_id] = value

    def get(self, task_id: str):
        return self._tasks.get(task_id)

    def clear(self) -> None:
        self._tasks.clear()
