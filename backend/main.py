"""
main.py  —  FastAPI backend Math Tutor
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import calculator, tutor, user
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
app.include_router(billing_router)      # /billing/*
app.include_router(admin_router)        # /admin/* (старые роуты)
app.include_router(admin_stats_router)  # /admin/stats/*, /admin/users/search
app.include_router(schedule_router)     # /schedule
app.include_router(lectures_router)     # /lectures/*
app.include_router(music_router)        # /music/*


@app.get("/")
async def root():
    return {"status": "ok", "docs": "/docs", "billing_debug": "/billing/debug"}