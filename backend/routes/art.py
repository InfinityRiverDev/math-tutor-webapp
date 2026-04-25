""" routes/art.py  —  Генерация изображений через Yandex ART """
import base64
from fastapi import APIRouter
from pydantic import BaseModel
from services.yandex_art import generate_image

router = APIRouter(prefix="/art")


class ArtRequest(BaseModel):
    prompt: str
    style: str = "DEFAULT"   # DEFAULT, ANIME, KANDINSKY


@router.post("/generate")
async def art_generate(req: ArtRequest):
    if not req.prompt.strip():
        return {"error": "Пустой промпт"}

    image_bytes = await generate_image(req.prompt.strip(), req.style)

    if image_bytes is None:
        return {"error": "Не удалось сгенерировать изображение"}

    # Возвращаем base64 изображения как data URL
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    return {"url": f"data:image/png;base64,{b64}"}