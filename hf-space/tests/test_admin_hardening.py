import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from support import install_external_stubs

install_external_stubs()

import api
from app.dependencies import database_adapter


class AdminHardeningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(api.app)

    def test_backend_rejects_admin_self_delete_before_auth_client_call(self):
        with patch.object(
            database_adapter.supabase.auth.admin,
            "delete_user",
        ) as delete_user:
            response = self.client.post(
                "/api/admin/users/delete",
                json={
                    "requester_id": "admin-1",
                    "target_user_id": "admin-1",
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": "error",
                "message": "Administrators cannot delete their own account.",
            },
        )
        delete_user.assert_not_called()

    def test_authorized_disposable_user_delete_contract_is_preserved(self):
        with patch.object(
            database_adapter,
            "get_user_profile",
            return_value={"id": "admin-1", "role": "admin"},
        ), patch.object(
            database_adapter.supabase.auth.admin,
            "delete_user",
        ) as delete_user:
            response = self.client.post(
                "/api/admin/users/delete",
                json={
                    "requester_id": "admin-1",
                    "target_user_id": "user-1",
                },
            )

        self.assertEqual(
            response.json(),
            {"status": "success", "message": "User permanently deleted."},
        )
        delete_user.assert_called_once_with("user-1")


if __name__ == "__main__":
    unittest.main()
