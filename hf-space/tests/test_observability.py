import json
import logging
import unittest

from fastapi.testclient import TestClient

from support import install_external_stubs

install_external_stubs()

import api
from app.core.logging import JsonFormatter
from app.core.request_context import bind_context
from app.main import create_app


class ObservabilityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(api.app)

    def test_json_formatter_includes_request_and_task_correlation(self):
        formatter = JsonFormatter()
        record = logging.LogRecord(
            name="clarion.test",
            level=logging.INFO,
            pathname=__file__,
            lineno=1,
            msg="worker_event",
            args=(),
            exc_info=None,
        )
        record.event = "worker_event"
        record.user_id = "user-1"

        with bind_context(request_id="request-123", task_id="task-456"):
            payload = json.loads(formatter.format(record))

        self.assertEqual(payload["event"], "worker_event")
        self.assertEqual(payload["request_id"], "request-123")
        self.assertEqual(payload["task_id"], "task-456")
        self.assertEqual(payload["user_id"], "user-1")

    def test_incoming_request_id_is_returned_to_the_caller(self):
        response = self.client.get(
            "/health/live",
            headers={"X-Request-ID": "client-request-123"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["X-Request-ID"], "client-request-123")

    def test_request_id_is_generated_when_caller_does_not_supply_one(self):
        response = self.client.get("/health/live")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.headers.get("X-Request-ID"))

    def test_unhandled_exception_is_normalized_to_stable_http_500(self):
        application = create_app()

        @application.get("/_test/unhandled")
        def fail():
            raise RuntimeError("private failure detail")

        client = TestClient(application, raise_server_exceptions=False)
        response = client.get("/_test/unhandled")

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.json(),
            {"status": "error", "message": "Internal server error."},
        )
        self.assertTrue(response.headers.get("X-Request-ID"))


if __name__ == "__main__":
    unittest.main()
