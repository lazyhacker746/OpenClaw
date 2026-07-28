"""Top-level router composition."""

from fastapi import APIRouter

from app.api.routes import admin, generation, leads, users


api_router = APIRouter()
api_router.include_router(generation.router)
api_router.include_router(leads.router)
api_router.include_router(users.router)
api_router.include_router(admin.router)
