from __future__ import annotations

from typing import Any
from urllib.parse import quote

import httpx

from ..config import Settings


class SupabaseError(RuntimeError):
    pass


class SupabaseService:
    def __init__(self, settings: Settings):
        self.url = settings.supabase_url.rstrip("/")
        self.bucket = settings.supabase_storage_bucket
        self.headers = {
            "apikey": settings.supabase_service_key,
            "Authorization": f"Bearer {settings.supabase_service_key}",
        }

    async def query(
        self,
        table: str,
        *,
        params: dict[str, str] | None = None,
        method: str = "GET",
        json: Any = None,
        prefer: str | None = None,
    ) -> list[dict[str, Any]]:
        headers = dict(self.headers)
        if prefer:
            headers["Prefer"] = prefer
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                method,
                f"{self.url}/rest/v1/{table}",
                params=params,
                json=json,
                headers=headers,
            )
        if response.status_code >= 400:
            raise SupabaseError(f"Database request failed ({response.status_code})")
        if not response.content:
            return []
        data = response.json()
        return data if isinstance(data, list) else [data]

    async def one(self, table: str, params: dict[str, str]) -> dict[str, Any] | None:
        rows = await self.query(table, params={**params, "limit": "1"})
        return rows[0] if rows else None

    async def insert(self, table: str, values: dict[str, Any]) -> dict[str, Any]:
        rows = await self.query(
            table,
            method="POST",
            json=values,
            prefer="return=representation",
        )
        return rows[0]

    async def update(
        self, table: str, filters: dict[str, str], values: dict[str, Any]
    ) -> dict[str, Any] | None:
        rows = await self.query(
            table,
            method="PATCH",
            params=filters,
            json=values,
            prefer="return=representation",
        )
        return rows[0] if rows else None

    async def delete(self, table: str, filters: dict[str, str]) -> None:
        await self.query(table, method="DELETE", params=filters)

    async def upload(self, path: str, content: bytes, content_type: str) -> None:
        encoded_path = quote(path, safe="/")
        headers = {**self.headers, "Content-Type": content_type, "x-upsert": "false"}
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.url}/storage/v1/object/{self.bucket}/{encoded_path}",
                content=content,
                headers=headers,
            )
        if response.status_code >= 400:
            raise SupabaseError(f"Image upload failed ({response.status_code})")

    async def remove_files(self, paths: list[str]) -> None:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                "DELETE",
                f"{self.url}/storage/v1/object/{self.bucket}",
                json={"prefixes": paths},
                headers=self.headers,
            )
        if response.status_code >= 400:
            raise SupabaseError(f"Image deletion failed ({response.status_code})")

    async def signed_url(self, path: str, expires_in: int = 3600) -> str:
        encoded_path = quote(path, safe="/")
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.url}/storage/v1/object/sign/{self.bucket}/{encoded_path}",
                json={"expiresIn": expires_in},
                headers=self.headers,
            )
        if response.status_code >= 400:
            raise SupabaseError(f"Could not create image URL ({response.status_code})")
        signed = response.json()["signedURL"]
        return signed if signed.startswith("http") else f"{self.url}/storage/v1{signed}"

