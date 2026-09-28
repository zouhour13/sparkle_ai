import logging
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..config import Settings, get_settings
from ..schemas import GeneratedContent, GeneratedHistoryItem
from ..security import CurrentUser, current_user
from ..services.generation import generate_marketing_content, normalize_jpeg
from ..services.supabase import SupabaseError, SupabaseService


router = APIRouter(tags=["generation"])
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
logger = logging.getLogger(__name__)


@router.get("/history", response_model=list[GeneratedHistoryItem])
async def history(
    user: CurrentUser = Depends(current_user),
    settings: Settings = Depends(get_settings),
):
    db = SupabaseService(settings)
    try:
        rows = await db.query(
            "generated_content",
            params={
                "user_id": f"eq.{user.id}",
                "select": (
                    "id,platform,tone,title,description,caption,cta,hashtags,"
                    "publish_storage_path,created_at"
                ),
                "order": "created_at.desc",
                "limit": "10",
            },
        )
        return [
            {
                "record_id": row["id"],
                "platform": row["platform"],
                "tone": row["tone"],
                "title": row["title"],
                "description": row["description"],
                "caption": row["caption"],
                "cta": row["cta"],
                "hashtags": row["hashtags"],
                "image_url": await db.signed_url(
                    row["publish_storage_path"], expires_in=86400
                ),
                "created_at": row["created_at"],
            }
            for row in rows
        ]
    except (SupabaseError, httpx.HTTPError) as exc:
        logger.warning("Generated history could not be loaded: %s", exc)
        raise HTTPException(status_code=503, detail="History is temporarily unavailable.") from exc


@router.delete("/history/{record_id}", status_code=204)
async def delete_history_item(
    record_id: UUID,
    user: CurrentUser = Depends(current_user),
    settings: Settings = Depends(get_settings),
):
    db = SupabaseService(settings)
    try:
        row = await db.one(
            "generated_content",
            {"id": f"eq.{record_id}", "user_id": f"eq.{user.id}"},
        )
        if not row:
            raise HTTPException(status_code=404, detail="History item not found.")
        await db.remove_files(
            [row["original_storage_path"], row["publish_storage_path"]]
        )
        await db.delete(
            "generated_content",
            {"id": f"eq.{record_id}", "user_id": f"eq.{user.id}"},
        )
    except HTTPException:
        raise
    except (SupabaseError, httpx.HTTPError) as exc:
        logger.warning("Generated history item could not be deleted: %s", exc)
        raise HTTPException(status_code=503, detail="History item could not be deleted.") from exc


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
        result["image_url"] = await db.signed_url(publish_path, expires_in=86400)
    except (SupabaseError, httpx.HTTPError) as exc:
        logger.warning("Generated content could not be persisted: %s", exc)
    return result
