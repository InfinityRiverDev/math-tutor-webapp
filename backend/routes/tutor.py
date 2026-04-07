from fastapi import APIRouter
from pydantic import BaseModel

from services.tutor import ask_tutor, clean_response

router = APIRouter(prefix="/tutor")


class TutorRequest(BaseModel):
    text: str
    history: list = []


@router.post("/")
async def tutor(req: TutorRequest):
    full_text = ""

    async for chunk in ask_tutor(req.text, req.history):
        full_text += chunk

    return {"answer": clean_response(full_text)}