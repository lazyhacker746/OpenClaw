"""Lead Vault routes."""

from fastapi import APIRouter

from app.api.schemas import DeleteRequest, UpdatePitchRequest
from app.dependencies import database_adapter


router = APIRouter()


@router.post("/api/leads/bulk-delete")
def bulk_delete_leads(request: DeleteRequest):
    print(
        f"\n[!] User {request.user_id} requested BULK DELETE "
        f"for {len(request.whatsapp_links)} leads."
    )

    if not request.whatsapp_links:
        return {"status": "error", "message": "No leads selected for deletion."}

    success, deleted_count = database_adapter.delete_user_leads(
        request.user_id,
        request.whatsapp_links,
    )

    if success:
        return {
            "status": "success",
            "message": f"Successfully removed {deleted_count} leads from vault.",
        }
    return {"status": "error", "message": "Failed to delete leads from database."}


@router.get("/api/history")
def get_history(user_id: str):
    print(f"[+] Fetching historical leads from Cloud Vault for User {user_id}...")
    try:
        leads = database_adapter.get_user_vault(user_id)
        return {"status": "success", "data": leads}
    except Exception as exc:
        print(f"[-] Database Error: {exc}")
        return {"status": "error", "message": str(exc)}


@router.post("/api/leads/update-pitch")
def update_pitch(request: UpdatePitchRequest):
    print(f"\n[!] Saving manually edited pitch for {request.whatsapp_link}")

    success = database_adapter.update_lead_pitch(
        request.whatsapp_link,
        request.new_pitch,
    )

    if success:
        return {"status": "success", "message": "Pitch saved successfully."}
    return {"status": "error", "message": "Failed to save pitch."}
