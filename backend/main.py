"""
main.py  —  FastAPI backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import calculator, tutor, user
from routes.billing import router as billing_router
from routes.admin_routes import router as admin_router

app = FastAPI()

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
app.include_router(billing_router)   # /billing/*
app.include_router(admin_router)     # /admin/*


@app.get("/")
async def root():
    return {"status": "ok"}