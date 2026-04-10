"""
routes/billing.py  —  /billing/*

ИСПРАВЛЕНИЯ в вебхуке:
1. Переменные окружения читаются через функцию os.getenv() при каждом вызове,
   а не один раз при импорте — так точно подхватывается .env
2. Добавлен эндпоинт /billing/webhook/test для ручной проверки зачисления
3. Добавлен /billing/debug для проверки что переменные окружения загружены
4. Исправлен URL вебхука — в ЮKassa надо прописать именно:
   https://ВАШ_ДОМЕН/billing/webhook/yookassa
"""

import os
import uuid
import logging
import aiohttp
from datetime import datetime
from fastapi import APIRouter, Request
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


def get_shop_id():      return os.getenv("YOOKASSA_SHOP_ID", "")
def get_secret():       return os.getenv("YOOKASSA_SECRET_KEY", "")
def get_bot_base_url(): return os.getenv("BOT_BASE_URL", "https://t.me/YourBot")
def get_bot_token():    return os.getenv("TOKEN") or os.getenv("BOT_TOKEN", "")


# ── Отладка (можно удалить после настройки) ───────────────────────

@router.get("/debug")
async def billing_debug():
    """Проверить что переменные окружения загружены правильно."""
    shop_id = get_shop_id()
    secret  = get_secret()
    token   = get_bot_token()
    return {
        "YOOKASSA_SHOP_ID":  shop_id[:4] + "***" if shop_id else "НЕ ЗАДАН ❌",
        "YOOKASSA_SECRET_KEY": secret[:8] + "***" if secret else "НЕ ЗАДАН ❌",
        "BOT_TOKEN":         token[:10] + "***" if token else "НЕ ЗАДАН ❌",
        "BOT_BASE_URL":      get_bot_base_url(),
        "webhook_url":       f"{get_bot_base_url()}/billing/webhook/yookassa",
    }


# ── Статус подписки + баланс ──────────────────────────────────────

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


# ── Пополнение — создание платежа ЮKassa ─────────────────────────

class TopupReq(BaseModel):
    user_id: int
    amount:  float

@router.post("/topup")
async def create_topup(req: TopupReq):
    if req.amount < 10:
        return {"error": "Минимум 10₽"}

    if not get_shop_id() or not get_secret():
        return {"error": "ЮKassa не настроена: проверьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env"}

    payment_id  = str(uuid.uuid4())
    payment_url = await _create_yookassa_payment(
        req.amount, payment_id,
        f"Пополнение кошелька MathTutor user {req.user_id}"
    )

    if not payment_url:
        return {"error": "Не удалось создать платёж. Проверьте /billing/debug"}

    await save_payment(req.user_id, payment_id, req.amount, "pending")
    logger.info(f"[TOPUP] user={req.user_id} amount={req.amount} payment_id={payment_id}")
    return {"payment_url": payment_url, "payment_id": payment_id}


# ── Проверка промокода ────────────────────────────────────────────

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


# ── Вебхук ЮKassa ─────────────────────────────────────────────────
# URL который нужно прописать в ЮKassa:
#   https://ВАШ_ДОМЕН/billing/webhook/yookassa
# Событие: payment.succeeded

@router.post("/webhook/yookassa")
async def yookassa_webhook(request: Request):
    """
    Принимает уведомления от ЮKassa.
    Зачисляет деньги на баланс после успешной оплаты.
    """
    try:
        payload = await request.json()
    except Exception as e:
        logger.error(f"[WEBHOOK] Не удалось прочитать JSON: {e}")
        return {"ok": False, "error": "invalid json"}

    logger.info(f"[WEBHOOK] Получено событие: {payload.get('event')}")

    event = payload.get("event")
    if event != "payment.succeeded":
        # Другие события (payment.waiting, refund.succeeded и тд) — просто ОК
        return {"ok": True}

    obj    = payload.get("object", {})
    amount = float(obj.get("amount", {}).get("value", 0))
    meta   = obj.get("metadata", {})
    our_id = meta.get("payment_id")

    logger.info(f"[WEBHOOK] payment.succeeded: amount={amount} our_id={our_id}")

    if not our_id:
        logger.error("[WEBHOOK] Нет payment_id в metadata — платёж создан не нашим сервером")
        return {"ok": True}

    # Идемпотентность — не зачислять дважды
    existing = await get_payment_by_id(our_id)
    if not existing:
        logger.error(f"[WEBHOOK] Платёж {our_id} не найден в БД")
        return {"ok": True}

    if existing.get("status") == "succeeded":
        logger.warning(f"[WEBHOOK] Платёж {our_id} уже обработан — пропускаем")
        return {"ok": True}

    user_id = existing["user_id"]

    # Зачисляем деньги
    await top_up_balance(user_id, amount)
    await update_payment_status(our_id, "succeeded")
    logger.info(f"[WEBHOOK] ✅ Зачислено {amount}₽ пользователю {user_id}")

    # Уведомляем пользователя в Telegram
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
            logger.error(f"[WEBHOOK] Не удалось отправить уведомление: {e}")

    return {"ok": True}


# ── Ручное тестирование зачисления (только для отладки!) ──────────

class TestTopupReq(BaseModel):
    user_id: int
    amount:  float
    secret:  str   # должен совпадать с YOOKASSA_SECRET_KEY для защиты

@router.post("/webhook/test")
async def manual_topup_test(req: TestTopupReq):
    """
    Эндпоинт для ручного тестирования зачисления без реального платежа.
    Удалите или закройте после настройки.
    Пример: POST /billing/webhook/test {"user_id":123,"amount":200,"secret":"ваш_секрет"}
    """
    if req.secret != get_secret():
        return {"error": "Неверный секрет"}
    await top_up_balance(req.user_id, req.amount)
    balance = await get_balance(req.user_id)
    return {"ok": True, "new_balance": balance}


# ── Чат заказов ───────────────────────────────────────────────────

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

    # Уведомляем получателя в Telegram
    token = get_bot_token()
    if token:
        try:
            notif = f"💬 Новое сообщение в заказе!\n{req.text or '[файл]'}"
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    json={"chat_id": req.to_id, "text": notif}
                )
        except Exception:
            pass

    return {"success": True, "msg_id": msg_id}


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


# ── Создание платежа в ЮKassa ─────────────────────────────────────

async def _create_yookassa_payment(amount: float, payment_id: str, description: str) -> Optional[str]:
    shop_id = get_shop_id()
    secret  = get_secret()
    base    = get_bot_base_url()

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.yookassa.ru/v3/payments",
                json={
                    "amount": {"value": f"{amount:.2f}", "currency": "RUB"},
                    "confirmation": {
                        "type":       "redirect",
                        "return_url": base,
                    },
                    "capture":     True,
                    "description": description,
                    "metadata":    {"payment_id": payment_id},
                },
                auth=aiohttp.BasicAuth(shop_id, secret),
                headers={"Idempotence-Key": payment_id},
            ) as resp:
                data = await resp.json()
                logger.info(f"[YOOKASSA] Ответ создания: status={resp.status} data={data}")
                if resp.status != 200:
                    logger.error(f"[YOOKASSA] Ошибка: {data}")
                    return None
                return data.get("confirmation", {}).get("confirmation_url")
    except Exception as e:
        logger.error(f"[YOOKASSA] Исключение: {e}")
        return None