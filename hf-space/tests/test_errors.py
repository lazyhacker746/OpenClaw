import unittest

from app.core.errors import normalize_exception


class ErrorNormalizationTests(unittest.TestCase):
    def test_generic_transport_message_is_not_reinterpreted_as_schema_failure(self):
        result = normalize_exception(
            Exception("Server disconnected"),
            operation="Supabase request",
        )

        self.assertEqual(result.category, "unexpected")
        self.assertIn("Server disconnected", result.public_message)
        self.assertNotIn("column", result.public_message.lower())
        self.assertNotIn("schema", result.public_message.lower())

    def test_connection_error_keeps_its_actual_category(self):
        result = normalize_exception(
            ConnectionError("connection reset"),
            operation="Supabase request",
        )

        self.assertEqual(result.category, "connection")
        self.assertEqual(result.exception_type, "ConnectionError")


if __name__ == "__main__":
    unittest.main()
