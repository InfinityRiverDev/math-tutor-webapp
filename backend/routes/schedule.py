"""
routes/schedule.py  —  GET /schedule?user_id=...&date=YYYY-MM-DD

Запрашивает расписание у КНИТУ ONE используя данные юзера из MongoDB.
Возвращает структурированный JSON для miniapp.
"""
import aiohttp
from datetime import datetime, date, timedelta
from fastapi import APIRouter
from database.models import get_user_profile

router = APIRouter(prefix="/schedule")

ABBR_EMOJI = {
    "лекц": "📖", "лек": "📖",
    "пз": "✏️",  "пр": "✏️",  "сем": "✏️",
    "лр": "🔬",  "лаб": "🔬",
    "конс": "💬", "зач": "📝", "экз": "📝",
}


def _acad_year_start(d: date) -> date:
    return date(d.year if d.month >= 9 else d.year - 1, 9, 1)

def _week_num(d: date) -> int:
    s = _acad_year_start(d)
    mon0 = s - timedelta(days=s.weekday())
    return max(1, (d - mon0).days // 7 + 1)

def _acad_year(d: date) -> int:
    return _acad_year_start(d).year

def _weekday_from_str(s: str) -> int:
    try:
        return datetime.strptime(s, "%d.%m.%Y").isoweekday()
    except Exception:
        return 0

def _emoji(abbr: str) -> str:
    low = (abbr or "").lower()
    for k, v in ABBR_EMOJI.items():
        if k in low:
            return v
    return "📌"


async def _auth(login: str, password: str) -> str | None:
    try:
        async with aiohttp.ClientSession() as s:
            async with s.post(
                "https://rest.kstu.ru/restapi/login/",
                json={"username": login, "password": password},
                headers={"content-type": "application/json", "Referer": "https://one.kstu.ru/"},
            ) as r:
                d = await r.json()
                return d.get("token") or d.get("access")
    except Exception:
        return None


async def _fetch(token: str, group_id: int, week: int, year: int) -> dict:
    try:
        async with aiohttp.ClientSession() as s:
            async with s.post(
                "https://rest.kstu.ru/restapi/schedule/load-schedules/",
                headers={"authorization": f"Token {token}", "content-type": "application/json",
                         "Referer": "https://one.kstu.ru/"},
                json={"year": year, "list_groups": [group_id], "id_e": [], "numb_week": week},
            ) as r:
                d = await r.json()
                return d if isinstance(d, dict) else {}
    except Exception:
        return {}


def _parse(raw: dict) -> dict[str, list]:
    if not isinstance(raw, dict) or not raw.get("status"):
        return {}
    days: dict[int, list] = {}
    for slot_num, slot in raw.get("objects", {}).items():
        ts, te = slot.get("time_start", "?"), slot.get("time_end", "?")
        for lesson in slot.get("objects", []):
            wd = _weekday_from_str(lesson.get("date_lesson", ""))
            if not wd:
                wd = lesson.get("d_start_weekday", 0)
            if not wd:
                continue
            days.setdefault(wd, []).append({
                **lesson,
                "_time_start": ts,
                "_time_end":   te,
                "_slot_num":   int(slot_num),
                "_emoji":      _emoji(lesson.get("idk_lesson_abbr", "")),
            })
    for wd in days:
        days[wd].sort(key=lambda x: x.get("_slot_num", 0))
    # Ключи → строки для JSON
    return {str(k): v for k, v in days.items()}


@router.get("")
async def get_schedule(user_id: int, date: str = None):
    """
    GET /schedule?user_id=123
    GET /schedule?user_id=123&date=2026-04-15

    Ответ:
    {
      "ok": true,
      "week_num": 32,
      "days": {"1": [...пн], "3": [...ср]},
      "error": null
    }
    """
    profile = await get_user_profile(user_id)
    if not profile:
        return {"ok": False, "error": "Профиль не найден. Зарегистрируйтесь через бота.", "days": {}, "week_num": None}

    group_id = profile.get("group_id")
    login    = profile.get("knrtu_login")
    pwd      = profile.get("knrtu_password_raw")

    if not group_id:
        return {"ok": False, "error": "Группа не определена. Пройдите регистрацию заново.", "days": {}, "week_num": None}
    if not login or not pwd:
        return {"ok": False, "error": "Нет данных авторизации. Пройдите регистрацию заново.", "days": {}, "week_num": None}

    try:
        target = datetime.strptime(date, "%Y-%m-%d").date() if date else datetime.today().date()
    except Exception:
        target = datetime.today().date()

    token = await _auth(login, pwd)
    if not token:
        return {"ok": False, "error": "Не удалось авторизоваться в КНИТУ. Возможно, изменился пароль.", "days": {}, "week_num": None}

    week = _week_num(target)
    year = _acad_year(target)
    raw  = await _fetch(token, group_id, week, year)
    days = _parse(raw)

    return {"ok": True, "week_num": week, "days": days, "error": None}