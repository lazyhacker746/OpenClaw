"""Lead-generation and task-status routes."""

from fastapi import APIRouter, BackgroundTasks

from app.api.schemas import LeadRequest
from app.dependencies import generation_service


router = APIRouter()


@router.post("/api/generate")
def generate_leads(request: LeadRequest, background_tasks: BackgroundTasks):
    return generation_service.start_search(request, background_tasks)


@router.get("/api/status/{task_id}")
def get_status(task_id: str):
    return generation_service.get_status(task_id)
