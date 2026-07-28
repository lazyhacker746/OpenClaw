"""Lead-generation orchestration extracted from the legacy API module.

The order of validation, credit checks, Playwright execution, CSV backup,
Supabase persistence, and credit deduction is intentionally unchanged in
Stage 1. CSV failure isolation is reserved for the separately approved Stage 2
hardening unit.
"""

import os
import uuid

import pandas as pd

from validators import validate_inputs


class GenerationService:
    def __init__(self, scraper, database, task_registry):
        self.scraper = scraper
        self.database = database
        self.task_registry = task_registry

    def start_search(self, request, background_tasks):
        print(
            f"\n[+] INCOMING REQUEST: Targeting {request.category} "
            f"in {request.city} for User {request.user_id}"
        )

        payload = request.model_dump()
        errors, clean_data = validate_inputs(payload)

        if errors:
            print("[-] VALIDATION FAILED")
            return {"status": "error", "message": errors}

        profile = self.database.check_and_eval_credits(request.user_id)
        if not profile:
            return {
                "status": "error",
                "message": ["Failed to authenticate your account tier profile."],
            }

        target_leads = clean_data.get("target_leads", 10)
        if profile["standard_credits"] < target_leads:
            return {
                "status": "error",
                "message": [
                    f"Insufficient search credits. You have {profile['standard_credits']} "
                    "remaining. Next reset in 3 days."
                ],
            }

        use_ai = clean_data.get("use_ai", True)
        if use_ai and profile["ai_credits"] < target_leads:
            return {
                "status": "error",
                "message": [
                    f"Insufficient AI copy generation credits. You have "
                    f"{profile['ai_credits']} left. Turn off AI or upgrade your tier."
                ],
            }

        print("[+] VALIDATION & SECURITY PASSED. Queuing Background Task...")

        task_id = str(uuid.uuid4())
        self.task_registry.set(
            task_id,
            {"status": "starting", "progress": "Initializing Playwright engine..."},
        )
        background_tasks.add_task(self.run_background_task, task_id, request, clean_data)

        return {"status": "processing", "task_id": task_id}

    def get_status(self, task_id: str):
        task_info = self.task_registry.get(task_id)
        if not task_info:
            return {"status": "error", "message": ["Invalid or expired Task ID."]}
        return task_info

    def run_background_task(self, task_id: str, request, clean_data: dict):
        print(f"\n[⚙️ WORKER] Starting Background Task: {task_id}")

        try:
            self.task_registry.set(
                task_id,
                {
                    "status": "processing",
                    "progress": (
                        f"Scraping {clean_data['category']} in {clean_data['city']}..."
                    ),
                },
            )

            results = self.scraper.run(clean_data)

            if results:
                self.task_registry.set(
                    task_id,
                    {"status": "processing", "progress": "Saving leads to Cloud Vault..."},
                )

                export_dir = "exports"
                os.makedirs(export_dir, exist_ok=True)
                df = pd.DataFrame(results)
                filename = os.path.join(
                    export_dir,
                    f"ServerBackup_{clean_data['category']}_{clean_data['city']}.csv",
                )
                df.to_csv(filename, index=False)

                print(
                    f"[+] Routing {len(results)} leads to Clarion Cloud Vault "
                    f"for User {request.user_id}..."
                )

                saved_count = self.database.save_leads_to_db(
                    city=clean_data["city"],
                    category=clean_data["category"],
                    leads=results,
                    user_id=request.user_id,
                )

                if saved_count > 0:
                    use_ai = clean_data.get("use_ai", True)
                    self.database.deduct_user_credits(
                        request.user_id,
                        saved_count,
                        use_ai,
                    )

                print(f"[+] SUCCESS: Task {task_id} completed.")
                self.task_registry.set(task_id, {"status": "success", "data": results})
            else:
                print("[-] No targets acquired.")
                self.task_registry.set(
                    task_id,
                    {
                        "status": "error",
                        "message": ["No leads found matching those exact filters."],
                    },
                )

        except Exception as exc:
            print(f"[!] SYSTEM FAILURE on Task {task_id}: {str(exc)}")
            self.task_registry.set(
                task_id,
                {
                    "status": "error",
                    "message": [f"Scraping engine failed: {str(exc)}"],
                },
            )
