"""
routes/billing.py  —  /billing/*
Оригинал + Stars + Crypto
"""

import os
import uuid
import logging
import aiohttp
from datetime import datetime, timedelta
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
    get_all_chats_for_manager, mark_messages_read,
    payments, subscriptions
)
from database.mongo import db

router = APIRouter(prefix="/billing")
logger = logging.getLogger(__name__)

STARS_TO_RUB = float(os.getenv("STARS_TO_RUB", "1.75"))


def get_shop_id():      return os.getenv("YOOKASSA_SHOP_ID", "")
def get_secret():       return os.getenv("YOOKASSA_SECRET_KEY", "")
def get_bot_token():    return os.getenv("TOKEN") or os.getenv("BOT_TOKEN", "")
def get_crypto_token(): return os.getenv("CRYPTO_PAY_TOKEN", "")
def get_bot_username(): return os.getenv("BOT_USERNAME", "")

def get_return_url():
    return (
        os.getenv("WEBAPP_URL")
        or os.getenv("BACKEND_URL")
        or os.getenv("BOT_BASE_URL", "https://math-bot-todj.onrender.com")
    )


# ─────────────────────────────────────────────────────────────────
# ВСПОМОГАТЕЛЬНАЯ: сохраняем расширенный платёж в MongoDB напрямую
# ─────────────────────────────────────────────────────────────────

async def _save_payment_extended(
    user_id: int,
    payment_id: str,
    amount_rub: float,
    status: str,
    payment_type: str,      # "yookassa" | "stars" | "crypto"
    original_amount: float,
    currency: str,          # "RUB" | "XTR" | "USDT"
):
    await payments.insert_one({
        "user_id":         user_id,
        "payment_id":      payment_id,
        "amount":          amount_rub,      # обратная совместимость
        "amount_rub":      amount_rub,
        "original_amount": original_amount,
        "currency":        currency,
        "type":            payment_type,
        "status":          status,
        "credited":        False,
        "created_at":      datetime.now().isoformat(),
        "updated_at":      None,
    })


# ─────────────────────────────────────────────────────────────────
# Debug
# ─────────────────────────────────────────────────────────────────

@router.get("/debug")
async def billing_debug():
    shop_id = get_shop_id()
    secret  = get_secret()
    token   = get_bot_token()
    crypto  = get_crypto_token()
    return {
        "YOOKASSA_SHOP_ID":    (shop_id[:4] + "***") if shop_id else "НЕ ЗАДАН ❌",
        "YOOKASSA_SECRET_KEY": (secret[:8] + "***")  if secret  else "НЕ ЗАДАН ❌",
        "BOT_TOKEN":           (token[:10] + "***")  if token   else "НЕ ЗАДАН ❌",
        "CRYPTO_PAY_TOKEN":    (crypto[:8] + "***")  if crypto  else "НЕ ЗАДАН ❌",
        "STARS_TO_RUB":        STARS_TO_RUB,
        "return_url":          get_return_url(),
        "webhook_yookassa":    f"{get_return_url()}/billing/webhook/yookassa",
    }


# ─────────────────────────────────────────────────────────────────
# Статус подписки
# ─────────────────────────────────────────────────────────────────

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


# ─────────────────────────────────────────────────────────────────
# Тарифы
# ─────────────────────────────────────────────────────────────────

@router.get("/plans")
async def get_plans():
    return {"plans": await get_all_plans()}


# ─────────────────────────────────────────────────────────────────
# Пополнение — рублями (ЮКасса)
# ─────────────────────────────────────────────────────────────────

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
        return {
            "error": (
                "ЮКасса не настроена. "
                "Добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY "
                "в переменные окружения на Render."
            )
        }

    payment_id  = str(uuid.uuid4())
    payment_url = await _create_yookassa_payment(
        req.amount, payment_id,
        f"Пополнение кошелька MathTutor user {req.user_id}"
    )

    if not payment_url:
        return {
            "error": (
                "Не удалось создать платёж ЮКасса. "
                "Зайдите на /billing/debug и проверьте SHOP_ID и SECRET_KEY. "
                "Убедитесь что магазин активирован в личном кабинете ЮКасса."
            )
        }

    # Сохраняем через оригинальный save_payment (4 аргумента)
    await save_payment(req.user_id, payment_id, req.amount, "pending")
    logger.info(f"[TOPUP-RUB] user={req.user_id} amount={req.amount} id={payment_id}")
    return {"payment_url": payment_url, "payment_id": payment_id}


