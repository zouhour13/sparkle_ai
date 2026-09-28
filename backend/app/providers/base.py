from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any

import httpx


@dataclass(frozen=True)
class OAuthCredential:
    access_token: str
    expires_at: datetime | None
    refresh_token: str | None = None


@dataclass(frozen=True)
class ProviderAccount:
    id: str
    name: str
    access_token: str
    expires_at: datetime | None
    metadata: dict[str, Any]


@dataclass(frozen=True)
class PublishResult:
    post_id: str
    container_id: str | None = None


class ProviderError(RuntimeError):
    def __init__(self, message: str, code: str = "provider_error", reconnect: bool = False):
        super().__init__(message)
        self.code = code
        self.reconnect = reconnect


class SocialMediaProvider(ABC):
    @abstractmethod
    def authorization_url(self, state: str) -> str: ...

    @abstractmethod
    async def exchange_code(self, code: str) -> OAuthCredential: ...

    @abstractmethod
    async def discover_accounts(self, credential: OAuthCredential) -> list[ProviderAccount]: ...

    @abstractmethod
    async def publish_photo(self, account_id: str, token: str, image_url: str, caption: str) -> PublishResult: ...

    async def refresh_credential(self, token: str) -> OAuthCredential | None:
        return None

    async def revoke(self, token: str) -> None:
        return None

    @staticmethod
    def raise_for_meta(response: httpx.Response) -> None:
        if response.status_code < 400:
            return
        try:
            error = response.json().get("error", {})
        except ValueError:
            error = {}
        code = str(error.get("code", response.status_code))
        message = error.get("message") or "The social platform rejected the request."
        reconnect = response.status_code in {401, 403} or code in {"190", "10", "200"}
        raise ProviderError(message, code=code, reconnect=reconnect)
