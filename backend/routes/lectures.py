"""
routes/lectures.py  —  /lectures/*
"""
from fastapi import APIRouter
from database.lectures_models import get_all_subjects, get_lectures_by_subject

router = APIRouter(prefix="/lectures")

@router.get("/subjects")
async def subjects_list():
    return {"subjects": await get_all_subjects()}

@router.get("/by-subject/{subject_id}")
async def lectures_by_subject(subject_id: str):
    return {"lectures": await get_lectures_by_subject(subject_id)}