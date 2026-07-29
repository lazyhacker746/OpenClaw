"""Lead Vault routes."""

from fastapi import APIRouter

from app.api.schemas import DeleteRequest, UpdatePitchRequest
from app.core.errors import normalize_exception
from app.core.logging import get_logger
from app.dependencies import database_adapter


router = APIRouter()
logger = get_logger(__name__)


@router.post("/api/leads/bulk-delete")
def bulk_delete_leads(request: DeleteRequest):
    logger.info(
        "vault_bulk_delete_requested",
        extra={
            "event": "vault_bulk_delete_requested",
            "user_id": request.user_id,
            "lead_count": len(request.whatsapp_links),
        },
    )

    if not request.whatsapp_links:
        return {"status": "error", "message": "No leads selected for deletion."}

    success, deleted_count = database_adapter.delete_user_leads(
        request.user_id,
        request.whatsapp_links,
    )

    if success:
        logger.info(
            "vault_bulk_delete_completed",
            extra={
                "event": "vault_bulk_delete_completed",
                "user_id": request.user_id,
                "deleted_count": deleted_count,
            },
        )
        return {
            "status": "success",
            "message": f"Successfully removed {deleted_count} leads from vault.",
        }
    return {"status": "error", "message": "Failed to delete leads from database."}


@router.get("/api/history")
def get_history(user_id: str):
    logger.info(
        "vault_history_requested",
        extra={"event": "vault_history_requested", "user_id": user_id},
    )
    try:
        leads = database_adapter.get_user_vault(user_id)
        return {"status": "success", "data": leads}
    except Exception as exc:
        normalized = normalize_exception(exc, operation="Vault history lookup")
        logger.exception(
            "vault_history_failed",
            extra={
                "event": "vault_history_failed",
                "user_id": user_id,
                "error_category": normalized.category,
                "exception_type": normalized.exception_type,
            },
        )
        return {"status": "error", "message": normalized.public_message}


@router.post("/api/leads/update-pitch")
def update_pitch(request: UpdatePitchRequest):
    logger.info(
        "vault_pitch_update_requested",
        extra={
            "event": "vault_pitch_update_requested",
            "whatsapp_link": request.whatsapp_link,
        },
    )

    success = database_adapter.update_lead_pitch(
        request.whatsapp_link,
        request.new_pitch,
    )

    if success:
        return {"status": "success", "message": "Pitch saved successfully."}
    return {"status": "error", "message": "Failed to save pitch."}
