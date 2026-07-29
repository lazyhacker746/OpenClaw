"""Central dependency wiring for replaceable infrastructure boundaries."""

from app.adapters.database import LegacyDatabaseAdapter
from app.adapters.scraper import LegacyScraperAdapter
from app.core.config import get_settings
from app.services.concurrency import SearchConcurrencyLimiter
from app.services.exports import CsvExportService
from app.services.generation import GenerationService
from app.services.task_registry import InMemoryTaskRegistry


settings = get_settings()
database_adapter = LegacyDatabaseAdapter()
scraper_adapter = LegacyScraperAdapter()
task_registry = InMemoryTaskRegistry(
    ttl_seconds=settings.task_ttl_minutes * 60,
    max_entries=settings.task_max_entries,
)
search_limiter = SearchConcurrencyLimiter(settings.max_concurrent_searches)
export_service = CsvExportService(settings.exports_dir)
generation_service = GenerationService(
    scraper=scraper_adapter,
    database=database_adapter,
    task_registry=task_registry,
    search_limiter=search_limiter,
    export_service=export_service,
)
