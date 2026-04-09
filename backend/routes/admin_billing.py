"""
routes/admin_billing.py
Админские эндпоинты: тарифы, промокоды, лекции, рассылка.
"""

import asyncio
from fastapi import APIRouter
from pydantic import BaseModel

from database.billing_models import (
    create_plan, update_plan, delete_plan, get_all_plans, get_plan,
    create_promo, delete_promo, get_all_promo_codes
)
from database.lectures_models import (
    get_all_subjects, add_subject, delete_subject,
    get_lectures_by_subject, delete_lecture
)
from database.models import count_users, get_all_users

router = APIRouter(prefix="/admin")

# ── Статистика ───────────────────────────────────────────────────

@router.get("/users/count")
async def users_count():
    total = await count_users()
    return {"count": total}


# ── Тарифы ───────────────────────────────────────────────────────

class PlanBody(BaseModel):
    name: str
    price: float
    duration_days: int
    description: str = ""

@router.post("/plans")
async def admin_create_plan(body: PlanBody):
    plan_id = await create_plan(body.name, body.price, body.duration_days, body.description)
    return {"success": True, "plan_id": plan_id}

@router.put("/plans/{plan_id}")
async def admin_update_plan(plan_id: str, body: PlanBody):
    await update_plan(plan_id, name=body.name, price=body.price,
                      duration_days=body.duration_days, description=body.description)
    return {"success": True}

@router.delete("/plans/{plan_id}")
async def admin_delete_plan(plan_id: str):
    await delete_plan(plan_id)
    return {"success": True}


# ── Промокоды ────────────────────────────────────────────────────

class PromoBody(BaseModel):
    code: str
    discount_percent: int
    max_uses: int = 0

@router.get("/promos")
async def admin_get_promos():
    promos = await get_all_promo_codes()
    return {"promos": promos}

@router.post("/promos")
async def admin_create_promo(body: PromoBody):
    promo_id = await create_promo(body.code, body.discount_percent, body.max_uses)
    return {"success": True, "promo_id": promo_id}

@router.delete("/promos/{promo_id}")
async def admin_delete_promo(promo_id: str):
    await delete_promo(promo_id)
    return {"success": True}


# ── Лекции (предметы) ────────────────────────────────────────────

class SubjectBody(BaseModel):
    name: str

@router.post("/lectures/subjects")
async def admin_add_subject(body: SubjectBody):
    subject_id = await add_subject(body.name)
    return {"success": True, "subject_id": subject_id}

@router.delete("/lectures/subjects/{subject_id}")
async def admin_delete_subject(subject_id: str):
    await delete_subject(subject_id)
    return {"success": True}

@router.delete("/lectures/{lecture_id}")
async def admin_delete_lecture_route(lecture_id: str):
    await delete_lecture(lecture_id)
    return {"success": True}


# ── Рассылка ─────────────────────────────────────────────────────

class BroadcastBody(BaseModel):
    text: str

@router.post("/broadcast")
async def admin_broadcast(body: BroadcastBody):
    """
    Рассылает текст всем пользователям через Telegram Bot API напрямую.
    Требует BOT_TOKEN в окружении.
    """
    import os, aiohttp
    token = os.getenv("BOT_TOKEN") or os.getenv("TOKEN")
    if not token:
        return {"success": False, "error": "BOT_TOKEN не задан"}

    user_ids = await get_all_users()
    sent, failed = 0, 0

    async with aiohttp.ClientSession() as session:
        for i, user_id in enumerate(user_ids):
            try:
                async with session.post(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    json={"chat_id": user_id, "text": body.text, "parse_mode": "HTML"}
                ) as resp:
                    data = await resp.json()
                    if data.get("ok"):
                        sent += 1
                    else:
                        failed += 1
            except Exception:
                failed += 1

            if (i + 1) % 25 == 0:
                await asyncio.sleep(1)  # анти-флуд

    return {"success": True, "sent": sent, "failed": failed, "total": len(user_ids)}