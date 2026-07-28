"""User profile and settings routes."""

from fastapi import APIRouter

from app.api.schemas import SettingsRequest
from app.dependencies import database_adapter


router = APIRouter()


@router.get("/api/user/profile")
def fetch_profile(user_id: str):
    profile = database_adapter.check_and_eval_credits(user_id)
    if profile:
        return {"status": "success", "data": profile}
    return {"status": "error", "message": "Profile not found."}


@router.post("/api/user/settings")
def save_settings(request: SettingsRequest):
    success = database_adapter.update_user_settings(
        request.user_id,
        request.sadapay_link,
    )
    if success:
        return {"status": "success", "message": "Settings saved successfully."}
    return {"status": "error", "message": "Failed to save settings."}
