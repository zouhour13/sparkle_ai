from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

from ..config import Settings
from ..providers.base import ProviderError, SocialMediaProvider
from ..providers.facebook import FacebookProvider
from ..providers.instagram import InstagramProvider
from ..security import TokenCipher
from .supabase import SupabaseService


class SocialService:
    def __init__(self, settings: Settings):
        self.db = SupabaseService(settings)
        self.cipher = TokenCipher(settings.social_token_encryption_key)
        self.providers: dict[str, SocialMediaProvider] = {
            "instagram": InstagramProvider(settings),
            "facebook": FacebookProvider(settings),
        }

    def provider(self, name: str) -> SocialMediaProvider:
        if name not in self.providers:
            raise ValueError("Unsupported social provider")
        return self.providers[name]

    async def upsert_account(self, user_id: str, provider: str, account: Any) -> dict[str, Any]:
        existing = await self.db.one(
            "social_accounts",
            {
                "user_id": f"eq.{user_id}",
                "provider": f"eq.{provider}",
                "provider_account_id": f"eq.{account.id}",
            },
        )
        values = {
            "user_id": user_id,
            "provider": provider,
            "provider_account_id": account.id,
            "account_name": account.name,
            "encrypted_access_token": self.cipher.encrypt(account.access_token),
            "token_expires_at": account.expires_at.isoformat() if account.expires_at else None,
            "provider_metadata": account.metadata,
            "status": "connected",
            "updated_at": datetime.now(UTC).isoformat(),
        }
        if existing:
            return await self.db.update(
                "social_accounts", {"id": f"eq.{existing['id']}", "user_id": f"eq.{user_id}"}, values
            ) or existing
        return await self.db.insert("social_accounts", values)

    async def process_publish_job(self, job_id: str, user_id: str) -> None:
        job = await self.db.one(
            "social_publish_jobs", {"id": f"eq.{job_id}", "user_id": f"eq.{user_id}"}
        )
        if not job or job["status"] not in {"pending", "processing"}:
            return
        await self.db.update(
            "social_publish_jobs",
            {"id": f"eq.{job_id}", "user_id": f"eq.{user_id}"},
            {"status": "processing", "attempts": int(job.get("attempts", 0)) + 1},
        )
        try:
            account = await self.db.one(
                "social_accounts",
                {"id": f"eq.{job['social_account_id']}", "user_id": f"eq.{user_id}"},
            )
            content = await self.db.one(
                "generated_content",
                {"id": f"eq.{job['generated_content_id']}", "user_id": f"eq.{user_id}"},
            )
            if not account or not content:
                raise ProviderError("The connected account or generated content no longer exists.", "not_found")
            token = self.cipher.decrypt(account["encrypted_access_token"])
            expires_at = account.get("token_expires_at")
            if expires_at and datetime.fromisoformat(expires_at.replace("Z", "+00:00")) <= datetime.now(UTC):
                refreshed = await self.provider(account["provider"]).refresh_credential(token)
                if refreshed is None:
                    raise ProviderError(
                        "This account connection expired. Reconnect it before publishing.",
                        code="token_expired",
                        reconnect=True,
                    )
                token = refreshed.access_token
                await self.db.update(
                    "social_accounts",
                    {"id": f"eq.{account['id']}", "user_id": f"eq.{user_id}"},
                    {
                        "encrypted_access_token": self.cipher.encrypt(token),
                        "token_expires_at": refreshed.expires_at.isoformat() if refreshed.expires_at else None,
                    },
                )
            image_url = await self.db.signed_url(content["publish_storage_path"], expires_in=3600)
            caption = job["caption"]
            hashtags = job.get("hashtags") or []
            if hashtags:
                caption = f"{caption.rstrip()}\n\n{' '.join(hashtags)}"
            result = await self.provider(account["provider"]).publish_photo(
                account["provider_account_id"], token, image_url, caption
            )
            await self.db.update(
                "social_publish_jobs",
                {"id": f"eq.{job_id}", "user_id": f"eq.{user_id}"},
                {
                    "status": "published",
                    "provider_post_id": result.post_id,
                    "provider_container_id": result.container_id,
                    "published_at": datetime.now(UTC).isoformat(),
                    "error_code": None,
                    "error_message": None,
                },
            )
        except ProviderError as exc:
            await self.db.update(
                "social_publish_jobs",
                {"id": f"eq.{job_id}", "user_id": f"eq.{user_id}"},
                {"status": "failed", "error_code": exc.code, "error_message": str(exc)},
            )
            if exc.reconnect and job:
                await self.db.update(
                    "social_accounts",
                    {"id": f"eq.{job['social_account_id']}", "user_id": f"eq.{user_id}"},
                    {"status": "reconnect_required"},
                )
        except Exception:
            await self.db.update(
                "social_publish_jobs",
                {"id": f"eq.{job_id}", "user_id": f"eq.{user_id}"},
                {
                    "status": "failed",
                    "error_code": "internal_error",
                    "error_message": "Publishing failed unexpectedly. Please try again.",
                },
            )

    def encrypt_candidates(self, accounts: list[Any]) -> str:
        data = [
            {
                "id": account.id,
                "name": account.name,
                "token": account.access_token,
                "expires_at": account.expires_at.isoformat() if account.expires_at else None,
                "metadata": account.metadata,
            }
            for account in accounts
        ]
        return self.cipher.encrypt(json.dumps(data))

    def decrypt_candidates(self, value: str) -> list[dict[str, Any]]:
        return json.loads(self.cipher.decrypt(value))
