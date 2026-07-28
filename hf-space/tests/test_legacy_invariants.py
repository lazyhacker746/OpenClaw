import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from support import install_external_stubs

install_external_stubs()

import database
import scraper
from app.adapters import ai as ai_adapter


ROOT = Path(__file__).resolve().parents[1]


class RecordingQuery:
    def __init__(self, client, table_name):
        self.client = client
        self.table_name = table_name
        self.operation = None
        self.payload = None
        self.on_conflict = None
        self.filters = []

    def upsert(self, payload, on_conflict=None):
        self.operation = "upsert"
        self.payload = payload
        self.on_conflict = on_conflict
        return self

    def update(self, payload):
        self.operation = "update"
        self.payload = payload
        return self

    def select(self, columns):
        self.operation = "select"
        self.payload = columns
        return self

    def eq(self, column, value):
        self.filters.append((column, value))
        return self

    def execute(self):
        self.client.calls.append(
            {
                "table": self.table_name,
                "operation": self.operation,
                "payload": self.payload,
                "on_conflict": self.on_conflict,
                "filters": self.filters,
            }
        )
        if self.table_name == "master_leads" and self.operation == "upsert":
            return SimpleNamespace(data=[{"id": 42}])
        if self.table_name == "profiles" and self.operation == "select":
            return SimpleNamespace(data=[self.client.profile])
        if self.table_name == "profiles" and self.operation == "update":
            updated = dict(self.client.profile)
            updated.update(self.payload)
            return SimpleNamespace(data=[updated])
        return SimpleNamespace(data=[{"ok": True}])


class RecordingSupabase:
    def __init__(self, profile=None):
        self.calls = []
        self.profile = profile or {}

    def table(self, name):
        return RecordingQuery(self, name)


class LegacyInvariantTests(unittest.TestCase):
    def test_playwright_pin_is_unchanged(self):
        requirements = (ROOT / "requirements.txt").read_text()
        self.assertIn("playwright==1.44.0", requirements.splitlines())

    def test_scraper_selectors_waits_scrolling_and_social_rules_are_frozen(self):
        source = (ROOT / "scraper.py").read_text()
        required_fragments = [
            "a[href*=\"/maps/place/\"]",
            "h1.DUwDvf",
            "a[data-item-id=\"authority\"]",
            "div.F7nice",
            "button[data-item-id*=\"phone:tel:\"]",
            "button[role=\"tab\"]",
            "span.wiI7pd",
            "time.sleep(5)",
            "time.sleep(3)",
            "time.sleep(2)",
            "page.mouse.wheel(0, 10000)",
            "time.sleep(4)",
            "no_new_data_counter >= 3",
            "facebook.com",
            "instagram.com",
            "twitter.com",
            "linkedin.com",
        ]
        for fragment in required_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, source)

    def test_phone_formatting_behavior_is_unchanged(self):
        self.assertEqual(scraper.format_whatsapp_link("0300 1234567"), "https://wa.me/923001234567")
        self.assertEqual(scraper.format_whatsapp_link("+92 300 1234567"), "https://wa.me/923001234567")
        self.assertEqual(scraper.format_whatsapp_link(""), "No phone number")

    def test_ai_adapter_delegates_without_changing_arguments(self):
        expected = ("strength", "weakness", "pitch")
        with patch.object(ai_adapter, "_legacy_generate_pitch", return_value=expected) as legacy:
            actual = ai_adapter.generate_pitch(
                "Shop",
                ["Review"],
                "link",
                "1",
                ["fault"],
                True,
                3,
            )
        self.assertEqual(actual, expected)
        legacy.assert_called_once_with(
            "Shop",
            ["Review"],
            "link",
            "1",
            ["fault"],
            True,
            3,
        )

    def test_ai_prompt_tone_and_required_ending_are_frozen(self):
        source = (ROOT / "ai_engine.py").read_text()
        self.assertIn("conversational Roman Urdu", source)
        self.assertIn("DO NOT use overly dramatic words", source)
        self.assertIn("Agar aap ready hain, toh let's start:", source)
        self.assertIn('model="gpt-4o"', source)
        self.assertIn('response_format={ "type": "json_object" }', source)

    def test_duplicate_upserts_continue_to_count_each_successful_link(self):
        fake = RecordingSupabase()
        leads = [
            {"Business Name": "Same", "WhatsApp Link": "https://wa.me/1"},
            {"Business Name": "Same", "WhatsApp Link": "https://wa.me/1"},
        ]

        with patch.object(database, "supabase", fake):
            saved_count = database.save_leads_to_db("Taxila", "Gym", leads, "user-1")

        self.assertEqual(saved_count, 2)
        master_calls = [call for call in fake.calls if call["table"] == "master_leads"]
        link_calls = [call for call in fake.calls if call["table"] == "user_unlocked_leads"]
        self.assertEqual(len(master_calls), 2)
        self.assertEqual(len(link_calls), 2)
        self.assertTrue(all(call["on_conflict"] == "whatsapp_link" for call in master_calls))
        self.assertTrue(
            all(call["on_conflict"] == "user_id, lead_id" for call in link_calls)
        )
        self.assertEqual(
            set(master_calls[0]["payload"]),
            {
                "city",
                "category",
                "business_name",
                "review_count",
                "website_status",
                "whatsapp_link",
                "ai_strength",
                "ai_weakness",
                "pitch",
            },
        )
        self.assertEqual(
            link_calls[0]["payload"],
            {"user_id": "user-1", "lead_id": 42},
        )

    def test_no_phone_number_literal_is_not_filtered(self):
        fake = RecordingSupabase()
        leads = [{"Business Name": "No Phone", "WhatsApp Link": "No phone number"}]

        with patch.object(database, "supabase", fake):
            saved_count = database.save_leads_to_db("Taxila", "Gym", leads, "user-1")

        self.assertEqual(saved_count, 1)
        master_call = next(call for call in fake.calls if call["table"] == "master_leads")
        self.assertEqual(master_call["payload"]["whatsapp_link"], "No phone number")

    def test_coordinate_city_persistence_uses_fourth_segment_uppercase(self):
        fake = RecordingSupabase()
        leads = [{"Business Name": "Map Lead", "WhatsApp Link": "https://wa.me/2"}]

        with patch.object(database, "supabase", fake):
            database.save_leads_to_db(
                "coords:33.7,72.8,5,Taxila",
                "Gym",
                leads,
                "user-1",
            )

        master_call = next(call for call in fake.calls if call["table"] == "master_leads")
        self.assertEqual(master_call["payload"]["city"], "TAXILA")

    def test_72_hour_pro_reset_values_are_unchanged(self):
        profile = {
            "id": "user-1",
            "role": "pro",
            "standard_credits": 0,
            "ai_credits": 0,
            "last_reset_date": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat(),
        }
        fake = RecordingSupabase(profile=profile)

        with patch.object(database, "supabase", fake):
            result = database.check_and_eval_credits("user-1")

        self.assertEqual(result["standard_credits"], 500)
        self.assertEqual(result["ai_credits"], 100)
        update_call = next(
            call
            for call in fake.calls
            if call["table"] == "profiles" and call["operation"] == "update"
        )
        self.assertEqual(update_call["payload"]["standard_credits"], 500)
        self.assertEqual(update_call["payload"]["ai_credits"], 100)


if __name__ == "__main__":
    unittest.main()
