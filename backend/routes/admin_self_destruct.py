"""
routes/admin_self_destruct.py — Полное удаление базы данных
"""
import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/admin")

# Секретные ключи (из переменных окружения или хардкод)
ADMIN_KEYS = {
    1991833177: os.getenv("SELF_DESTRUCT_KEY_1", "MathDestroy2024!"),
    808603029:  os.getenv("SELF_DESTRUCT_KEY_2", "TutorWipeX#Secure"),
    1114949712: os.getenv("SELF_DESTRUCT_KEY_3", "StudyBot-Reset99"),
}


class SelfDestructRequest(BaseModel):
    admin_id: int
    keys: List[str]


@router.post("/self-destruct")
async def self_destruct(req: SelfDestructRequest):
    # Проверяем, что id в списке админов
    if req.admin_id not in ADMIN_KEYS:
        return {"success": False, "error": "Нет прав на самоликвидацию"}
    
    # Проверяем, что все три ключа совпадают
    valid_keys = set(ADMIN_KEYS.values())
    entered_keys = set(req.keys)
    
    if len(entered_keys) != 3:
        return {"success": False, "error": "Требуется ровно 3 ключа"}
    
    if entered_keys != valid_keys:
        return {"success": False, "error": "Неверные ключи"}
    
    # Удаляем ВСЕ коллекции из базы данных
    from database.mongo import db
    
    collections = await db.list_collection_names()
    deleted_count = 0
    total_docs = 0
    
    for col_name in collections:
        count = await db[col_name].count_documents({})
        total_docs += count
        await db[col_name].drop()
        deleted_count += 1
    
    return {
        "success": True,
        "collections_deleted": deleted_count,
        "documents_deleted": total_docs,
    }