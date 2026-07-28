"""Application dependency wiring.

Dependencies are centralized so tests and future infrastructure can replace
Supabase, scraper, and task-state implementations without changing routes.
"""

from app.adapters.database import LegacyDatabaseAdapter
from app.adapters.scraper import LegacyScraperAdapter
from app.services.generation import GenerationService
from app.services.task_registry import InMemoryTaskRegistry


database_adapter = LegacyDatabaseAdapter()
scraper_adapter = LegacyScraperAdapter()
task_registry = InMemoryTaskRegistry()
generation_service = GenerationService(
    scraper=scraper_adapter,
    database=database_adapter,
    task_registry=task_registry,
)
