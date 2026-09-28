from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ProviderName(StrEnum):
    instagram = "instagram"
    facebook = "facebook"


class PublishStatus(StrEnum):
    pending = "pending"
    processing = "processing"
    published = "published"
    failed = "failed"


class GeneratedContent(BaseModel):
    title: str
    description: str
    caption: str
    cta: str
    hashtags: list[str]
    record_id: UUID | None = None
    image_url: str | None = None


class GeneratedHistoryItem(GeneratedContent):
    platform: str
    tone: str
    created_at: datetime


class ConnectResponse(BaseModel):
    authorization_url: str


class SocialAccount(BaseModel):
    id: UUID
    provider: ProviderName
    provider_account_id: str
    account_name: str
    status: str
    token_expires_at: datetime | None = None


class FacebookPageSelection(BaseModel):
    selection_token: str
    page_id: str


class PublishRequest(BaseModel):
    generated_content_id: UUID
    social_account_id: UUID
    caption: str = Field(min_length=1, max_length=2200)
    hashtags: list[str] = Field(default_factory=list, max_length=30)
    idempotency_key: str = Field(min_length=8, max_length=128)

    @field_validator("hashtags")
    @classmethod
    def normalize_hashtags(cls, values: list[str]) -> list[str]:
        result: list[str] = []
        for value in values:
            tag = value.strip().replace(" ", "")
            if tag:
                result.append(tag if tag.startswith("#") else f"#{tag}")
        return list(dict.fromkeys(result))


class PublishJob(BaseModel):
    id: UUID
    provider: ProviderName
    status: PublishStatus
    caption: str
    hashtags: list[str]
    provider_post_id: str | None = None
    error_code: str | None = None
    error_message: str | None = None
    created_at: datetime
    published_at: datetime | None = None

