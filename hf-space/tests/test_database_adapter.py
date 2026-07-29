import unittest
from types import SimpleNamespace
from unittest.mock import patch

from support import install_external_stubs

install_external_stubs()

from app.adapters.database import LegacyDatabaseAdapter


class ReadinessQuery:
    def __init__(self, error=None):
        self.error = error
        self.limit_value = None

    def select(self, columns):
        self.columns = columns
        return self

    def limit(self, value):
        self.limit_value = value
        return self

    def execute(self):
        if self.error:
            raise self.error
        return SimpleNamespace(data=[])


class ReadinessClient:
    def __init__(self, query):
        self.query = query
        self.table_name = None

    def table(self, name):
        self.table_name = name
        return self.query


class DatabaseAdapterReadinessTests(unittest.TestCase):
    def test_readiness_uses_a_bounded_profiles_query(self):
        query = ReadinessQuery()
        client = ReadinessClient(query)
        adapter = LegacyDatabaseAdapter()

        with patch("app.adapters.database.legacy_database.supabase", client):
            ready, detail = adapter.check_readiness()

        self.assertTrue(ready)
        self.assertIsNone(detail)
        self.assertEqual(client.table_name, "profiles")
        self.assertEqual(query.columns, "id")
        self.assertEqual(query.limit_value, 1)

    def test_readiness_reports_actual_transport_error_without_schema_guess(self):
        client = ReadinessClient(ReadinessQuery(Exception("Server disconnected")))
        adapter = LegacyDatabaseAdapter()

        with patch("app.adapters.database.legacy_database.supabase", client):
            ready, detail = adapter.check_readiness()

        self.assertFalse(ready)
        self.assertIn("Server disconnected", detail)
        self.assertNotIn("schema", detail.lower())
        self.assertNotIn("column", detail.lower())


if __name__ == "__main__":
    unittest.main()
