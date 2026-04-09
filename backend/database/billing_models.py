"""
database/billing_models.py
"""
from datetime import datetime, timedelta
from bson import ObjectId
from database.mongo import db

wallets       = db["wallets"]
plans         = db["plans"]
subscriptions = db["subscriptions"]
promo_codes   = db["promo_codes"]
payments      = db["payments"]
chat_messages = db["chat_messages"]


# ── Кошелёк ──────────────────────────────────────────────────────

async def get_balance(user_id: int) -> float:
    doc = await wallets.find_one({"user_id": user_id})
    return float(doc.get("balance", 0)) if doc else 0.0

async def top_up_balance(user_id: int, amount: float):
    await wallets.update_one({"user_id": user_id}, {"$inc": {"balance": amount}}, upsert=True)

async def deduct_balance(user_id: int, amount: float) -> bool:
    bal = await get_balance(user_id)
    if bal < amount:
        return False
    await wallets.update_one({"user_id": user_id}, {"$inc": {"balance": -amount}})
    return True


# ── Тарифы ───────────────────────────────────────────────────────

async def get_all_plans() -> list:
    result = []
    async for doc in plans.find({"active": True}):
        doc["_id"] = str(doc["_id"])
        result.append(doc)
    return result

async def get_plan(plan_id: str):
    try:
        doc = await plans.find_one({"_id": ObjectId(plan_id)})
    except Exception:
        return None
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

async def create_plan(name: str, price: float, duration_days: int, description: str = "") -> str:
    r = await plans.insert_one({
        "name": name, "price": price, "duration_days": duration_days,
        "description": description, "active": True,
        "created_at": datetime.now().isoformat()
    })
    return str(r.inserted_id)

async def update_plan(plan_id: str, **kwargs):
    await plans.update_one({"_id": ObjectId(plan_id)}, {"$set": kwargs})

async def delete_plan(plan_id: str):
    await plans.update_one({"_id": ObjectId(plan_id)}, {"$set": {"active": False}})


# ── Промокоды ─────────────────────────────────────────────────────

async def get_all_promo_codes() -> list:
    result = []
    async for doc in promo_codes.find({}):
        doc["_id"] = str(doc["_id"])
        result.append(doc)
    return result

async def get_promo_by_code(code: str):
    doc = await promo_codes.find_one({"code": code.upper(), "active": True})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

async def create_promo(code: str, discount_percent: int, max_uses: int = 0) -> str:
    r = await promo_codes.insert_one({
        "code": code.upper(), "discount_percent": discount_percent,
        "max_uses": max_uses, "uses_count": 0, "active": True,
        "created_at": datetime.now().isoformat()
    })
    return str(r.inserted_id)

async def delete_promo(promo_id: str):
    await promo_codes.update_one({"_id": ObjectId(promo_id)}, {"$set": {"active": False}})

async def use_promo(code: str):
    doc = await promo_codes.find_one({"code": code.upper()})
    if not doc:
        return
    new_count = doc.get("uses_count", 0) + 1
    upd = {"$set": {"uses_count": new_count}}
    if doc.get("max_uses", 0) > 0 and new_count >= doc["max_uses"]:
        upd["$set"]["active"] = False
    await promo_codes.update_one({"_id": doc["_id"]}, upd)


# ── Подписки ─────────────────────────────────────────────────────

async def get_active_subscription(user_id: int):
    now = datetime.now().isoformat()
    doc = await subscriptions.find_one({"user_id": user_id, "expires_at": {"$gt": now}})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

async def activate_subscription(user_id: int, plan_id: str, duration_days: int, plan_name: str):
    existing = await get_active_subscription(user_id)
    base = datetime.fromisoformat(existing["expires_at"]) if existing else datetime.now()
    new_expires = base + timedelta(days=duration_days)
    await subscriptions.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id, "plan_id": plan_id, "plan_name": plan_name,
            "activated_at": datetime.now().isoformat(), "expires_at": new_expires.isoformat()
        }},
        upsert=True
    )


# ── Платежи ───────────────────────────────────────────────────────

async def save_payment(user_id: int, payment_id: str, amount: float, status: str):
    await payments.insert_one({
        "user_id": user_id, "payment_id": payment_id,
        "amount": amount, "status": status, "created_at": datetime.now().isoformat()
    })

async def get_payment_by_id(payment_id: str):
    doc = await payments.find_one({"payment_id": payment_id})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

async def update_payment_status(payment_id: str, status: str):
    await payments.update_one(
        {"payment_id": payment_id},
        {"$set": {"status": status, "updated_at": datetime.now().isoformat()}}
    )


# ── Чат заказов ───────────────────────────────────────────────────

async def save_chat_message(from_id: int, to_id: int,
                             text: str = None, file_id: str = None, file_name: str = None) -> str:
    r = await chat_messages.insert_one({
        "from_id": from_id, "to_id": to_id,
        "text": text, "file_id": file_id, "file_name": file_name,
        "created_at": datetime.now().isoformat(), "read": False
    })
    return str(r.inserted_id)

async def get_chat_messages(user_a: int, user_b: int) -> list:
    query = {"$or": [
        {"from_id": user_a, "to_id": user_b},
        {"from_id": user_b, "to_id": user_a}
    ]}
    result = []
    async for doc in chat_messages.find(query).sort("created_at", 1):
        doc["_id"] = str(doc["_id"])
        result.append(doc)
    return result

async def get_all_chats_for_manager(manager_id: int) -> list:
    pipeline = [
        {"$match": {"$or": [{"to_id": manager_id}, {"from_id": manager_id}]}},
        {"$group": {
            "_id": {"$cond": [{"$eq": ["$from_id", manager_id]}, "$to_id", "$from_id"]},
            "last_msg": {"$last": "$text"},
            "last_time": {"$last": "$created_at"},
            "unread": {"$sum": {
                "$cond": [{"$and": [{"$eq": ["$to_id", manager_id]}, {"$eq": ["$read", False]}]}, 1, 0]
            }}
        }},
        {"$sort": {"last_time": -1}}
    ]
    result = []
    async for doc in chat_messages.aggregate(pipeline):
        doc["user_id"] = doc.pop("_id")
        result.append(doc)
    return result

async def mark_messages_read(from_id: int, to_id: int):
    await chat_messages.update_many(
        {"from_id": from_id, "to_id": to_id, "read": False},
        {"$set": {"read": True}}
    )