# ─────────────────────────────────────────────────────────────────
# Пополнение — Telegram Stars
# ─────────────────────────────────────────────────────────────────

class StarsTopupReq(BaseModel):
    user_id: int
    stars:   int

@router.post("/topup-stars")
async def create_topup_stars(req: StarsTopupReq):
    if req.stars < 1:
        return {"error": "Минимум 1 ⭐"}

    token = get_bot_token()
    if not token:
        return {"error": "Бот не настроен (TOKEN не задан)"}

    amount_rub = round(req.stars * STARS_TO_RUB, 2)
    payment_id = str(uuid.uuid4())

    try:
        async with aiohttp.ClientSession() as session:
            resp = await session.post(
                f"https://api.telegram.org/bot{token}/createInvoiceLink",
                json={
                    "title":       "Пополнение кошелька",
                    "description": f"{req.stars} ⭐ = {amount_rub}₽",
                    "payload":     f"topup_stars_{req.user_id}_{payment_id}",
                    "currency":    "XTR",
                    "prices":      [{"label": "Пополнение", "amount": req.stars}],
                }
            )
            data = await resp.json()
            if not data.get("ok"):
                return {"error": f"Telegram: {data.get('description', 'ошибка')}"}
            invoice_url = data["result"]
    except Exception as e:
        logger.error(f"[STARS] {e}")
        return {"error": str(e)}

    await _save_payment_extended(
        req.user_id, payment_id, amount_rub, "pending_stars",
        "stars", req.stars, "XTR"
    )
    return {"invoice_url": invoice_url, "payment_id": payment_id, "amount_rub": amount_rub}


# ─────────────────────────────────────────────────────────────────
# Вебхук Stars (successful_payment через бота)
# ─────────────────────────────────────────────────────────────────

@router.post("/webhook/stars")
async def stars_webhook(request: Request):
    try:
        payload = await request.json()
    except Exception:
        return {"ok": False}

    # pre_checkout_query
    if "pre_checkout_query" in payload:
        pcq_id = payload["pre_checkout_query"]["id"]
        token  = get_bot_token()
        if token:
            async with aiohttp.ClientSession() as s:
                await s.post(
                    f"https://api.telegram.org/bot{token}/answerPreCheckoutQuery",
                    json={"pre_checkout_query_id": pcq_id, "ok": True}
                )
        return {"ok": True}

    # successful_payment
    msg = payload.get("message", {})
    sp  = msg.get("successful_payment")
    if not sp:
        return {"ok": True}

    parts = sp.get("invoice_payload", "").split("_")
    if len(parts) >= 5 and parts[0] == "topup" and parts[1] == "stars":
        user_id    = int(parts[2])
        payment_id = "_".join(parts[3:])
        stars      = sp["total_amount"]
        amount_rub = round(stars * STARS_TO_RUB, 2)

        existing = await get_payment_by_id(payment_id)
        if existing and existing.get("status") != "succeeded":
            await top_up_balance(user_id, amount_rub)
            await update_payment_status(payment_id, "succeeded")
            logger.info(f"[STARS WEBHOOK] ✅ {stars}⭐={amount_rub}₽ → user {user_id}")
            token = get_bot_token()
            if token:
                try:
                    async with aiohttp.ClientSession() as s:
                        await s.post(
                            f"https://api.telegram.org/bot{token}/sendMessage",
                            json={
                                "chat_id": user_id,
                                "text":    f"⭐ <b>Stars получены!</b>\n{stars} ⭐ = {amount_rub:.0f}₽ зачислено.",
                                "parse_mode": "HTML"
                            }
                        )
                except Exception:
                    pass
    return {"ok": True}


# ─────────────────────────────────────────────────────────────────
# Пополнение — USDT (CryptoBot)
# ─────────────────────────────────────────────────────────────────

class CryptoTopupReq(BaseModel):
    user_id:     int
    amount_usdt: float

