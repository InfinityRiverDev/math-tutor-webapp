from fastapi import APIRouter
from pydantic import BaseModel

from database.models import get_user_profile, register_user

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
    return {"user": user}