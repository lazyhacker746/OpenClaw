import unittest
from concurrent.futures import ThreadPoolExecutor

from app.services.task_registry import InMemoryTaskRegistry


class FakeClock:
    def __init__(self):
        self.value = 0.0

    def __call__(self):
        return self.value

    def advance(self, seconds):
        self.value += seconds


class TaskRegistryTests(unittest.TestCase):
    def test_set_get_and_clear_preserve_dictionary_semantics(self):
        registry = InMemoryTaskRegistry()
        value = {"status": "starting"}

        registry.set("task-1", value)

        self.assertIs(registry.get("task-1"), value)
        self.assertIs(registry.storage["task-1"], value)
        self.assertIsNone(registry.get("missing"))

        registry.clear()
        self.assertEqual(registry.storage, {})

    def test_ttl_cleanup_expires_stale_tasks(self):
        clock = FakeClock()
        registry = InMemoryTaskRegistry(ttl_seconds=10, clock=clock)
        registry.set("task-1", {"status": "success"})

        clock.advance(9)
        self.assertIsNotNone(registry.get("task-1"))

        clock.advance(1)
        self.assertIsNone(registry.get("task-1"))
        self.assertEqual(registry.size, 0)

    def test_bounded_registry_evicts_oldest_terminal_task_first(self):
        clock = FakeClock()
        registry = InMemoryTaskRegistry(
            ttl_seconds=100,
            max_entries=2,
            clock=clock,
        )
        registry.set("terminal-old", {"status": "success"})
        clock.advance(1)
        registry.set("active", {"status": "processing"})
        clock.advance(1)
        registry.set("new", {"status": "starting"})

        self.assertIsNone(registry.get("terminal-old"))
        self.assertIsNotNone(registry.get("active"))
        self.assertIsNotNone(registry.get("new"))

    def test_request_correlation_metadata_is_retained_across_updates(self):
        registry = InMemoryTaskRegistry()
        registry.set(
            "task-1",
            {"status": "starting"},
            request_id="request-123",
        )
        registry.set("task-1", {"status": "processing"})

        self.assertEqual(registry.get_request_id("task-1"), "request-123")

    def test_concurrent_writes_and_reads_are_thread_safe(self):
        registry = InMemoryTaskRegistry(max_entries=500)

        def write_and_read(index):
            task_id = f"task-{index}"
            value = {"status": "success", "index": index}
            registry.set(task_id, value)
            return registry.get(task_id)

        with ThreadPoolExecutor(max_workers=16) as pool:
            results = list(pool.map(write_and_read, range(200)))

        self.assertEqual(registry.size, 200)
        self.assertEqual({item["index"] for item in results}, set(range(200)))


if __name__ == "__main__":
    unittest.main()
