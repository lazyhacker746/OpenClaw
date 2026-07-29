"""User profile and settings routes."""

from fastapi import APIRouter

from app.api.schemas import SettingsRequest
from app.core.logging import get_logger
from app.dependencies import database_adapter


router = APIRouter()
logger = get_logger(__name__)


@router.get("/api/user/profile")
def fetch_profile(user_id: str):
    logger.info(
        "user_profile_requested",
        extra={"event": "user_profile_requested", "user_id": user_id},
    )
    profile = database_adapter.check_and_eval_credits(user_id)
    if profile:
        return {"status": "success", "data": profile}
    return {"status": "error", "message": "Profile not found."}


@router.post("/api/user/settings")
def save_settings(request: SettingsRequest):
    logger.info(
        "user_settings_update_requested",
        extra={"event": "user_settings_update_requested", "user_id": request.user_id},
    )
    success = database_adapter.update_user_settings(
        request.user_id,
        request.sadapay_link,
    )
    if success:
        return {"status": "success", "message": "Settings saved successfully."}
    return {"status": "error", "message": "Failed to save settings."}
