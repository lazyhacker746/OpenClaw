import unittest

from app.services.task_registry import InMemoryTaskRegistry


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


if __name__ == "__main__":
    unittest.main()
