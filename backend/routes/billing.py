"""
routes/billing.py  —  /billing/*
"""
import os, uuid, aiohttp
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional

from database.billing_models import (
    get_balance, top_up_balance, deduct_balance,
    get_all_plans, get_plan,
    get_promo_by_code, use_promo,
    get_active_subscription, activate_subscription,
    save_payment, get_payment_by_id, update_payment_status,
    save_chat_message, get_chat_messages,
    get_all_chats_for_manager, mark_messages_read
)

router = APIRouter(prefix="/billing")

YOOKASSA_SHOP_ID = os.getenv("YOOKASSA_SHOP_ID", "")
YOOKASSA_SECRET  = os.getenv("YOOKASSA_SECRET_KEY", "")
BOT_BASE_URL     = os.getenv("BOT_BASE_URL", "https://t.me/YourBot")
BOT_TOKEN        = os.getenv("TOKEN") or os.getenv("BOT_TOKEN", "")


# ── Статус ────────────────────────────────────────────────────────

@router.get("/status")
async def billing_status(user_id: int):
    balance = await get_balance(user_id)
    sub = await get_active_subscription(user_id)
    if sub:
        expires = datetime.fromisoformat(sub["expires_at"])
        days_left = max(0, (expires - datetime.now()).days)
        return {"active": True, "plan_name": sub.get("plan_name"),
                "expires_at": sub["expires_at"], "days_left": days_left, "balance": balance}
    return {"active": False, "balance": balance}


# ── Тарифы ────────────────────────────────────────────────────────

@router.get("/plans")
async def get_plans():
    return {"plans": await get_all_plans()}


# ── Пополнение ────────────────────────────────────────────────────

class TopupReq(BaseModel):
    user_id: int
    amount: float

@router.post("/topup")
async def create_topup(req: TopupReq):
    if req.amount < 10:
        return {"error": "Минимум 10₽"}
    payment_id = str(uuid.uuid4())
    url = await _create_yookassa_payment(req.amount, payment_id, f"Пополнение кошелька user {req.user_id}")
    if not url:
        return {"error": "Не удалось создать платёж ЮKassa. Проверьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env"}
    await save_payment(req.user_id, payment_id, req.amount, "pending")
    return {"payment_url": url, "payment_id": payment_id}


# ── Промокод ──────────────────────────────────────────────────────

class PromoReq(BaseModel):
    code: str

@router.post("/promo/check")
async def check_promo(req: PromoReq):
    promo = await get_promo_by_code(req.code)
    if not promo:
        return {"valid": False}
    return {"valid": True, "discount_percent": promo["discount_percent"], "code": promo["code"]}


# ── Покупка тарифа ────────────────────────────────────────────────

class SubscribeReq(BaseModel):
    user_id: int
    plan_id: str
    promo_code: Optional[str] = None

@router.post("/subscribe")
async def subscribe(req: SubscribeReq):
    plan = await get_plan(req.plan_id)
    if not plan:
        return {"success": False, "error": "Тариф не найден"}

    discount, promo = 0, None
    if req.promo_code:
        promo = await get_promo_by_code(req.promo_code)
        if promo:
            discount = promo["discount_percent"]

    final_price = round(plan["price"] * (1 - discount / 100), 2)
    ok = await deduct_balance(req.user_id, final_price)
    if not ok:
        bal = await get_balance(req.user_id)
        return {"success": False, "error": f"Недостаточно средств. На балансе {bal:.2f}₽, нужно {final_price}₽"}

    if promo:
        await use_promo(promo["code"])
    await activate_subscription(req.user_id, req.plan_id, plan["duration_days"], plan["name"])
    sub = await get_active_subscription(req.user_id)
    return {"success": True, "plan_name": plan["name"], "expires_at": sub["expires_at"] if sub else None}


# ── Вебхук ЮKassa ─────────────────────────────────────────────────

@router.post("/webhook/yookassa")
async def yookassa_webhook(payload: dict):
    if payload.get("event") != "payment.succeeded":
        return {"ok": True}
    obj = payload.get("object", {})
    amount = float(obj.get("amount", {}).get("value", 0))
    our_id = obj.get("metadata", {}).get("payment_id")
    if not our_id:
        return {"ok": True}
    existing = await get_payment_by_id(our_id)
    if not existing or existing.get("status") == "succeeded":
        return {"ok": True}
    user_id = existing["user_id"]
    await top_up_balance(user_id, amount)
    await update_payment_status(our_id, "succeeded")
    if BOT_TOKEN:
        try:
            async with aiohttp.ClientSession() as s:
                await s.post(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                             json={"chat_id": user_id,
                                   "text": f"✅ Кошелёк пополнен на <b>{amount:.0f}₽</b>!\nТеперь можно купить тариф.",
                                   "parse_mode": "HTML"})
        except Exception:
            pass
    return {"ok": True}