@router.post("/topup-crypto")
async def create_topup_crypto(req: CryptoTopupReq):
    if req.amount_usdt < 0.5:
        return {"error": "Минимум 0.5 USDT"}

    crypto_token = get_crypto_token()
    if not crypto_token:
        return {"error": "CryptoBot не настроен (CRYPTO_PAY_TOKEN не задан в .env)"}

    bot_username = get_bot_username()
    payment_id   = str(uuid.uuid4())

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://pay.crypt.bot/api/createInvoice",
                json={
                    "asset":         "USDT",
                    "amount":        str(req.amount_usdt),
                    "description":   f"Пополнение MathTutor user {req.user_id}",
                    "payload":       f"topup_crypto_{req.user_id}_{payment_id}",
                    "paid_btn_name": "openBot",
                    "paid_btn_url":  (
                        f"https://t.me/{bot_username}"
                        if bot_username else get_return_url()
                    ),
                },
                headers={"Crypto-Pay-API-Token": crypto_token}
            ) as resp:
                data = await resp.json()
                if not data.get("ok"):
                    return {"error": f"CryptoBot: {data}"}
                inv     = data["result"]
                pay_url = inv.get("pay_url") or inv.get("bot_invoice_url")
    except Exception as e:
        return {"error": str(e)}

    await _save_payment_extended(
        req.user_id, payment_id, 0, "pending_crypto",
        "crypto", req.amount_usdt, "USDT"
    )
    return {"pay_url": pay_url, "payment_id": payment_id}


# ─────────────────────────────────────────────────────────────────
# Вебхук CryptoBot
# ─────────────────────────────────────────────────────────────────

@router.post("/webhook/crypto")
async def crypto_webhook(request: Request):
    try:
        payload = await request.json()
    except Exception:
        return {"ok": False}

    if payload.get("update_type") != "invoice_paid":
        return {"ok": True}

    inv         = payload.get("payload", {})
    our_payload = inv.get("payload", "")
    parts       = our_payload.split("_")

    if len(parts) < 5 or parts[0] != "topup" or parts[1] != "crypto":
        return {"ok": True}

    user_id     = int(parts[2])
    payment_id  = "_".join(parts[3:])
    usdt_amount = float(inv.get("amount", 0))

    try:
        async with aiohttp.ClientSession() as s:
            r    = await s.get(
                "https://api.coingecko.com/api/v3/simple/price"
                "?ids=tether&vs_currencies=rub"
            )
            d    = await r.json()
            rate = float(d["tether"]["rub"])
    except Exception:
        rate = 90.0

    amount_rub = round(usdt_amount * rate, 2)
    existing   = await get_payment_by_id(payment_id)

    if existing and existing.get("status") != "succeeded":
        await top_up_balance(user_id, amount_rub)
        await update_payment_status(payment_id, "succeeded")
        logger.info(f"[CRYPTO WEBHOOK] ✅ {usdt_amount}USDT={amount_rub}₽ → user {user_id}")
        token = get_bot_token()
        if token:
            try:
                async with aiohttp.ClientSession() as s:
                    await s.post(
                        f"https://api.telegram.org/bot{token}/sendMessage",
                        json={
                            "chat_id": user_id,
                            "text":    f"₮ <b>Крипта получена!</b>\n{usdt_amount} USDT = {amount_rub:.0f}₽ зачислено.",
                            "parse_mode": "HTML"
                        }
                    )
            except Exception:
                pass
    return {"ok": True}


# ─────────────────────────────────────────────────────────────────
# Промокод
# ─────────────────────────────────────────────────────────────────

class PromoReq(BaseModel):
    code: str

@router.post("/promo/check")
async def check_promo(req: PromoReq):
    promo = await get_promo_by_code(req.code)
    if not promo:
        return {"valid": False}
    return {"valid": True, "discount_percent": promo["discount_percent"], "code": promo["code"]}


# ─────────────────────────────────────────────────────────────────
# Покупка тарифа
# ─────────────────────────────────────────────────────────────────

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
        return {"success": False,
                "error": f"Недостаточно средств. Баланс: {bal:.2f}₽, нужно: {final_price}₽"}

    if promo:
        await use_promo(promo["code"])

    await activate_subscription(
        req.user_id, req.plan_id, plan["duration_days"], plan["name"]
    )
    sub = await get_active_subscription(req.user_id)
    logger.info(f"[SUBSCRIBE] user={req.user_id} plan={plan['name']} price={final_price}")
    return {
        "success":    True,
        "plan_name":  plan["name"],
        "expires_at": sub["expires_at"] if sub else None,
    }


