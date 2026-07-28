"""Test-only stubs for optional production SDKs unavailable in lightweight CI."""

import os
import sys
from types import ModuleType, SimpleNamespace


class _UnusedQuery:
    def __getattr__(self, name):
        def method(*args, **kwargs):
            return self
        return method

    def execute(self):
        return SimpleNamespace(data=[])


class _FakeSupabaseClient:
    def __init__(self):
        self.auth = SimpleNamespace(
            admin=SimpleNamespace(delete_user=lambda user_id: None)
        )

    def table(self, name):
        return _UnusedQuery()


def install_external_stubs():
    os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
    os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
    os.environ.setdefault("GITHUB_TOKEN", "test-github-token")

    if "supabase" not in sys.modules:
        module = ModuleType("supabase")
        module.Client = _FakeSupabaseClient
        module.create_client = lambda url, key: _FakeSupabaseClient()
        sys.modules["supabase"] = module

    if "openai" not in sys.modules:
        module = ModuleType("openai")

        class OpenAI:
            def __init__(self, *args, **kwargs):
                self.chat = SimpleNamespace(
                    completions=SimpleNamespace(create=self._not_called)
                )

            @staticmethod
            def _not_called(*args, **kwargs):
                raise AssertionError("The external AI client must not run in unit tests.")

        module.OpenAI = OpenAI
        sys.modules["openai"] = module
