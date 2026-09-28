from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

import httpx

from ..config import Settings
from .base import OAuthCredential, ProviderAccount, PublishResult, SocialMediaProvider


class FacebookProvider(SocialMediaProvider):
    scopes = ("pages_show_list", "pages_read_engagement", "pages_manage_posts")

    def __init__(self, settings: Settings):
        self.client_id = settings.facebook_app_id
        self.client_secret = settings.facebook_app_secret
        self.redirect_uri = settings.facebook_redirect_uri
        self.graph = f"https://graph.facebook.com/{settings.meta_graph_api_version}"

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
        return f"https://www.facebook.com/dialog/oauth?{query}"

    async def exchange_code(self, code: str) -> OAuthCredential:
        async with httpx.AsyncClient(timeout=30) as client:
            short = await client.get(
                f"{self.graph}/oauth/access_token",
                params={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": self.redirect_uri,
                    "code": code,
                },
            )
            self.raise_for_meta(short)
            long_lived = await client.get(
                f"{self.graph}/oauth/access_token",
                params={
                    "grant_type": "fb_exchange_token",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "fb_exchange_token": short.json()["access_token"],
                },
            )
            self.raise_for_meta(long_lived)
        data = long_lived.json()
        expires = datetime.now(UTC) + timedelta(seconds=int(data.get("expires_in", 5184000)))
        return OAuthCredential(access_token=data["access_token"], expires_at=expires)

    async def discover_accounts(self, credential: OAuthCredential) -> list[ProviderAccount]:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{self.graph}/me/accounts",
                params={
                    "fields": "id,name,access_token,tasks",
                    "limit": 100,
                    "access_token": credential.access_token,
                },
            )
        self.raise_for_meta(response)
        accounts = []
        for page in response.json().get("data", []):
            if "CREATE_CONTENT" not in page.get("tasks", []):
                continue
            accounts.append(
                ProviderAccount(
                    id=str(page["id"]),
                    name=page["name"],
                    access_token=page["access_token"],
                    expires_at=credential.expires_at,
                    metadata={"tasks": page.get("tasks", [])},
                )
            )
        return accounts

    async def publish_photo(self, account_id: str, token: str, image_url: str, caption: str) -> PublishResult:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                f"{self.graph}/{account_id}/photos",
                data={"url": image_url, "caption": caption, "access_token": token},
            )
        self.raise_for_meta(response)
        data = response.json()
        return PublishResult(post_id=str(data.get("post_id") or data["id"]))

    async def revoke(self, token: str) -> None:
        async with httpx.AsyncClient(timeout=20) as client:
            await client.delete(
                f"{self.graph}/me/permissions",
                params={"access_token": token},
            )

