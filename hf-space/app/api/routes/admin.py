"""Administrative user-management routes."""

from fastapi import APIRouter

from app.api.schemas import AdminDeleteRequest, AdminUpdateRequest
from app.core.errors import normalize_exception
from app.core.logging import get_logger
from app.dependencies import database_adapter


router = APIRouter()
logger = get_logger(__name__)


@router.get("/api/admin/users")
def get_all_users(requester_id: str):
    logger.info(
        "admin_users_requested",
        extra={"event": "admin_users_requested", "requester_id": requester_id},
    )
    success, data = database_adapter.get_all_profiles(requester_id)
    if success:
        return {"status": "success", "data": data}
    return {"status": "error", "message": data}


@router.post("/api/admin/users/update")
def update_user(request: AdminUpdateRequest):
    logger.info(
        "admin_user_update_requested",
        extra={
            "event": "admin_user_update_requested",
            "requester_id": request.requester_id,
            "target_user_id": request.target_user_id,
            "new_role": request.new_role,
        },
    )
    success, message = database_adapter.update_user_tier(
        request.requester_id,
        request.target_user_id,
        request.new_role,
        request.standard_credits,
        request.ai_credits,
    )
    if success:
        return {"status": "success", "message": message}
    return {"status": "error", "message": message}


@router.post("/api/admin/users/delete")
def delete_user_account(request: AdminDeleteRequest):
    logger.info(
        "admin_user_delete_requested",
        extra={
            "event": "admin_user_delete_requested",
            "requester_id": request.requester_id,
            "target_user_id": request.target_user_id,
        },
    )

    if request.requester_id == request.target_user_id:
        return {
            "status": "error",
            "message": "Administrators cannot delete their own account.",
        }

    requester_profile = database_adapter.get_user_profile(request.requester_id)
    if not requester_profile or requester_profile.get("role") != "admin":
        return {"status": "error", "message": "Unauthorized access."}

    try:
        database_adapter.supabase.auth.admin.delete_user(request.target_user_id)
        return {"status": "success", "message": "User permanently deleted."}
    except Exception as exc:
        normalized = normalize_exception(exc, operation="User deletion")
        logger.exception(
            "admin_user_delete_failed",
            extra={
                "event": "admin_user_delete_failed",
                "error_category": normalized.category,
                "exception_type": normalized.exception_type,
            },
        )
        return {"status": "error", "message": normalized.public_message}
