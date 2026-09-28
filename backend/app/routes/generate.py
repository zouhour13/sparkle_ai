import logging
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..config import Settings, get_settings
from ..schemas import GeneratedContent
from ..security import CurrentUser, current_user
from ..services.generation import generate_marketing_content, normalize_jpeg
from ..services.supabase import SupabaseError, SupabaseService


router = APIRouter(tags=["generation"])
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
logger = logging.getLogger(__name__)


@router.post("/generate", response_model=GeneratedContent)
async def generate(
    image: UploadFile = File(...),
    platform: str = Form("instagram"),
    tone: str = Form("professional"),
    language: str = Form("english"),
    user: CurrentUser = Depends(current_user),
    settings: Settings = Depends(get_settings),
):
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Use a JPG, PNG, or WEBP image.")
    content = await image.read()
    if not content or len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be between 1 byte and 10 MB.")

    result = await generate_marketing_content(
        content,
        image.content_type,
        platform,
        tone,
        language,
        settings,
    )
    try:
        db = SupabaseService(settings)
        record_id = uuid4()
        extension = Path(image.filename or "product.jpg").suffix.lower() or ".jpg"
        original_path = f"{user.id}/{record_id}/original{extension}"
        publish_path = f"{user.id}/{record_id}/publish.jpg"
        await db.upload(original_path, content, image.content_type or "application/octet-stream")
        await db.upload(publish_path, normalize_jpeg(content), "image/jpeg")
        row = await db.insert(
            "generated_content",
            {
                "id": str(record_id),
                "user_id": user.id,
                "platform": platform,
                "tone": tone,
                "language": language,
                "title": result["title"],
                "description": result["description"],
                "caption": result["caption"],
                "cta": result["cta"],
                "hashtags": result["hashtags"],
                "detected_caption": result.get("detected_caption"),
                "original_storage_path": original_path,
                "publish_storage_path": publish_path,
                "created_at": datetime.now(UTC).isoformat(),
            },
        )
        result["record_id"] = row["id"]
        result["image_url"] = await db.signed_url(publish_path, expires_in=3600)
    except (SupabaseError, httpx.HTTPError) as exc:
        logger.warning("Generated content could not be persisted: %s", exc)
    return result
