import base64
import hashlib
import secrets
from dataclasses import dataclass

import jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from .config import Settings, get_settings


bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: str


class TokenCipher:
    def __init__(self, encoded_key: str):
        try:
            key = base64.urlsafe_b64decode(encoded_key)
        except Exception as exc:
            raise ValueError("SOCIAL_TOKEN_ENCRYPTION_KEY must be URL-safe base64") from exc
        if len(key) != 32:
            raise ValueError("SOCIAL_TOKEN_ENCRYPTION_KEY must decode to 32 bytes")
        self._cipher = AESGCM(key)

    def encrypt(self, value: str) -> str:
        nonce = secrets.token_bytes(12)
        ciphertext = self._cipher.encrypt(nonce, value.encode(), b"sparkle-social-v1")
        return "v1:" + base64.urlsafe_b64encode(nonce + ciphertext).decode()

    def decrypt(self, value: str) -> str:
        version, payload = value.split(":", 1)
        if version != "v1":
            raise ValueError("Unsupported credential version")
        raw = base64.urlsafe_b64decode(payload)
        return self._cipher.decrypt(raw[:12], raw[12:], b"sparkle-social-v1").decode()


def new_state() -> str:
    return secrets.token_urlsafe(32)


def hash_state(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


async def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        signing_key = PyJWKClient(settings.clerk_jwks_url).get_signing_key_from_jwt(
            credentials.credentials
        )
        payload = jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer_url.rstrip("/"),
            options={"verify_aud": False},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid authentication token") from exc
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication token has no subject")
    return CurrentUser(id=user_id)

