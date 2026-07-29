import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

from support import install_external_stubs

install_external_stubs()

import api
from app.api.routes import health


class HealthEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(api.app)

    def test_liveness_endpoint_reports_live(self):
        response = self.client.get("/health/live")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "live"})

    def test_readiness_endpoint_reports_ready_after_real_checks_pass(self):
        fake_settings = SimpleNamespace(missing_required_configuration=lambda: ())
        with patch.object(health, "settings", fake_settings), patch.object(
            health.database_adapter,
            "check_readiness",
            return_value=(True, None),
        ):
            response = self.client.get("/health/ready")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "ready")
        self.assertEqual(
            payload["checks"],
            {"configuration": "ok", "database": "ok"},
        )
        self.assertIn("max_concurrent_searches", payload["runtime"])
        self.assertIn("tracked_tasks", payload["runtime"])

    def test_readiness_fails_when_configuration_is_missing(self):
        fake_settings = SimpleNamespace(
            missing_required_configuration=lambda: ("GITHUB_TOKEN",)
        )
        with patch.object(health, "settings", fake_settings), patch.object(
            health.database_adapter,
            "check_readiness",
        ) as readiness:
            response = self.client.get("/health/ready")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["status"], "not_ready")
        self.assertEqual(
            response.json()["checks"],
            {"configuration": "missing", "database": "not_checked"},
        )
        readiness.assert_not_called()

    def test_readiness_fails_without_guessing_when_database_is_unavailable(self):
        fake_settings = SimpleNamespace(missing_required_configuration=lambda: ())
        with patch.object(health, "settings", fake_settings), patch.object(
            health.database_adapter,
            "check_readiness",
            return_value=(False, "Exception: Server disconnected"),
        ):
            response = self.client.get("/health/ready")

        self.assertEqual(response.status_code, 503)
        payload = response.json()
        self.assertEqual(payload["status"], "not_ready")
        self.assertEqual(payload["checks"]["database"], "unavailable")
        self.assertNotIn("schema", str(payload).lower())
        self.assertNotIn("column", str(payload).lower())


if __name__ == "__main__":
    unittest.main()
