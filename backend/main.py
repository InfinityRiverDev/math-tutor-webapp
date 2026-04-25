"""
main.py  —  FastAPI backend Math Tutor
"""
import sys
import os
from pathlib import Path

# Добавляем корень проекта (src/) в sys.path,
# чтобы работали импорты из services/ и database/
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import calculator, tutor, user, art   # ← art добавлен
from routes.billing      import router as billing_router
from routes.admin_routes import router as admin_router
from routes.admin_stats  import router as admin_stats_router
from routes.schedule     import router as schedule_router
from routes.lectures     import router as lectures_router
from routes.music_route  import router as music_router

app = FastAPI(title="Math Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calculator.router)
app.include_router(tutor.router)
app.include_router(user.router)
app.include_router(billing_router)
app.include_router(admin_router)
app.include_router(admin_stats_router)
app.include_router(schedule_router)
app.include_router(lectures_router)
app.include_router(music_router)
app.include_router(art.router)          # ← регистрируем art

@app.get("/")
async def root():
    return {"status": "ok", "docs": "/docs", "billing_debug": "/billing/debug"}