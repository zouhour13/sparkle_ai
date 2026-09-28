from datetime import UTC, datetime, timedelta

import httpx
import pytest
import respx

from app.config import Settings
from app.providers.base import ProviderError
from app.providers.facebook import FacebookProvider
from app.providers.instagram import InstagramProvider


def settings() -> Settings:
    return Settings(
        clerk_issuer_url="https://clerk.example",
        clerk_jwks_url="https://clerk.example/.well-known/jwks.json",
        supabase_url="https://supabase.example",
        supabase_service_key="service-key",
        social_token_encryption_key="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        facebook_app_id="facebook-id",
        facebook_app_secret="facebook-secret",
        instagram_app_id="instagram-id",
        instagram_app_secret="instagram-secret",
    )


@pytest.mark.asyncio
@respx.mock
async def test_facebook_discovers_only_pages_with_content_permission():
    provider = FacebookProvider(settings())
    respx.get(f"{provider.graph}/me/accounts").mock(
        return_value=httpx.Response(
            200,
            json={
                "data": [
                    {"id": "1", "name": "Shop", "access_token": "page-token", "tasks": ["CREATE_CONTENT"]},
                    {"id": "2", "name": "Read only", "access_token": "other", "tasks": ["ANALYZE"]},
                ]
            },
        )
    )
    from app.providers.base import OAuthCredential

    accounts = await provider.discover_accounts(OAuthCredential("user-token", datetime.now(UTC) + timedelta(days=1)))
    assert [account.name for account in accounts] == ["Shop"]


@pytest.mark.asyncio
@respx.mock
async def test_instagram_surfaces_meta_error():
    provider = InstagramProvider(settings())
    respx.post(f"{provider.graph}/ig-user/media").mock(
        return_value=httpx.Response(400, json={"error": {"code": 190, "message": "Token expired"}})
    )

    with pytest.raises(ProviderError, match="Token expired") as error:
        await provider.publish_photo("ig-user", "expired", "https://example.com/image.jpg", "caption")
    assert error.value.reconnect is True

