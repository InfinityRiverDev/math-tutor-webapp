"""
routes/billing.py
FastAPI роуты для кошелька, тарифов, промокодов и подписок.

Добавить в main.py:
    from routes import billing, admin_billing
    app.include_router(billing.router)
    app.include_router(admin_billing.router)
"""

import os
import uuid
import aiohttp
from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel

from database.billing_models import (
    get_balance, get_wallet,
    top_up_balance, deduct_balance,
    get_all_plans, get_plan,
    get_promo_by_code, use_promo,
    get_active_subscription, activate_subscription,
    save_payment, get_payment_by_id, update_payment_status
)

router = APIRouter(prefix="/billing")

YOOKASSA_SHOP_ID = os.getenv("YOOKASSA_SHOP_ID", "")
YOOKASSA_SECRET  = os.getenv("YOOKASSA_SECRET_KEY", "")
BOT_BASE_URL     = os.getenv("BOT_BASE_URL", "https://t.me/YourBot")


# ── Статус подписки + баланс ─────────────────────────────────────

@router.get("/status")
async def billing_status(user_id: int):
    balance = await get_balance(user_id)
    sub = await get_active_subscription(user_id)

    if sub:
        expires = datetime.fromisoformat(sub["expires_at"])
        days_left = max(0, (expires - datetime.now()).days)
        return {
            "active": True,
            "plan_name": sub.get("plan_name"),
            "expires_at": sub["expires_at"],
            "days_left": days_left,
            "balance": balance,
        }
    return {"active": False, "balance": balance}


# ── Список тарифов ───────────────────────────────────────────────

@router.get("/plans")
async def get_plans():
    plans = await get_all_plans()
    return {"plans": plans}


# ── Пополнение: создание платежа ────────────────────────────────

class TopupRequest(BaseModel):
    user_id: int
    amount: float

@router.post("/topup")
async def create_topup(req: TopupRequest):
    if req.amount < 10:
        return {"error": "Минимум 10₽"}

    payment_id = str(uuid.uuid4())
    payment_url = await _create_yookassa_payment(req.amount, payment_id, f"Пополнение кошелька user {req.user_id}")

    if not payment_url:
        return {"error": "Не удалось создать платёж"}

    await save_payment(req.user_id, payment_id, req.amount, "pending")
    return {"payment_url": payment_url, "payment_id": payment_id}


# ── Проверка промокода ───────────────────────────────────────────

class PromoCheckRequest(BaseModel):
    code: str

@router.post("/promo/check")
async def check_promo(req: PromoCheckRequest):
    promo = await get_promo_by_code(req.code)
    if not promo:
        return {"valid": False}
    return {"valid": True, "discount_percent": promo["discount_percent"], "code": promo["code"]}


# ── Покупка тарифа ───────────────────────────────────────────────

class SubscribeRequest(BaseModel):
    user_id: int
    plan_id: str
    promo_code: str | None = None

@router.post("/subscribe")
async def subscribe(req: SubscribeRequest):
    plan = await get_plan(req.plan_id)
    if not plan:
        return {"success": False, "error": "Тариф не найден"}

    discount = 0
    promo = None
    if req.promo_code:
        promo = await get_promo_by_code(req.promo_code)
        if promo:
            discount = promo["discount_percent"]

    final_price = round(plan["price"] * (1 - discount / 100), 2)

    ok = await deduct_balance(req.user_id, final_price)
    if not ok:
        balance = await get_balance(req.user_id)
        return {"success": False, "error": f"Недостаточно средств. На балансе {balance:.2f}₽"}

    if promo:
        await use_promo(promo["code"])

    await activate_subscription(req.user_id, req.plan_id, plan["duration_days"], plan["name"])
    sub = await get_active_subscription(req.user_id)

    return {
        "success": True,
        "plan_name": plan["name"],
        "expires_at": sub["expires_at"] if sub else None
    }


# ── ЮKassa вебхук ────────────────────────────────────────────────

@router.post("/webhook/yookassa")
async def yookassa_webhook_fastapi(payload: dict):
    """
    Альтернативный вебхук через FastAPI (если не используешь aiohttp).
    Зарегистрируй этот URL в ЮKassa: POST /billing/webhook/yookassa
    """
    event = payload.get("event")
    obj = payload.get("object", {})

    if event != "payment.succeeded":
        return {"ok": True}

    amount = float(obj.get("amount", {}).get("value", 0))
    metadata = obj.get("metadata", {})
    our_payment_id = metadata.get("payment_id")

    if not our_payment_id:
        return {"ok": True}

    existing = await get_payment_by_id(our_payment_id)
    if not existing or existing.get("status") == "succeeded":
        return {"ok": True}  # идемпотентность

    user_id = existing["user_id"]
    await top_up_balance(user_id, amount)
    await update_payment_status(our_payment_id, "succeeded")

    return {"ok": True}


# ── Внутренняя функция: создание платежа ЮKassa ─────────────────

async def _create_yookassa_payment(amount: float, payment_id: str, description: str) -> str | None:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.yookassa.ru/v3/payments",
                json={
                    "amount": {"value": f"{amount:.2f}", "currency": "RUB"},
                    "confirmation": {"type": "redirect", "return_url": BOT_BASE_URL},
                    "capture": True,
                    "description": description,
                    "metadata": {"payment_id": payment_id}
                },
                auth=aiohttp.BasicAuth(YOOKASSA_SHOP_ID, YOOKASSA_SECRET),
                headers={"Idempotence-Key": payment_id}
            ) as resp:
                data = await resp.json()
                return data.get("confirmation", {}).get("confirmation_url")
    except Exception as e:
        print("YOOKASSA ERROR:", e)
        return None