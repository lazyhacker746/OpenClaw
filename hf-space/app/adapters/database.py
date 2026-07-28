"""Thin compatibility adapter for the existing ``database.py`` module.

The legacy module remains the source of truth for Supabase persistence, Vault
linking, duplicate behavior, credit calculations, and the 72-hour reset rule.
This adapter creates a replaceable dependency boundary without reimplementing
any of that behavior.
"""

from typing import List

import database as legacy_database


class LegacyDatabaseAdapter:
    @property
    def supabase(self):
        return legacy_database.supabase

    def save_leads_to_db(self, city: str, category: str, leads: list, user_id: str):
        return legacy_database.save_leads_to_db(city, category, leads, user_id)

    def get_user_vault(self, user_id: str):
        return legacy_database.get_user_vault(user_id)

    def delete_user_leads(self, user_id: str, whatsapp_links: List[str]):
        return legacy_database.delete_user_leads(user_id, whatsapp_links)

    def update_lead_pitch(self, whatsapp_link: str, new_pitch: str):
        return legacy_database.update_lead_pitch(whatsapp_link, new_pitch)

    def check_and_eval_credits(self, user_id: str):
        return legacy_database.check_and_eval_credits(user_id)

    def deduct_user_credits(self, user_id: str, leads_found: int, used_ai: bool):
        return legacy_database.deduct_user_credits(user_id, leads_found, used_ai)

    def get_user_profile(self, user_id: str):
        return legacy_database.get_user_profile(user_id)

    def update_user_settings(self, user_id: str, sadapay_link: str):
        return legacy_database.update_user_settings(user_id, sadapay_link)

    def get_all_profiles(self, requester_id: str):
        return legacy_database.get_all_profiles(requester_id)

    def update_user_tier(
        self,
        requester_id: str,
        target_user_id: str,
        new_role: str,
        standard_credits: int,
        ai_credits: int,
    ):
        return legacy_database.update_user_tier(
            requester_id,
            target_user_id,
            new_role,
            standard_credits,
            ai_credits,
        )
