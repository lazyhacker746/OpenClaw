import os
import unittest
from pathlib import Path
from unittest.mock import patch

from app.core.config import Settings


class SettingsTests(unittest.TestCase):
    def test_defaults_preserve_legacy_mode_and_safe_operational_values(self):
        with patch.dict(os.environ, {}, clear=True):
            settings = Settings.from_env()

        self.assertEqual(settings.app_env, "development")
        self.assertEqual(settings.log_level, "INFO")
        self.assertEqual(settings.cors_origins, ("*",))
        self.assertEqual(settings.auth_mode, "legacy")
        self.assertEqual(settings.max_concurrent_searches, 1)
        self.assertEqual(settings.task_ttl_minutes, 120)
        self.assertEqual(settings.task_max_entries, 1000)
        self.assertEqual(settings.exports_dir, Path("/tmp/clarion-exports"))

    def test_environment_values_are_parsed_without_exposing_secrets(self):
        env = {
            "APP_ENV": "production",
            "LOG_LEVEL": "warning",
            "CORS_ORIGINS": "https://a.example, https://b.example",
            "AUTH_MODE": "legacy",
            "MAX_CONCURRENT_SEARCHES": "3",
            "TASK_TTL_MINUTES": "45",
            "TASK_MAX_ENTRIES": "250",
            "EXPORTS_DIR": "/tmp/custom-exports",
            "SUPABASE_URL": "https://example.supabase.co",
            "SUPABASE_SERVICE_KEY": "secret-service-key",
            "GITHUB_TOKEN": "secret-github-token",
        }
        with patch.dict(os.environ, env, clear=True):
            settings = Settings.from_env()

        self.assertEqual(settings.app_env, "production")
        self.assertEqual(settings.log_level, "WARNING")
        self.assertEqual(
            settings.cors_origins,
            ("https://a.example", "https://b.example"),
        )
        self.assertEqual(settings.max_concurrent_searches, 3)
        self.assertEqual(settings.task_ttl_minutes, 45)
        self.assertEqual(settings.task_max_entries, 250)
        self.assertEqual(settings.exports_dir, Path("/tmp/custom-exports"))
        rendered = repr(settings)
        self.assertNotIn("secret-service-key", rendered)
        self.assertNotIn("secret-github-token", rendered)

    def test_non_legacy_auth_mode_is_rejected_for_this_release(self):
        with patch.dict(os.environ, {"AUTH_MODE": "strict"}, clear=True):
            with self.assertRaisesRegex(ValueError, "AUTH_MODE=legacy"):
                Settings.from_env()

    def test_invalid_operational_integer_fails_fast(self):
        with patch.dict(
            os.environ,
            {"MAX_CONCURRENT_SEARCHES": "zero"},
            clear=True,
        ):
            with self.assertRaisesRegex(ValueError, "must be an integer"):
                Settings.from_env()

    def test_missing_required_configuration_is_reported_by_name(self):
        with patch.dict(
            os.environ,
            {"SUPABASE_URL": "https://example.supabase.co"},
            clear=True,
        ):
            settings = Settings.from_env()

        self.assertEqual(
            settings.missing_required_configuration(),
            ("SUPABASE_SERVICE_KEY", "GITHUB_TOKEN"),
        )


if __name__ == "__main__":
    unittest.main()
