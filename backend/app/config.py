from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    clerk_issuer_url: str
    clerk_jwks_url: str
    supabase_url: str
    supabase_service_key: str
    supabase_storage_bucket: str = "product-images"
    social_token_encryption_key: str
    meta_graph_api_version: str = "v26.0"
    facebook_app_id: str = ""
    facebook_app_secret: str = ""
    facebook_redirect_uri: str = "http://localhost:8000/social/oauth/facebook/callback"
    instagram_app_id: str = ""
    instagram_app_secret: str = ""
    instagram_redirect_uri: str = "http://localhost:8000/social/oauth/instagram/callback"
    frontend_url: AnyHttpUrl = Field(default="http://localhost:3000")
    hf_token: str = ""
    hf_text_model: str = "Qwen/Qwen2.5-7B-Instruct"
    hf_vision_model: str = "Qwen/Qwen3-VL-30B-A3B-Instruct"
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
