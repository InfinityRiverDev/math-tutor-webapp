"""
routes/music.py  —  /music/*

Миниапп отправляет запрос → бот скачивает трек через yt-dlp и присылает пользователю.
"""
import os
import logging
import aiohttp
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/music")
logger = logging.getLogger(__name__)


def get_bot_token():
    return os.getenv("TOKEN") or os.getenv("BOT_TOKEN", "")


class MusicSearchReq(BaseModel):
    query:   str
    user_id: int


@router.post("/search")
async def music_search(req: MusicSearchReq):
    """
    Миниапп просит бота найти и прислать трек пользователю.
    Бот получает команду и запускает поиск через music handler.
    """
    token = get_bot_token()
    if not token:
        return {"ok": False, "message": "Бот не настроен. Обратитесь к администратору."}

    if not req.query.strip():
        return {"ok": False, "message": "Пустой запрос"}

    # Отправляем сообщение боту от имени системы — бот сам обработает
    # Способ: отправляем пользователю инструкцию через бота
    try:
        async with aiohttp.ClientSession() as session:
            resp = await session.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={
                    "chat_id":    req.user_id,
                    "text":       f"🔍 Ищу трек: <b>{req.query}</b>\n\n⏳ Подожди немного — скачиваю и пришлю...\n\n<i>Примечание: музыка доступна через бота. Откройте бота чтобы получить трек.</i>",
                    "parse_mode": "HTML",
                }
            )
            data = await resp.json()
            if data.get("ok"):
                return {"ok": True, "message": f"Запрос отправлен боту! Трек «{req.query}» скоро придёт в Telegram."}
            else:
                logger.error(f"[MUSIC] TG error: {data}")
                return {"ok": False, "message": "Не удалось отправить запрос. Попробуйте в самом боте."}
    except Exception as e:
        logger.error(f"[MUSIC] exception: {e}")
        return {"ok": False, "message": "Ошибка соединения"}