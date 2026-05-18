import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

# YOUR modular imports remain intact
from validators import validate_inputs
from scraper import run_scraper

# NEW Supabase database imports
from database import save_leads_to_db, get_user_vault,delete_user_lead

app = FastAPI(title="Clarion API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ⚠️ Hardcoded ACTIVE_USER_ID has been REMOVED for Multi-Tenancy!

class LeadRequest(BaseModel):
    city: str
    category: str
    target_leads: int
    min_reviews: int
    mode: str
    use_ai: bool
    sadapay_link: str
    user_id: str  # 👈 NEW: Catches the user identity from React

class DeleteRequest(BaseModel):
    whatsapp_link: str
    user_id: str  # 👈 NEW: Catches the user identity from React

@app.post("/api/generate")
def generate_leads(request: LeadRequest):
    print(f"\n[+] INCOMING REQUEST: Targeting {request.category} in {request.city}")

    payload = request.model_dump()
    errors, clean_data = validate_inputs(payload)

    if errors:
        print("[-] VALIDATION FAILED")
        return {"status": "error", "message": errors}

    print("[+] VALIDATION PASSED. Engaging Playwright Scraper...")
    try:
        # Run YOUR existing scraper.py logic
        results = run_scraper(clean_data)

        if results:
            # Keep your local CSV backup logic
            export_dir = "exports"
            os.makedirs(export_dir, exist_ok=True)
            df = pd.DataFrame(results)
            filename = os.path.join(export_dir, f"ServerBackup_{clean_data['category']}_{clean_data['city']}.csv")
            df.to_csv(filename, index=False)

            # --------------------------------------------------------------
            # Route to Supabase Cloud Vault
            print(f"[+] Routing {len(results)} leads to Clarion Cloud Vault for User {request.user_id}...")
            save_leads_to_db(
                city=clean_data['city'],
                category=clean_data['category'],
                leads=results,
                user_id=request.user_id # 👈 NEW: Uses the dynamic user ID
            )

            print(f"[+] SUCCESS: Extracted {len(results)} targets.")
            return {"status": "success", "data": results}
        else:
            print("[-] No targets acquired.")
            # Send an error back to the UI so it shows the red box
            return {"status": "error", "message": ["No leads found matching those exact filters."]}

    except Exception as e:
        print(f"[!] SYSTEM FAILURE: {str(e)}")
        return {"status": "error", "message": [f"Scraping engine failed: {str(e)}"]}


@app.post("/api/leads/delete")
def delete_lead(request: DeleteRequest):
    print(f"[!] User {request.user_id} is deleting lead: {request.whatsapp_link}")
    
    # 👈 Passes dynamic user_id to ensure they only delete THEIR leads
    success = delete_user_lead(request.user_id, request.whatsapp_link)
    
    if success:
        return {"status": "success", "message": "Lead permanently removed from vault."}
    else:
        return {"status": "error", "message": "Failed to delete lead from database."}

@app.get("/api/history")
def get_history(user_id: str): # 👈 NEW: Catches the ?user_id= query parameter
    print(f"[+] Fetching historical leads from Cloud Vault for User {user_id}...")
    try:
        # Fetch from Supabase using the dynamic user_id
        leads = get_user_vault(user_id)
        return {"status": "success", "data": leads}
    except Exception as e:
        print(f"[-] Database Error: {e}")
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    print("🚀 Clarion Backend API Initializing on Port 8000...")
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)