from fastapi import APIRouter
from pydantic import BaseModel

from services.calculator import solve_math

router = APIRouter(prefix="/calculator")


class CalcRequest(BaseModel):
    text: str


@router.post("/")
async def calculate(req: CalcRequest):
    result = await solve_math(req.text)
    return {"result": result}