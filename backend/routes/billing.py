"""
routes/billing.py  —  /billing/*

ВАЖНО для ЮКасса:
  - return_url должен быть URL бэкенда (math-bot-todj.onrender.com), НЕ t.me/...
  - В .env должны быть: YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY, BOT_BASE_URL, TOKEN
  - Webhook в ЮКасса: https://math-bot-todj.onrender.com/billing/webhook/yookassa
"""

import os
import uuid
import logging
import aiohttp
from datetime import datetime
from fastapi import APIRouter, Request, UploadFile, File, Form
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
logger = logging.getLogger(__name__)


def get_shop_id():   return os.getenv("YOOKASSA_SHOP_ID", "")
def get_secret():    return os.getenv("YOOKASSA_SECRET_KEY", "")
def get_bot_token(): return os.getenv("TOKEN") or os.getenv("BOT_TOKEN", "")

def get_return_url():
    """
    return_url для ЮКасса — должен быть HTTPS URL бэкенда или фронта, НЕ t.me.
    Берём из WEBAPP_URL (URL миниаппа на Vercel) или из BACKEND_URL.
    """
    return (
        os.getenv("WEBAPP_URL")        # https://your-miniapp.vercel.app
        or os.getenv("BACKEND_URL")    # https://math-bot-todj.onrender.com
        or os.getenv("BOT_BASE_URL",   "https://math-bot-todj.onrender.com")
    )


# ── Debug ─────────────────────────────────────────────────────────

@router.get("/debug")
async def billing_debug():
    shop_id    = get_shop_id()
    secret     = get_secret()
    token      = get_bot_token()
    return_url = get_return_url()
    return {
        "YOOKASSA_SHOP_ID":    shop_id[:4]  + "***" if shop_id    else "НЕ ЗАДАН ❌",
        "YOOKASSA_SECRET_KEY": secret[:8]   + "***" if secret     else "НЕ ЗАДАН ❌",
        "BOT_TOKEN":           token[:10]   + "***" if token      else "НЕ ЗАДАН ❌",
        "return_url":          return_url,
        "webhook_url":         "https://math-bot-todj.onrender.com/billing/webhook/yookassa",
        "note":                "Webhook в ЮКасса → URL для уведомлений должен быть: https://math-bot-todj.onrender.com/yookassa/webhook"
    }


# ── Статус ────────────────────────────────────────────────────────

@router.get("/status")
async def billing_status(user_id: int):
    balance = await get_balance(user_id)
    sub     = await get_active_subscription(user_id)
    if sub:
        expires   = datetime.fromisoformat(sub["expires_at"])
        days_left = max(0, (expires - datetime.now()).days)
        return {
            "active":     True,
            "plan_name":  sub.get("plan_name"),
            "expires_at": sub["expires_at"],
            "days_left":  days_left,
            "balance":    balance,
        }
    return {"active": False, "balance": balance}


# ── Тарифы ────────────────────────────────────────────────────────

@router.get("/plans")
async def get_plans():
    return {"plans": await get_all_plans()}


# ── Пополнение ────────────────────────────────────────────────────

class TopupReq(BaseModel):
    user_id: int
    amount:  float

@router.post("/topup")
async def create_topup(req: TopupReq):
    if req.amount < 10:
        return {"error": "Минимум 10₽"}

    shop_id = get_shop_id()
    secret  = get_secret()

    if not shop_id or not secret:
        return {"error": "ЮКасса не настроена. Добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env на Render"}

    payment_id  = str(uuid.uuid4())
    payment_url = await _create_yookassa_payment(
        req.amount, payment_id,
        f"Пополнение кошелька MathTutor user {req.user_id}"
    )

    if not payment_url:
        return {"error": "Не удалось создать платёж. Проверьте /billing/debug"}

    await save_payment(req.user_id, payment_id, req.amount, "pending")
    logger.info(f"[TOPUP] user={req.user_id} amount={req.amount} id={payment_id}")
    return {"payment_url": payment_url, "payment_id": payment_id}


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
    user_id:    int
    plan_id:    str
    promo_code: Optional[str] = None

@router.post("/subscribe")
async def subscribe(req: SubscribeReq):
    plan = await get_plan(req.plan_id)
    if not plan:
        return {"success": False, "error": "Тариф не найден"}

    discount = 0
    promo    = None
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
    logger.info(f"[SUBSCRIBE] user={req.user_id} plan={plan['name']} price={final_price}")
    return {"success": True, "plan_name": plan["name"], "expires_at": sub["expires_at"] if sub else None}


# ── Вебхук ЮКасса ─────────────────────────────────────────────────

