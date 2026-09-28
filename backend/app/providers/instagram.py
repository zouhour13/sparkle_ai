import asyncio
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

import httpx

from ..config import Settings
from .base import OAuthCredential, ProviderAccount, ProviderError, PublishResult, SocialMediaProvider


class InstagramProvider(SocialMediaProvider):
    scopes = ("instagram_business_basic", "instagram_business_content_publish")

    def __init__(self, settings: Settings):
        self.client_id = settings.instagram_app_id
        self.client_secret = settings.instagram_app_secret
        self.redirect_uri = settings.instagram_redirect_uri
        self.graph = f"https://graph.instagram.com/{settings.meta_graph_api_version}"

    def authorization_url(self, state: str) -> str:
        query = urlencode(
            {
                "client_id": self.client_id,
                "redirect_uri": self.redirect_uri,
                "response_type": "code",
                "scope": ",".join(self.scopes),
                "state": state,
            }
        )
        return f"https://www.instagram.com/oauth/authorize?{query}"

    async def exchange_code(self, code: str) -> OAuthCredential:
        async with httpx.AsyncClient(timeout=30) as client:
            short = await client.post(
                "https://api.instagram.com/oauth/access_token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.redirect_uri,
                    "code": code,
                },
            )
            self.raise_for_meta(short)
            short_token = short.json()["access_token"]
            long_lived = await client.get(
                "https://graph.instagram.com/access_token",
                params={
                    "grant_type": "ig_exchange_token",
                    "client_secret": self.client_secret,
                    "access_token": short_token,
                },
            )
            self.raise_for_meta(long_lived)
        data = long_lived.json()
        expires = datetime.now(UTC) + timedelta(seconds=int(data.get("expires_in", 5184000)))
        return OAuthCredential(access_token=data["access_token"], expires_at=expires)

    async def discover_accounts(self, credential: OAuthCredential) -> list[ProviderAccount]:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{self.graph}/me",
                params={
                    "fields": "user_id,username,account_type",
                    "access_token": credential.access_token,
                },
            )
        self.raise_for_meta(response)
        data = response.json()
        account_type = str(data.get("account_type", "")).upper()
        if account_type and account_type not in {"BUSINESS", "MEDIA_CREATOR", "CREATOR"}:
            raise ProviderError(
                "Instagram publishing requires a professional Business or Creator account.",
                code="unsupported_account",
            )
        account_id = str(data.get("user_id") or data.get("id"))
        return [
            ProviderAccount(
                id=account_id,
                name=data.get("username") or "Instagram account",
                access_token=credential.access_token,
                expires_at=credential.expires_at,
                metadata={"account_type": account_type},
            )
        ]

    async def refresh_credential(self, token: str) -> OAuthCredential:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                "https://graph.instagram.com/refresh_access_token",
                params={"grant_type": "ig_refresh_token", "access_token": token},
            )
        self.raise_for_meta(response)
        data = response.json()
        expires = datetime.now(UTC) + timedelta(seconds=int(data.get("expires_in", 5184000)))
        return OAuthCredential(access_token=data["access_token"], expires_at=expires)

    async def publish_photo(self, account_id: str, token: str, image_url: str, caption: str) -> PublishResult:
        async with httpx.AsyncClient(timeout=45) as client:
            create = await client.post(
                f"{self.graph}/{account_id}/media",
                data={"image_url": image_url, "caption": caption, "access_token": token},
            )
            self.raise_for_meta(create)
            container_id = str(create.json()["id"])

            for _ in range(10):
                status = await client.get(
                    f"{self.graph}/{container_id}",
                    params={"fields": "status_code,status", "access_token": token},
                )
                self.raise_for_meta(status)
                status_code = status.json().get("status_code")
                if status_code == "FINISHED":
                    break
                if status_code in {"ERROR", "EXPIRED"}:
                    raise ProviderError(status.json().get("status") or "Instagram could not process the image.")
                await asyncio.sleep(2)
            else:
                raise ProviderError("Instagram is still processing the image. Try again shortly.", code="processing_timeout")

            publish = await client.post(
                f"{self.graph}/{account_id}/media_publish",
                data={"creation_id": container_id, "access_token": token},
            )
            self.raise_for_meta(publish)
        return PublishResult(post_id=str(publish.json()["id"]), container_id=container_id)

    async def revoke(self, token: str) -> None:
        async with httpx.AsyncClient(timeout=20) as client:
            await client.delete(
                "https://graph.instagram.com/me/permissions",
                params={"access_token": token},
            )
