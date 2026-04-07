from fastapi import APIRouter
from pydantic import BaseModel

from services.tutor import ask_tutor, ask_practice, clean_response
from database.models import get_history, add_message

router = APIRouter(prefix="/tutor")


class TutorRequest(BaseModel):
    text: str
    user_id: int


# 🎓 Репетитор (с историей)
@router.post("/")
async def tutor(req: TutorRequest):
    history = await get_history(req.user_id)

    full_text = ""

    async for chunk in ask_tutor(req.text, history):
        full_text += chunk

    # сохраняем диалог
    await add_message(req.user_id, "user", req.text)
    await add_message(req.user_id, "assistant", full_text)

    return {"answer": clean_response(full_text)}


# ✍️ Практика
@router.post("/practice")
async def practice(req: TutorRequest):
    full_text = ""

    async for chunk in ask_practice(req.text):
        full_text += chunk

    return {"answer": clean_response(full_text)}