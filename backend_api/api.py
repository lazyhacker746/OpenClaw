import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

from validators import validate_inputs
from scraper import run_scraper
from database import init_db, save_leads_to_db, get_all_leads

app = FastAPI(title="OpenClaw API", version="2.0")

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LeadRequest(BaseModel):
    city: str
    category: str
    target_leads: int
    min_reviews: int
    mode: str
    use_ai: bool
    sadapay_link: str


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
        results = run_scraper(clean_data)

        if results:
            export_dir = "exports"
            if not os.path.exists(export_dir):
                os.makedirs(export_dir)

            df = pd.DataFrame(results)
            filename = os.path.join(export_dir, f"ServerBackup_{clean_data['category']}_{clean_data['city']}.csv")
            df.to_csv(filename, index=False)
            # --------------------------------------------------------------

            save_leads_to_db(clean_data['city'], clean_data['category'], results)

            print(f"[+] SUCCESS: Extracted {len(results)} targets.")
            return {"status": "success", "data": results}
        else:
            print("[-] No targets acquired.")
            return {"status": "success", "data": []}

    except Exception as e:
        print(f"[!] SYSTEM FAILURE: {str(e)}")
        return {"status": "error", "message": [f"Scraping engine failed: {str(e)}"]}

@app.get("/api/history")
def get_history():
    print("[+] Fetching historical leads from database...")
    try:
        leads = get_all_leads()
        return {"status": "success", "data": leads}
    except Exception as e:
        print(f"[-] Database Error: {e}")
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    print("🚀 OpenClaw Backend API Initializing on Port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)