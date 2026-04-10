"""
routes/admin_routes.py  —  /admin/*
"""
import os, asyncio, aiohttp
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from database.billing_models import (
    create_plan, update_plan, delete_plan, get_all_plans,
    create_promo, delete_promo, get_all_promo_codes,
)
from database.lectures_models import (
    get_all_subjects, add_subject, delete_subject,
    get_lectures_by_subject, delete_lecture,
)
from database.models import count_users, get_all_users

router = APIRouter(prefix="/admin")

# ВАЖНО: читаем через функцию, не при импорте модуля
def _token():
    return os.getenv("TOKEN") or os.getenv("BOT_TOKEN") or ""


# ── Статистика ────────────────────────────────────────────────────

@router.get("/users/count")
async def users_count():
    return {"count": await count_users()}


# ── Тарифы ───────────────────────────────────────────────────────

class PlanBody(BaseModel):
    name: str
    price: float
    duration_days: int
    description: Optional[str] = ""

@router.get("/plans")
async def admin_get_plans():
    return {"plans": await get_all_plans()}

@router.post("/plans")
async def admin_create_plan(body: PlanBody):
    pid = await create_plan(body.name, body.price, body.duration_days, body.description or "")
    return {"success": True, "plan_id": pid}

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
    return {"promos": await get_all_promo_codes()}

@router.post("/promos")
async def admin_create_promo(body: PromoBody):
    pid = await create_promo(body.code, body.discount_percent, body.max_uses or 0)
    return {"success": True, "promo_id": pid}

@router.delete("/promos/{promo_id}")
async def admin_delete_promo(promo_id: str):
    await delete_promo(promo_id)
    return {"success": True}


# ── Лекции ────────────────────────────────────────────────────────

class SubjectBody(BaseModel):
    name: str

@router.get("/lectures/subjects")
async def admin_get_subjects():
    return {"subjects": await get_all_subjects()}

@router.post("/lectures/subjects")
async def admin_add_subject(body: SubjectBody):
    sid = await add_subject(body.name)
    return {"success": True, "subject_id": sid}

@router.delete("/lectures/subjects/{subject_id}")
async def admin_del_subject(subject_id: str):
    await delete_subject(subject_id)
    return {"success": True}

@router.delete("/lectures/{lecture_id}")
async def admin_del_lecture(lecture_id: str):
    await delete_lecture(lecture_id)
    return {"success": True}


# ── Рассылка ──────────────────────────────────────────────────────

class BroadcastBody(BaseModel):
    text: str

@router.post("/broadcast")
async def admin_broadcast(body: BroadcastBody):
    token = _token()
    if not token:
        return {"success": False, "error": "TOKEN не найден в .env — добавьте TOKEN=ваш_токен_бота"}

    user_ids = await get_all_users()
    sent = failed = 0

    async with aiohttp.ClientSession() as session:
        for i, uid in enumerate(user_ids):
            try:
                r = await session.post(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    json={"chat_id": uid, "text": body.text, "parse_mode": "HTML"},
                )
                d = await r.json()
                if d.get("ok"):
                    sent += 1
                else:
                    failed += 1
            except Exception:
                failed += 1
            if (i + 1) % 25 == 0:
                await asyncio.sleep(1)

    return {"success": True, "sent": sent, "failed": failed, "total": len(user_ids)}