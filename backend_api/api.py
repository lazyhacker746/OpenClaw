import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

# Import our existing engine modules
from validators import validate_inputs
from scraper import run_scraper

app = FastAPI(title="OpenClaw API", version="2.0")

# SECURITY: Configure CORS to allow your React frontend (port 5173) to talk to this API (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"], # Added '*' for Codespaces port forwarding
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the exact data structure we expect from the React form
class LeadRequest(BaseModel):
    city: str
    category: str
    target_leads: int
    min_reviews: int
    mode: str
    use_ai: bool
    sadapay_link: str

@app.post("/api/generate")
async def generate_leads(request: LeadRequest):
    print(f"\n[+] INCOMING REQUEST: Targeting {request.category} in {request.city}")
    
    # Convert Pydantic model to dictionary for our existing validator
    payload = request.model_dump()
    
    # 1. Run through the Bouncer (validators.py)
    errors, clean_data = validate_inputs(payload)
    if errors:
        print("[-] VALIDATION FAILED")
        return {"status": "error", "message": errors}

    # 2. Fire up the Engine (scraper.py + ai_engine.py)
    print("[+] VALIDATION PASSED. Engaging Playwright Scraper...")
    try:
        results = run_scraper(clean_data)
        
        if results:
            # We save a backup CSV on the server side just in case the browser crashes
            df = pd.DataFrame(results)
            filename = f"ServerBackup_{clean_data['category']}_{clean_data['city']}.csv"
            df.to_csv(filename, index=False)
            
            print(f"[+] SUCCESS: Extracted {len(results)} targets.")
            return {"status": "success", "data": results}
        else:
            print("[-] No targets acquired.")
            return {"status": "success", "data": []}
            
    except Exception as e:
        print(f"[!] SYSTEM FAILURE: {str(e)}")
        return {"status": "error", "message": [f"Scraping engine failed: {str(e)}"]}

if __name__ == "__main__":
    print("🚀 OpenClaw Backend API Initializing on Port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)