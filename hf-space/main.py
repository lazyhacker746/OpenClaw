import pandas as pd
from validators import validate_inputs
from scraper import run_scraper


def handle_api_request(payload):
    print("\n--- INCOMING REQUEST ---")
    errors, clean_data = validate_inputs(payload)

    if errors:
        print("❌ VALIDATION FAILED:")
        for err in errors: print(f"  - {err}")
        return {"status": "error", "message": errors}

    print("✅ VALIDATION PASSED. Starting Scraper Engine...")
    results = run_scraper(clean_data)

    if results:
        # Save to CSV for now. In the future, we will return this JSON directly to React!
        df = pd.DataFrame(results)
        filename = f"{'Redesign' if clean_data['mode'] == '2' else 'NewWeb'}_{clean_data['category']}_{clean_data['city']}.csv"
        df.to_csv(filename, index=False)
        print(f"\n✅ Success! Saved {len(df)} leads to {filename}.")
        return {"status": "success", "data": results}
    else:
        print("\n❌ No shops matched your criteria.")
        return {"status": "success", "data": []}


if __name__ == "__main__":
    # Simulate the JSON payload that React will send
    react_payload = {
        "city": "Wah Cantt",
        "category": "Gym",
        "target_leads": 3,
        "min_reviews": 20,
        "mode": "1",  # "1" for No Website, "2" for Bad Website
        "use_ai": True,  # Make sure Ollama is running if this is True!
        "sadapay_link": "https://sadapay.pk/yourlink"
    }

    handle_api_request(react_payload)