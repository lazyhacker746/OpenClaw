"""Request models shared by Clarion route modules.

Pydantic's default extra-field behavior is intentionally preserved. The React
client may send harmless additional fields, so this pass does not enable
``extra='forbid'``.
"""

from typing import List

from pydantic import BaseModel


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
    whatsapp_links: List[str]
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
