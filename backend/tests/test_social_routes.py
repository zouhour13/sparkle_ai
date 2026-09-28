from pathlib import Path

import pytest
from fastapi import BackgroundTasks, HTTPException

from app.routes.social import publish
from app.schemas import PublishRequest
from app.security import CurrentUser


class FakeDatabase:
    def __init__(self, rows):
        self.rows = list(rows)
        self.queries = []

    async def one(self, table, params):
        self.queries.append((table, params))
        return self.rows.pop(0) if self.rows else None

    async def insert(self, table, values):
        return {"id": "9b651772-8df6-4e80-9b37-5fe650b7b040", "created_at": "2026-09-22T12:00:00Z", **values}


class FakeSocialService:
    def __init__(self, rows):
        self.db = FakeDatabase(rows)

    async def process_publish_job(self, job_id, user_id):
        return None


def request() -> PublishRequest:
    return PublishRequest(
        generated_content_id="1dfcf92a-7a82-49cb-b558-f0d19f38af92",
        social_account_id="d929a820-a2c2-438b-ad40-7a3fd6ea4f1c",
        caption="A real post",
        hashtags=["sparkle"],
        idempotency_key="unique-request-key",
    )


@pytest.mark.asyncio
async def test_publish_reuses_an_existing_idempotent_job():
    existing = {
        "id": "9b651772-8df6-4e80-9b37-5fe650b7b040",
        "provider": "instagram",
        "status": "published",
        "caption": "A real post",
        "hashtags": ["#sparkle"],
        "created_at": "2026-09-22T12:00:00Z",
    }
    social = FakeSocialService([existing])

    result = await publish(request(), BackgroundTasks(), CurrentUser("user_123"), social)

    assert result == existing
    assert social.db.queries[0][1]["user_id"] == "eq.user_123"


@pytest.mark.asyncio
async def test_publish_rejects_an_account_not_owned_by_the_user():
    social = FakeSocialService([None, None])

    with pytest.raises(HTTPException) as error:
        await publish(request(), BackgroundTasks(), CurrentUser("user_123"), social)

    assert error.value.status_code == 404
    account_query = social.db.queries[1][1]
    assert account_query["user_id"] == "eq.user_123"
    assert account_query["status"] == "eq.connected"


def test_migration_locks_down_tables_and_storage():
    sql = Path("supabase/migrations/202609220001_social_publishing.sql").read_text()

    for table in ("generated_content", "social_accounts", "oauth_states", "social_publish_jobs"):
        assert f"alter table public.{table} enable row level security" in sql
        assert f"revoke all on public.{table} from anon, authenticated" in sql
    assert "'product-images'" in sql
    assert "false," in sql

