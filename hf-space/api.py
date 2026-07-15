import os
import uvicorn
import uuid  # 👈 NEW: For generating unique Task IDs
from fastapi import FastAPI, BackgroundTasks  # 👈 NEW: BackgroundTasks imported
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from typing import List

# YOUR modular imports remain intact
from validators import validate_inputs
from scraper import run_scraper

# Supabase database imports
from database import (
    supabase, save_leads_to_db, get_user_vault, delete_user_leads,
    update_lead_pitch, check_and_eval_credits, deduct_user_credits,
    get_user_profile, update_user_settings, get_all_profiles, update_user_tier # 👈 Added the new functions
)

app = FastAPI(title="Clarion API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- THE TASK VAULT (In-Memory Tracker) ---
search_tasks = {}


class LeadRequest(BaseModel):
    city: str
    category: str
    target_leads: int
    min_reviews: int
    mode: str
    use_ai: bool
    sadapay_link: str
    user_id: str


class DeleteRequest(BaseModel):
    whatsapp_links: List[str] # 👈 Changed from string to list
    user_id: str

class UpdatePitchRequest(BaseModel):
    whatsapp_link: str
    new_pitch: str

class SettingsRequest(BaseModel):
    user_id: str
    sadapay_link: str

class AdminUpdateRequest(BaseModel):
    requester_id: str
    target_user_id: str
    new_role: str
    standard_credits: int
    ai_credits: int

class AdminDeleteRequest(BaseModel):
    requester_id: str
    target_user_id: str

# --- THE BACKGROUND WORKER ---
def background_scraper_task(task_id: str, request: LeadRequest, clean_data: dict):
    print(f"\n[⚙️ WORKER] Starting Background Task: {task_id}")

    try:
        # Update status so React knows what is happening
        search_tasks[task_id] = {"status": "processing",
                                 "progress": f"Scraping {clean_data['category']} in {clean_data['city']}..."}

        # Run YOUR existing scraper.py logic
        results = run_scraper(clean_data)

        if results:
            search_tasks[task_id] = {"status": "processing", "progress": "Saving leads to Cloud Vault..."}

            # Keep your local CSV backup logic
            export_dir = "exports"
            os.makedirs(export_dir, exist_ok=True)
            df = pd.DataFrame(results)
            filename = os.path.join(export_dir, f"ServerBackup_{clean_data['category']}_{clean_data['city']}.csv")
            df.to_csv(filename, index=False)

            # Route to Supabase Cloud Vault
            print(f"[+] Routing {len(results)} leads to Clarion Cloud Vault for User {request.user_id}...")

            # 👇 CHANGED: Capture the return value so we know exactly how many were successfully saved
            saved_count = save_leads_to_db(
                city=clean_data['city'],
                category=clean_data['category'],
                leads=results,
                user_id=request.user_id
            )

            # 👇 NEW: Safely deduct credits based on what actually made it into the vault!
            if saved_count > 0:
                use_ai = clean_data.get('use_ai', True)
                deduct_user_credits(request.user_id, saved_count, use_ai)

            print(f"[+] SUCCESS: Task {task_id} completed.")
            # Set final status so React stops polling and displays the data
            search_tasks[task_id] = {"status": "success", "data": results}

        else:
            print("[-] No targets acquired.")
            search_tasks[task_id] = {"status": "error", "message": ["No leads found matching those exact filters."]}

    except Exception as e:
        print(f"[!] SYSTEM FAILURE on Task {task_id}: {str(e)}")
        search_tasks[task_id] = {"status": "error", "message": [f"Scraping engine failed: {str(e)}"]}


# --- ENDPOINT 1: Start the Search ---
@app.post("/api/generate")
def generate_leads(request: LeadRequest, background_tasks: BackgroundTasks):
    print(f"\n[+] INCOMING REQUEST: Targeting {request.category} in {request.city} for User {request.user_id}")

    payload = request.model_dump()
    errors, clean_data = validate_inputs(payload)

    if errors:
        print("[-] VALIDATION FAILED")
        return {"status": "error", "message": errors}

    # --- 🛡️ NEW SECURITY GATE: CREDIT & TIER CHECKS ---

    profile = check_and_eval_credits(request.user_id)
    if not profile:
        return {"status": "error", "message": ["Failed to authenticate your account tier profile."]}

    # Check standard search balance requirements
    target_leads = clean_data.get('target_leads', 10)
    if profile['standard_credits'] < target_leads:
        return {
            "status": "error",
            "message": [
                f"Insufficient search credits. You have {profile['standard_credits']} remaining. Next reset in 3 days."]
        }

    # Check AI text generator payload limits
    use_ai = clean_data.get('use_ai', True)
    if use_ai and profile['ai_credits'] < target_leads:
        return {
            "status": "error",
            "message": [
                f"Insufficient AI copy generation credits. You have {profile['ai_credits']} left. Turn off AI or upgrade your tier."]
        }

    # --- END SECURITY GATE ---

    print("[+] VALIDATION & SECURITY PASSED. Queuing Background Task...")

    # 1. Generate a unique receipt ticket for this search
    task_id = str(uuid.uuid4())

    # 2. Initialize the task in our vault
    search_tasks[task_id] = {"status": "starting", "progress": "Initializing Playwright engine..."}

    # 3. Hand the heavy lifting to the background worker
    background_tasks.add_task(background_scraper_task, task_id, request, clean_data)

    # 4. Instantly return the receipt ticket to React
    return {"status": "processing", "task_id": task_id}


# --- ENDPOINT 2: The Polling Route (NEW) ---
@app.get("/api/status/{task_id}")
def get_status(task_id: str):
    task_info = search_tasks.get(task_id)

    if not task_info:
        return {"status": "error", "message": ["Invalid or expired Task ID."]}

    return task_info


# --- EXISTING ENDPOINTS (Untouched) ---
@app.post("/api/leads/bulk-delete")  # 👈 New Route Name
def bulk_delete_leads(request: DeleteRequest):
    print(f"\n[!] User {request.user_id} requested BULK DELETE for {len(request.whatsapp_links)} leads.")

    if not request.whatsapp_links:
        return {"status": "error", "message": "No leads selected for deletion."}

    success, deleted_count = delete_user_leads(request.user_id, request.whatsapp_links)

    if success:
        return {"status": "success", "message": f"Successfully removed {deleted_count} leads from vault."}
    else:
        return {"status": "error", "message": "Failed to delete leads from database."}


@app.get("/api/history")
def get_history(user_id: str):
    print(f"[+] Fetching historical leads from Cloud Vault for User {user_id}...")
    try:
        leads = get_user_vault(user_id)
        return {"status": "success", "data": leads}
    except Exception as e:
        print(f"[-] Database Error: {e}")
        return {"status": "error", "message": str(e)}


@app.post("/api/leads/update-pitch")
def update_pitch(request: UpdatePitchRequest):
    print(f"\n[!] Saving manually edited pitch for {request.whatsapp_link}")

    success = update_lead_pitch(request.whatsapp_link, request.new_pitch)

    if success:
        return {"status": "success", "message": "Pitch saved successfully."}
    else:
        return {"status": "error", "message": "Failed to save pitch."}


@app.get("/api/user/profile")
def fetch_profile(user_id: str):
    profile = check_and_eval_credits(user_id)
    if profile:
        return {"status": "success", "data": profile}
    return {"status": "error", "message": "Profile not found."}

@app.post("/api/user/settings")
def save_settings(request: SettingsRequest):
    success = update_user_settings(request.user_id, request.sadapay_link)
    if success:
        return {"status": "success", "message": "Settings saved successfully."}
    return {"status": "error", "message": "Failed to save settings."}


# --- ADMIN COMMAND PANEL ENDPOINTS ---

@app.get("/api/admin/users")
def get_all_users(requester_id: str):
    print(f"\n[!] ADMIN PROTOCOL: Fetch requested by ID {requester_id}")

    success, data = get_all_profiles(requester_id)

    if success:
        return {"status": "success", "data": data}
    else:
        return {"status": "error", "message": data}  # Contains the unauthorized error message


@app.post("/api/admin/users/update")
def update_user(request: AdminUpdateRequest):
    print(f"\n[!] ADMIN PROTOCOL: Update requested by {request.requester_id} for target {request.target_user_id}")

    success, message = update_user_tier(
        request.requester_id,
        request.target_user_id,
        request.new_role,
        request.standard_credits,
        request.ai_credits
    )

    if success:
        return {"status": "success", "message": message}
    else:
        return {"status": "error", "message": message}


@app.post("/api/admin/users/delete")
def delete_user_account(request: AdminDeleteRequest):
    print(f"\n[!] ADMIN PROTOCOL: Deletion requested by {request.requester_id} for target {request.target_user_id}")

    # 1. Verify admin clearance
    requester_profile = get_user_profile(request.requester_id)
    if not requester_profile or requester_profile.get('role') != 'admin':
        return {"status": "error", "message": "Unauthorized access."}

    try:
        # 2. Hard delete the user from auth.users (Supabase cascades this deletion to profiles)
        response = supabase.auth.admin.delete_user(request.target_user_id)
        return {"status": "success", "message": "User permanently deleted."}
    except Exception as e:
        print(f"[-] Admin Delete Error: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    print("🚀 Clarion Backend API Initializing on Port 8000...")
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)