# ─────────────────────────────────────────────────────────────────
# Вебхук ЮКасса
# ─────────────────────────────────────────────────────────────────

@router.post("/webhook/yookassa")
async def yookassa_webhook(request: Request):
    try:
        payload = await request.json()
    except Exception as e:
        logger.error(f"[WEBHOOK YK] bad json: {e}")
        return {"ok": False}

    if payload.get("event") != "payment.succeeded":
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
    logger.info(f"[YK WEBHOOK] ✅ {amount}₽ → user {user_id}")

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
            logger.error(f"[YK WEBHOOK] notify error: {e}")

    return {"ok": True}


# ─────────────────────────────────────────────────────────────────
# Тестовое пополнение (только для разработки)
# ─────────────────────────────────────────────────────────────────

class TestTopupReq(BaseModel):
    user_id: int
    amount:  float
    secret:  str

@router.post("/webhook/test")
async def manual_topup_test(req: TestTopupReq):
    if req.secret != get_secret():
        return {"error": "Неверный секрет"}
    await top_up_balance(req.user_id, req.amount)
    return {"ok": True, "new_balance": await get_balance(req.user_id)}


# ─────────────────────────────────────────────────────────────────
# Чат заказов
# ─────────────────────────────────────────────────────────────────

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

    msg_id = await save_chat_message(
        req.from_id, req.to_id, req.text, req.file_id, req.file_name
    )
    token = get_bot_token()
    if token:
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    json={"chat_id": req.to_id,
                          "text":    f"💬 Новое сообщение!\n{req.text or '[файл]'}"}
                )
        except Exception:
            pass
    return {"success": True, "msg_id": msg_id}


@router.post("/chat/send-file")
async def chat_send_file(
    from_id: int        = Form(...),
    to_id:   int        = Form(...),
    file:    UploadFile = File(...)
):
    if not file.filename.endswith(".pptx"):
        return {"success": False, "error": "Только .pptx файлы"}

    token = get_bot_token()
    if not token:
        return {"success": False, "error": "BOT TOKEN не задан в .env"}

    file_bytes = await file.read()
    file_id_tg = None

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
                f"https://api.telegram.org/bot{token}/sendDocument", data=form
            )
            data = await resp.json()
            if data.get("ok"):
                file_id_tg = data["result"]["document"]["file_id"]
            else:
                return {"success": False, "error": "Telegram не принял файл"}
    except Exception as e:
        return {"success": False, "error": str(e)}

    msg_id = await save_chat_message(
        from_id=from_id, to_id=to_id,
        text=None, file_id=file_id_tg, file_name=file.filename
    )
    return {"success": True, "msg_id": msg_id, "file_id": file_id_tg}


@router.get("/chat/messages")
async def chat_messages_route(user_a: int, user_b: int):
    await mark_messages_read(from_id=user_a, to_id=user_b)
    return {"messages": await get_chat_messages(user_a, user_b)}


@router.get("/chat/orders")
async def chat_orders(manager_id: int):
    return {"chats": await get_all_chats_for_manager(manager_id)}


@router.get("/chat/user-info")
async def chat_user_info(user_id: int):
    from database.models import get_user_profile
    profile = await get_user_profile(user_id)
    if not profile:
        return {"name": f"User {user_id}", "username": "", "group": ""}
    name = (
        f"{profile.get('first_name','') or ''} "
        f"{profile.get('last_name','') or ''}".strip()
        or f"User {user_id}"
    )
    return {
        "name":     name,
        "username": profile.get("username", ""),
        "group":    profile.get("group_number", ""),
    }


# ─────────────────────────────────────────────────────────────────
# Утилита: создать платёж ЮКасса
# ─────────────────────────────────────────────────────────────────

async def _create_yookassa_payment(
    amount: float, payment_id: str, description: str
) -> Optional[str]:
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
                logger.info(f"[YOOKASSA] status={resp.status} resp={data}")
                if resp.status not in (200, 201):
                    logger.error(f"[YOOKASSA] error: {data}")
                    return None
                return data.get("confirmation", {}).get("confirmation_url")
    except Exception as e:
        logger.error(f"[YOOKASSA] exception: {e}")
        return None