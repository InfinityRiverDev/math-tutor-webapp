"""
routes/admin_stats.py  —  /admin/stats/* and /admin/users/search
"""
import os
import re
from fastapi import APIRouter
from database.mongo import db, users
from database.billing_models import subscriptions, payments, promo_codes
from database.models import count_users
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin")


# ── Статистика пользователей ──────────────────────────────────────

@router.get("/stats/users")
async def admin_stats_users():
    now = datetime.now()
    today = now.strftime("%Y-%m-%d")
    month = now.strftime("%Y-%m")
    week_ago = (now - timedelta(days=7)).isoformat()

    total    = await users.count_documents({})
    with_sub = await subscriptions.count_documents({"expires_at": {"$gt": now.isoformat()}})
    new_today = await users.count_documents({"first_seen": {"$gte": today}})
    new_month = await users.count_documents({"first_seen": {"$gte": month}})
    new_week  = await users.count_documents({"first_seen": {"$gte": week_ago}})

    return {
        "total":     total,
        "with_sub":  with_sub,
        "no_sub":    total - with_sub,
        "new_today": new_today,
        "new_week":  new_week,
        "new_month": new_month,
    }


# ── Финансовая статистика ─────────────────────────────────────────

@router.get("/stats/finance")
async def admin_stats_finance():
    now   = datetime.now()
    month = now.strftime("%Y-%m")
    today = now.strftime("%Y-%m-%d")

    all_payments = []
    async for p in payments.find({"status": "succeeded"}):
        all_payments.append(p)

    total_revenue = sum(p.get("amount_rub", p.get("amount", 0)) for p in all_payments)
    month_revenue = sum(
        p.get("amount_rub", p.get("amount", 0)) for p in all_payments
        if p.get("created_at", "").startswith(month)
    )
    today_revenue = sum(
        p.get("amount_rub", p.get("amount", 0)) for p in all_payments
        if p.get("created_at", "").startswith(today)
    )

    # Разбивка по типам оплаты
    by_type = {"rub": {"total": 0, "count": 0}, "stars": {"total": 0, "count": 0}, "crypto": {"total": 0, "count": 0}}
    for p in all_payments:
        t = p.get("type", p.get("currency", "rub"))
        if "XTR" in str(t) or "stars" in str(t).lower():
            key = "stars"
        elif "USDT" in str(t) or "crypto" in str(t).lower():
            key = "crypto"
        else:
            key = "rub"
        amt = p.get("amount_rub", p.get("amount", 0))
        by_type[key]["total"] += amt
        by_type[key]["count"] += 1

    # Продажи по тарифам
    plan_sales = {}
    async for sub in subscriptions.find({}):
        pname = sub.get("plan_name", "Неизвестный")
        if pname not in plan_sales:
            plan_sales[pname] = {"count": 0}
        plan_sales[pname]["count"] += 1

    active_subs = await subscriptions.count_documents({"expires_at": {"$gt": now.isoformat()}})

    promo_stats = []
    async for promo in promo_codes.find({}):
        promo_stats.append({
            "code":     promo.get("code", ""),
            "discount": promo.get("discount_percent", 0),
            "uses":     promo.get("uses_count", 0),
            "active":   promo.get("active", False),
        })

    return {
        "total_revenue": total_revenue,
        "month_revenue": month_revenue,
        "today_revenue": today_revenue,
        "payment_count": len(all_payments),
        "active_subs":   active_subs,
        "plan_sales":    plan_sales,
        "promo_stats":   promo_stats,
        "by_type":       by_type,
    }


# ── Статистика активности ─────────────────────────────────────────

@router.get("/stats/activity")
async def admin_stats_activity():
    activity_log = db["activity_log"]
    now   = datetime.now()
    today = now.strftime("%Y-%m-%d")
    month = now.strftime("%Y-%m")

    actions = {
        "tutor":      "🎓 ИИ-репетитор",
        "practice":   "✍️ Практика",
        "calc":       "🧮 Калькулятор",
        "pomodoro":   "🍅 Помодоро",
        "music":      "🎵 Музыка",
        "todo":       "✅ To-Do",
        "lecture":    "📖 Лекции",
        "schedule":   "📆 Расписание",
        "attendance": "📍 Посещаемость",
    }

    result = {}
    for action, label in actions.items():
        total = await activity_log.count_documents({"action": action})
        day   = await activity_log.count_documents({"action": action, "date": today})
        mon   = await activity_log.count_documents({"action": action, "month": month})
        result[action] = {"label": label, "total": total, "today": day, "month": mon}

    return result


# ── Поиск пользователей ───────────────────────────────────────────

@router.get("/users/search")
async def admin_search_users(q: str = ""):
    """
    Поиск по:
    - числовой ID (точное совпадение)
    - first_name / last_name (регистронезависимый)
    - group_number (точное совпадение)
    """
    q = q.strip()
    if not q:
        return {"users": []}

    conditions = []

    # Числовой ID
    if q.isdigit():
        conditions.append({"user_id": int(q)})

    # Имя / фамилия
    pattern = {"$regex": re.escape(q), "$options": "i"}
    conditions.append({"first_name": pattern})
    conditions.append({"last_name": pattern})
    conditions.append({"username": pattern})
    conditions.append({"group_number": pattern})

    query = {"$or": conditions} if len(conditions) > 1 else conditions[0]

    result = []
    async for doc in users.find(query).limit(30):
        doc["_id"] = str(doc["_id"])
        # Убираем пароли из ответа
        doc.pop("knrtu_password", None)
        doc.pop("knrtu_password_raw", None)
        result.append(doc)

    return {"users": result}


# ── Кол-во пользователей ─────────────────────────────────────────

@router.get("/users/count")
async def users_count():
    return {"count": await count_users()}