"""
routes/user.py  —  /user/*   (FastAPI, НЕ aiogram)
"""
from fastapi import APIRouter
from pydantic import BaseModel

from database.models import register_user, get_user_profile

router = APIRouter(prefix="/user")


class UserRequest(BaseModel):
    user_id: int
    username: str = ""


@router.post("/register")
async def register(req: UserRequest):
    await register_user(req.user_id, req.username)
    return {"status": "ok"}


@router.get("/{user_id}")
async def get_user(user_id: int):
    user = await get_user_profile(user_id)

    if not user:
        await register_user(user_id, "")
        user = await get_user_profile(user_id)

    if not user:
        return {"user": None}

    # Конвертируем ObjectId в строку
    user["_id"] = str(user["_id"])

    return {"user": user}