"""
database/lectures_models.py
"""
from datetime import datetime
from bson import ObjectId
from database.mongo import db

subjects = db["subjects"]
lectures = db["lectures"]


# ── Предметы ─────────────────────────────────────────────────────

async def get_all_subjects() -> list:
    result = []
    async for doc in subjects.find({}):
        doc["_id"] = str(doc["_id"])
        result.append(doc)
    return result

async def add_subject(name: str) -> str:
    r = await subjects.insert_one({
        "name": name,
        "created_at": datetime.now().isoformat()
    })
    return str(r.inserted_id)

async def delete_subject(subject_id: str):
    await subjects.delete_one({"_id": ObjectId(subject_id)})
    # Удаляем все лекции этого предмета
    await lectures.delete_many({"subject_id": subject_id})


# ── Лекции ────────────────────────────────────────────────────────

async def get_lectures_by_subject(subject_id: str) -> list:
    result = []
    async for doc in lectures.find({"subject_id": subject_id}):
        doc["_id"] = str(doc["_id"])
        result.append(doc)
    return result

async def add_lecture(subject_id: str, title: str, content: str = "", file_id: str = None) -> str:
    r = await lectures.insert_one({
        "subject_id": subject_id,
        "title": title,
        "content": content,
        "file_id": file_id,
        "created_at": datetime.now().isoformat()
    })
    return str(r.inserted_id)

async def delete_lecture(lecture_id: str):
    await lectures.delete_one({"_id": ObjectId(lecture_id)})