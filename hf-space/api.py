"""Hugging Face/Uvicorn compatibility entry point for Clarion.

The implementation now lives under ``app/`` while this module preserves the
existing ``uvicorn api:app`` deployment command and commonly imported symbols.
"""

import uvicorn

from app.api.routes.admin import delete_user_account, get_all_users, update_user
from app.api.routes.generation import generate_leads, get_status
from app.api.routes.leads import bulk_delete_leads, get_history, update_pitch
from app.api.routes.users import fetch_profile, save_settings
from app.api.schemas import (
    AdminDeleteRequest,
    AdminUpdateRequest,
    DeleteRequest,
    LeadRequest,
    SettingsRequest,
    UpdatePitchRequest,
)
from app.dependencies import generation_service, task_registry
from app.main import app


search_tasks = task_registry.storage
background_scraper_task = generation_service.run_background_task


if __name__ == "__main__":
    print("🚀 Clarion Backend API Initializing on Port 8000...")
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
