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
from database import save_leads_to_db, get_user_vault, delete_user_leads

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
            save_leads_to_db(
                city=clean_data['city'],
                category=clean_data['category'],
                leads=results,
                user_id=request.user_id
            )

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
def generate_leads(request: LeadRequest, background_tasks: BackgroundTasks):  # 👈 Added BackgroundTasks injection
    print(f"\n[+] INCOMING REQUEST: Targeting {request.category} in {request.city}")

    payload = request.model_dump()
    errors, clean_data = validate_inputs(payload)

    if errors:
        print("[-] VALIDATION FAILED")
        return {"status": "error", "message": errors}

    print("[+] VALIDATION PASSED. Queuing Background Task...")

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


if __name__ == "__main__":
    print("🚀 Clarion Backend API Initializing on Port 8000...")
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)