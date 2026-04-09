"""
routes/admin_routes.py  —  /admin/*
"""
import os
import aiohttp
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from database.models import count_users, get_all_users
from database.billing_models import (
    get_all_plans, get_plan, create_plan, update_plan, delete_plan,
    get_all_promo_codes, create_promo, delete_promo,
)
from database.mongo import db

router = APIRouter(prefix="/admin")

BOT_TOKEN = os.getenv("TOKEN") or os.getenv("BOT_TOKEN", "")

lectures_col  = db["lectures"]
subjects_col  = db["subjects"]


# ── Статистика ────────────────────────────────────────────────────

@router.get("/users/count")
async def users_count():
    total = await count_users()
    return {"count": total}


# ── Тарифы ───────────────────────────────────────────────────────

class PlanBody(BaseModel):
    name: str
    price: float
    duration_days: int
    description: Optional[str] = ""

@router.post("/plans")
async def admin_create_plan(body: PlanBody):
    plan_id = await create_plan(body.name, body.price, body.duration_days, body.description or "")
    return {"success": True, "plan_id": plan_id}

@router.put("/plans/{plan_id}")
async def admin_update_plan(plan_id: str, body: PlanBody):
    await update_plan(plan_id, name=body.name, price=body.price,
                      duration_days=body.duration_days, description=body.description or "")
    return {"success": True}

@router.delete("/plans/{plan_id}")
async def admin_delete_plan(plan_id: str):
    await delete_plan(plan_id)
    return {"success": True}


# ── Промокоды ─────────────────────────────────────────────────────

class PromoBody(BaseModel):
    code: str
    discount_percent: int
    max_uses: Optional[int] = 0

@router.get("/promos")
async def admin_get_promos():
    promos = await get_all_promo_codes()
    return {"promos": promos}

@router.post("/promos")
async def admin_create_promo(body: PromoBody):
    promo_id = await create_promo(body.code, body.discount_percent, body.max_uses or 0)
    return {"success": True, "promo_id": promo_id}

@router.delete("/promos/{promo_id}")
async def admin_delete_promo(promo_id: str):
    await delete_promo(promo_id)
    return {"success": True}


# ── Лекции / Предметы ─────────────────────────────────────────────

from bson import ObjectId
from datetime import datetime

class SubjectBody(BaseModel):
    name: str

@router.post("/lectures/subjects")
async def admin_add_subject(body: SubjectBody):
    existing = await subjects_col.find_one({"name": body.name})
    if existing:
        return {"success": False, "error": "Предмет с таким именем уже существует"}
    r = await subjects_col.insert_one({"name": body.name, "created_at": datetime.now().isoformat()})
    return {"success": True, "subject_id": str(r.inserted_id)}

@router.delete("/lectures/subjects/{subject_id}")
async def admin_delete_subject(subject_id: str):
    try:
        await subjects_col.delete_one({"_id": ObjectId(subject_id)})
        await lectures_col.delete_many({"subject_id": subject_id})
    except Exception:
        return {"success": False, "error": "Неверный ID"}
    return {"success": True}

@router.delete("/lectures/{lecture_id}")
async def admin_delete_lecture(lecture_id: str):
    try:
        await lectures_col.delete_one({"_id": ObjectId(lecture_id)})
    except Exception:
        return {"success": False, "error": "Неверный ID"}
    return {"success": True}


# ── Рассылка ──────────────────────────────────────────────────────

class BroadcastBody(BaseModel):
    text: str

@router.post("/broadcast")
async def broadcast(body: BroadcastBody):
    if not BOT_TOKEN:
        return {"success": False, "error": "BOT_TOKEN не задан в .env"}

    user_ids = await get_all_users()
    sent = 0
    failed = 0

    async with aiohttp.ClientSession() as session:
        for uid in user_ids:
            try:
                resp = await session.post(
                    f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                    json={"chat_id": uid, "text": body.text, "parse_mode": "HTML"}
                )
                data = await resp.json()
                if data.get("ok"):
                    sent += 1
                else:
                    failed += 1
            except Exception:
                failed += 1

    return {"success": True, "sent": sent, "failed": failed}