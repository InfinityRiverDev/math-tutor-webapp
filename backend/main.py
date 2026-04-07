from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import calculator, tutor, user

app = FastAPI()

# 🔥 CORS (чтобы Vercel работал)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # потом можно ограничить
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# роуты
app.include_router(calculator.router)
app.include_router(tutor.router)
app.include_router(user.router)


@app.get("/")
async def root():
    return {"status": "ok"}