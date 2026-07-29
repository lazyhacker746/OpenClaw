"""Environment-backed settings for the Clarion backend."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Tuple

from dotenv import load_dotenv


load_dotenv()


def _read_int(name: str, default: int, minimum: int = 1) -> int:
    raw = os.getenv(name, str(default)).strip()
    try:
        value = int(raw)
    except ValueError as exc:
        raise ValueError(f"{name} must be an integer.") from exc
    if value < minimum:
        raise ValueError(f"{name} must be at least {minimum}.")
    return value


def _read_origins(raw: str) -> Tuple[str, ...]:
    value = raw.strip()
    if not value or value == "*":
        return ("*",)
    origins = tuple(item.strip() for item in value.split(",") if item.strip())
    return origins or ("*",)


@dataclass(frozen=True)
class Settings:
    app_env: str
    log_level: str
    cors_origins: Tuple[str, ...]
    auth_mode: str
    max_concurrent_searches: int
    task_ttl_minutes: int
    task_max_entries: int
    exports_dir: Path
    supabase_url: str = field(repr=False)
    supabase_service_key: str = field(repr=False)
    github_token: str = field(repr=False)

    @classmethod
    def from_env(cls) -> "Settings":
        auth_mode = os.getenv("AUTH_MODE", "legacy").strip().lower() or "legacy"
        if auth_mode != "legacy":
            raise ValueError(
                "This release supports AUTH_MODE=legacy only. "
                "Authentication hardening must be deployed separately."
            )

        return cls(
            app_env=os.getenv("APP_ENV", "development").strip() or "development",
            log_level=os.getenv("LOG_LEVEL", "INFO").strip().upper() or "INFO",
            cors_origins=_read_origins(os.getenv("CORS_ORIGINS", "*")),
            auth_mode=auth_mode,
            max_concurrent_searches=_read_int("MAX_CONCURRENT_SEARCHES", 1),
            task_ttl_minutes=_read_int("TASK_TTL_MINUTES", 120),
            task_max_entries=_read_int("TASK_MAX_ENTRIES", 1000),
            exports_dir=Path(
                os.getenv("EXPORTS_DIR", "/tmp/clarion-exports").strip()
                or "/tmp/clarion-exports"
            ),
            supabase_url=os.getenv("SUPABASE_URL", "").strip(),
            supabase_service_key=os.getenv("SUPABASE_SERVICE_KEY", "").strip(),
            github_token=os.getenv("GITHUB_TOKEN", "").strip(),
        )

    def missing_required_configuration(self) -> Tuple[str, ...]:
        missing = []
        if not self.supabase_url:
            missing.append("SUPABASE_URL")
        if not self.supabase_service_key:
            missing.append("SUPABASE_SERVICE_KEY")
        if not self.github_token:
            missing.append("GITHUB_TOKEN")
        return tuple(missing)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings.from_env()
