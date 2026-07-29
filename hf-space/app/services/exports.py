"""Best-effort temporary CSV backups; Supabase remains authoritative."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable, Mapping, Optional

import pandas as pd

from app.core.logging import get_logger


logger = get_logger(__name__)


def _safe_component(value: object) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", str(value)).strip("_.")
    return cleaned or "unknown"


class CsvExportService:
    def __init__(self, exports_dir: Path):
        self.exports_dir = Path(exports_dir)

    def export(
        self,
        leads: Iterable[Mapping],
        *,
        category: object,
        city: object,
    ) -> Optional[Path]:
        try:
            self.exports_dir.mkdir(parents=True, exist_ok=True)
            destination = self.exports_dir / (
                f"ServerBackup_{_safe_component(category)}_{_safe_component(city)}.csv"
            )
            pd.DataFrame(list(leads)).to_csv(destination, index=False)
            logger.info(
                "csv_export_completed",
                extra={"event": "csv_export_completed", "path": str(destination)},
            )
            return destination
        except Exception as exc:  # Best effort by product invariant.
            logger.warning(
                "csv_export_failed",
                extra={
                    "event": "csv_export_failed",
                    "exception_type": type(exc).__name__,
                    "error": str(exc),
                },
            )
            return None