@router.post("/webhook/yookassa")
async def yookassa_webhook(request: Request):
    try:
        payload = await request.json()
    except Exception as e:
        logger.error(f"[WEBHOOK] bad json: {e}")
        return {"ok": False}

    event = payload.get("event")
    if event != "payment.succeeded":
        return {"ok": True}

    obj    = payload.get("object", {})
    amount = float(obj.get("amount", {}).get("value", 0))
    meta   = obj.get("metadata", {})
    our_id = meta.get("payment_id")

    if not our_id:
        return {"ok": True}

    existing = await get_payment_by_id(our_id)
    if not existing or existing.get("status") == "succeeded":
        return {"ok": True}

    user_id = existing["user_id"]
    await top_up_balance(user_id, amount)
    await update_payment_status(our_id, "succeeded")
    logger.info(f"[WEBHOOK] ✅ Зачислено {amount}₽ → user {user_id}")

    token = get_bot_token()
    if token:
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    json={
                        "chat_id":    user_id,
                        "text":       f"✅ <b>Кошелёк пополнен на {amount:.0f}₽!</b>\n\nОткройте приложение — баланс уже обновлён.",
                        "parse_mode": "HTML",
                    }
                )
        except Exception as e:
            logger.error(f"[WEBHOOK] notify error: {e}")

    return {"ok": True}


# ── Тестовое пополнение (для разработки) ─────────────────────────

class TestTopupReq(BaseModel):
    user_id: int
    amount:  float
    secret:  str

@router.post("/webhook/test")
async def manual_topup_test(req: TestTopupReq):
    if req.secret != get_secret():
        return {"error": "Неверный секрет"}
    await top_up_balance(req.user_id, req.amount)
    balance = await get_balance(req.user_id)
    return {"ok": True, "new_balance": balance}


# ── Чат — отправка текста ─────────────────────────────────────────

class SendMsgReq(BaseModel):
    from_id:   int
    to_id:     int
    text:      Optional[str] = None
    file_id:   Optional[str] = None
    file_name: Optional[str] = None

@router.post("/chat/send")
async def chat_send(req: SendMsgReq):
    if not req.text and not req.file_id:
        return {"success": False, "error": "Нет текста или файла"}

    msg_id = await save_chat_message(req.from_id, req.to_id, req.text, req.file_id, req.file_name)

    token = get_bot_token()
    if token:
        try:
            notif = f"💬 Новое сообщение!\n{req.text or '[файл]'}"
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    json={"chat_id": req.to_id, "text": notif}
                )
        except Exception:
            pass

    return {"success": True, "msg_id": msg_id}


# ── Чат — отправка .pptx файла ────────────────────────────────────

@router.post("/chat/send-file")
async def chat_send_file(
    from_id: int      = Form(...),
    to_id:   int      = Form(...),
    file:    UploadFile = File(...)
):
    if not file.filename.endswith(".pptx"):
        return {"success": False, "error": "Только .pptx файлы"}

    token = get_bot_token()
    if not token:
        return {"success": False, "error": "BOT TOKEN не задан в .env"}

    file_bytes  = await file.read()
    file_id_tg  = None

    try:
        async with aiohttp.ClientSession() as session:
            form = aiohttp.FormData()
            form.add_field("chat_id", str(to_id))
            form.add_field("caption", f"📎 Презентация: {file.filename}")
            form.add_field(
                "document", file_bytes,
                filename=file.filename,
                content_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
            )
            resp = await session.post(
                f"https://api.telegram.org/bot{token}/sendDocument",
                data=form
            )
            data = await resp.json()
            if data.get("ok"):
                file_id_tg = data["result"]["document"]["file_id"]
            else:
                logger.error(f"[SEND-FILE] TG error: {data}")
                return {"success": False, "error": "Telegram не принял файл"}
    except Exception as e:
        logger.error(f"[SEND-FILE] exception: {e}")
        return {"success": False, "error": str(e)}

    msg_id = await save_chat_message(
        from_id=from_id, to_id=to_id,
        text=None, file_id=file_id_tg, file_name=file.filename
    )
    return {"success": True, "msg_id": msg_id, "file_id": file_id_tg}


# ── Чат — получение сообщений ─────────────────────────────────────

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
    name = f"{profile.get('first_name','') or ''} {profile.get('last_name','') or ''}".strip() or f"User {user_id}"
    return {"name": name, "username": profile.get("username",""), "group": profile.get("group_number","")}


# ── Создание платежа ЮКасса ───────────────────────────────────────

async def _create_yookassa_payment(amount: float, payment_id: str, description: str) -> Optional[str]:
    shop_id    = get_shop_id()
    secret     = get_secret()
    return_url = get_return_url()

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.yookassa.ru/v3/payments",
                json={
                    "amount":       {"value": f"{amount:.2f}", "currency": "RUB"},
                    "confirmation": {"type": "redirect", "return_url": return_url},
                    "capture":      True,
                    "description":  description,
                    "metadata":     {"payment_id": payment_id},
                },
                auth=aiohttp.BasicAuth(shop_id, secret),
                headers={"Idempotence-Key": payment_id},
            ) as resp:
                data = await resp.json()
                logger.info(f"[YOOKASSA] status={resp.status} data={data}")
                if resp.status not in (200, 201):
                    logger.error(f"[YOOKASSA] error: {data}")
                    return None
                return data.get("confirmation", {}).get("confirmation_url")
    except Exception as e:
        logger.error(f"[YOOKASSA] exception: {e}")
        return None