# ── Чат заказов — отправка текста ─────────────────────────────────

class SendMsgReq(BaseModel):
    from_id: int
    to_id: int
    text: Optional[str] = None
    file_id: Optional[str] = None
    file_name: Optional[str] = None

@router.post("/chat/send")
async def chat_send(req: SendMsgReq):
    if not req.text and not req.file_id:
        return {"success": False, "error": "Нет текста или файла"}
    msg_id = await save_chat_message(req.from_id, req.to_id, req.text, req.file_id, req.file_name)

    if BOT_TOKEN:
        try:
            notif = f"💬 Новое сообщение в заказе!\n{req.text or '[файл]'}"
            async with aiohttp.ClientSession() as s:
                await s.post(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                             json={"chat_id": req.to_id, "text": notif})
        except Exception:
            pass

    return {"success": True, "msg_id": msg_id}


# ── Чат заказов — отправка .pptx файла ───────────────────────────

@router.post("/chat/send-file")
async def chat_send_file(
    from_id: int = Form(...),
    to_id: int = Form(...),
    file: UploadFile = File(...)
):
    if not file.filename.endswith(".pptx"):
        return {"success": False, "error": "Только .pptx файлы"}

    if not BOT_TOKEN:
        return {"success": False, "error": "BOT_TOKEN не задан"}

    # Пересылаем файл через Telegram Bot API получателю
    file_bytes = await file.read()
    file_id_tg = None

    try:
        async with aiohttp.ClientSession() as session:
            # Отправляем файл получателю через бота
            form = aiohttp.FormData()
            form.add_field("chat_id", str(to_id))
            form.add_field("caption", f"📎 Презентация от менеджера: {file.filename}")
            form.add_field("document", file_bytes,
                           filename=file.filename,
                           content_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")

            resp = await session.post(
                f"https://api.telegram.org/bot{BOT_TOKEN}/sendDocument",
                data=form
            )
            data = await resp.json()
            if data.get("ok"):
                file_id_tg = data["result"]["document"]["file_id"]
    except Exception as e:
        print("FILE SEND ERROR:", e)
        return {"success": False, "error": "Ошибка отправки через Telegram"}

    # Сохраняем в чат
    msg_id = await save_chat_message(
        from_id=from_id,
        to_id=to_id,
        text=None,
        file_id=file_id_tg,
        file_name=file.filename
    )

    return {"success": True, "msg_id": msg_id, "file_id": file_id_tg}


# ── Чат заказов — получение сообщений ────────────────────────────

@router.get("/chat/messages")
async def chat_messages_route(user_a: int, user_b: int):
    await mark_messages_read(from_id=user_a, to_id=user_b)
    msgs = await get_chat_messages(user_a, user_b)
    return {"messages": msgs}

@router.get("/chat/orders")
async def chat_orders(manager_id: int):
    chats = await get_all_chats_for_manager(manager_id)
    return {"chats": chats}

@router.get("/chat/user-info")
async def chat_user_info(user_id: int):
    from database.models import get_user_profile
    profile = await get_user_profile(user_id)
    if not profile:
        return {"name": f"User {user_id}", "username": ""}
    name = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() or f"User {user_id}"
    return {"name": name, "username": profile.get("username", ""), "group": profile.get("group_number", "")}


# ── Внутренняя: создание платежа ЮKassa ───────────────────────────

async def _create_yookassa_payment(amount: float, payment_id: str, description: str):
    if not YOOKASSA_SHOP_ID or not YOOKASSA_SECRET:
        return None
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.yookassa.ru/v3/payments",
                json={"amount": {"value": f"{amount:.2f}", "currency": "RUB"},
                      "confirmation": {"type": "redirect", "return_url": BOT_BASE_URL},
                      "capture": True, "description": description,
                      "metadata": {"payment_id": payment_id}},
                auth=aiohttp.BasicAuth(YOOKASSA_SHOP_ID, YOOKASSA_SECRET),
                headers={"Idempotence-Key": payment_id}
            ) as resp:
                data = await resp.json()
                return data.get("confirmation", {}).get("confirmation_url")
    except Exception as e:
        print("YOOKASSA ERROR:", e)
        return None