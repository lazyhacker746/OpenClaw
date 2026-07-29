import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from support import install_external_stubs

install_external_stubs()

import api
from app.dependencies import database_adapter


EXPECTED_API_METHODS = {
    ("/api/generate", "POST"),
    ("/api/status/{task_id}", "GET"),
    ("/api/history", "GET"),
    ("/api/leads/bulk-delete", "POST"),
    ("/api/leads/update-pitch", "POST"),
    ("/api/user/profile", "GET"),
    ("/api/user/settings", "POST"),
    ("/api/admin/users", "GET"),
    ("/api/admin/users/update", "POST"),
    ("/api/admin/users/delete", "POST"),
}


class ApiContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(api.app)

    def setUp(self):
        api.search_tasks.clear()

    def test_existing_api_paths_and_methods_are_preserved(self):
        schema = api.app.openapi()

        actual = {
            (route_path, method.upper())
            for route_path, operations in schema.get("paths", {}).items()
            if route_path.startswith("/api/")
            for method in operations
            if method.upper() not in {"HEAD", "OPTIONS", "PARAMETERS"}
        }

        self.assertEqual(actual, EXPECTED_API_METHODS)

    def test_invalid_task_response_shape_is_unchanged(self):
        response = self.client.get("/api/status/unknown")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": "error", "message": ["Invalid or expired Task ID."]},
        )

    def test_extra_generate_field_does_not_trigger_http_422(self):
        response = self.client.post(
            "/api/generate",
            json={
                "city": "Taxila123",
                "category": "Gym",
                "target_leads": 1,
                "min_reviews": 20,
                "mode": "1",
                "use_ai": False,
                "sadapay_link": "none",
                "user_id": "user-1",
                "harmless_future_field": "accepted",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "error")
        self.assertIn("City must contain only letters and spaces.", response.json()["message"])

    def test_history_success_response_contract_is_unchanged(self):
        leads = [{"Business Name": "Example"}]
        with patch.object(database_adapter, "get_user_vault", return_value=leads):
            response = self.client.get("/api/history?user_id=user-1")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "success", "data": leads})

    def test_bulk_delete_success_response_contract_is_unchanged(self):
        with patch.object(database_adapter, "delete_user_leads", return_value=(True, 2)):
            response = self.client.post(
                "/api/leads/bulk-delete",
                json={
                    "user_id": "user-1",
                    "whatsapp_links": ["https://wa.me/1", "https://wa.me/2"],
                },
            )

        self.assertEqual(
            response.json(),
            {"status": "success", "message": "Successfully removed 2 leads from vault."},
        )

    def test_pitch_update_success_response_contract_is_unchanged(self):
        with patch.object(database_adapter, "update_lead_pitch", return_value=True):
            response = self.client.post(
                "/api/leads/update-pitch",
                json={"whatsapp_link": "https://wa.me/1", "new_pitch": "Edited"},
            )

        self.assertEqual(
            response.json(),
            {"status": "success", "message": "Pitch saved successfully."},
        )

    def test_profile_success_response_contract_is_unchanged(self):
        profile = {"id": "user-1", "standard_credits": 50, "ai_credits": 10}
        with patch.object(database_adapter, "check_and_eval_credits", return_value=profile):
            response = self.client.get("/api/user/profile?user_id=user-1")

        self.assertEqual(response.json(), {"status": "success", "data": profile})

    def test_admin_update_response_contract_is_unchanged(self):
        with patch.object(
            database_adapter,
            "update_user_tier",
            return_value=(True, "User updated successfully."),
        ):
            response = self.client.post(
                "/api/admin/users/update",
                json={
                    "requester_id": "admin-1",
                    "target_user_id": "user-1",
                    "new_role": "pro",
                    "standard_credits": 500,
                    "ai_credits": 100,
                },
            )

        self.assertEqual(
            response.json(),
            {"status": "success", "message": "User updated successfully."},
        )

    def test_compatibility_entry_point_exports_legacy_symbols(self):
        self.assertIs(api.search_tasks, api.task_registry.storage)
        self.assertEqual(api.background_scraper_task, api.generation_service.run_background_task)
        self.assertTrue(callable(api.generate_leads))
        self.assertTrue(callable(api.get_history))
        self.assertTrue(callable(api.update_user))


if __name__ == "__main__":
    unittest.main()
