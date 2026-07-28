"""Administrative user-management routes."""

from fastapi import APIRouter

from app.api.schemas import AdminDeleteRequest, AdminUpdateRequest
from app.dependencies import database_adapter


router = APIRouter()


@router.get("/api/admin/users")
def get_all_users(requester_id: str):
    print(f"\n[!] ADMIN PROTOCOL: Fetch requested by ID {requester_id}")

    success, data = database_adapter.get_all_profiles(requester_id)

    if success:
        return {"status": "success", "data": data}
    return {"status": "error", "message": data}


@router.post("/api/admin/users/update")
def update_user(request: AdminUpdateRequest):
    print(
        f"\n[!] ADMIN PROTOCOL: Update requested by {request.requester_id} "
        f"for target {request.target_user_id}"
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
    print(
        f"\n[!] ADMIN PROTOCOL: Deletion requested by {request.requester_id} "
        f"for target {request.target_user_id}"
    )

    requester_profile = database_adapter.get_user_profile(request.requester_id)
    if not requester_profile or requester_profile.get("role") != "admin":
        return {"status": "error", "message": "Unauthorized access."}

    try:
        database_adapter.supabase.auth.admin.delete_user(request.target_user_id)
        return {"status": "success", "message": "User permanently deleted."}
    except Exception as exc:
        print(f"[-] Admin Delete Error: {exc}")
        return {"status": "error", "message": str(exc)}
