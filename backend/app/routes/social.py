from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse

from ..config import Settings, get_settings
from ..providers.base import ProviderAccount, ProviderError
from ..schemas import (
    ConnectResponse,
    FacebookPageSelection,
    ProviderName,
    PublishJob,
    PublishRequest,
    SocialAccount,
)
from ..security import CurrentUser, current_user, hash_state, new_state
from ..services.social import SocialService


router = APIRouter(prefix="/social", tags=["social"])


def service(settings: Settings = Depends(get_settings)) -> SocialService:
    return SocialService(settings)


def frontend_redirect(settings: Settings, **params: str) -> RedirectResponse:
    return RedirectResponse(f"{str(settings.frontend_url).rstrip('/')}/dashboard?{urlencode(params)}")


@router.get("/accounts", response_model=list[SocialAccount])
async def accounts(user: CurrentUser = Depends(current_user), social: SocialService = Depends(service)):
    rows = await social.db.query(
        "social_accounts",
        params={
            "select": "id,provider,provider_account_id,account_name,status,token_expires_at",
            "user_id": f"eq.{user.id}",
            "order": "created_at.desc",
        },
    )
    return rows


@router.post("/accounts/{provider}/connect", response_model=ConnectResponse)
async def connect(
    provider: ProviderName,
    user: CurrentUser = Depends(current_user),
    social: SocialService = Depends(service),
):
    state = new_state()
    # A new connection attempt supersedes only unfinished OAuth requests.
    # It never touches the user's saved social account.
    await social.db.delete(
        "oauth_states",
        {
            "user_id": f"eq.{user.id}",
            "provider": f"eq.{provider.value}",
            "consumed_at": "is.null",
        },
    )
    await social.db.insert(
        "oauth_states",
        {
            "state_hash": hash_state(state),
            "user_id": user.id,
            "provider": provider.value,
            "expires_at": (datetime.now(UTC) + timedelta(minutes=10)).isoformat(),
        },
    )
    return ConnectResponse(authorization_url=social.provider(provider.value).authorization_url(state))


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: ProviderName,
    code: str = Query(...),
    state: str = Query(...),
    settings: Settings = Depends(get_settings),
    social: SocialService = Depends(service),
):
    state_row = await social.db.one(
        "oauth_states",
        {
            "state_hash": f"eq.{hash_state(state)}",
            "provider": f"eq.{provider.value}",
            "consumed_at": "is.null",
            "expires_at": f"gt.{datetime.now(UTC).isoformat()}",
        },
    )
    if not state_row:
        return frontend_redirect(settings, social_error="The connection request expired or was already used.")
    try:
        credential = await social.provider(provider.value).exchange_code(code)
        discovered = await social.provider(provider.value).discover_accounts(credential)
        if not discovered:
            raise ProviderError("No account with publishing permission was found.", "no_accounts")
        if provider == ProviderName.facebook and len(discovered) > 1:
            await social.db.update(
                "oauth_states",
                {"id": f"eq.{state_row['id']}"},
                {
                    "consumed_at": datetime.now(UTC).isoformat(),
                    "callback_context": social.encrypt_candidates(discovered),
                },
            )
            return frontend_redirect(settings, facebook_selection=state)
        await social.upsert_account(state_row["user_id"], provider.value, discovered[0])
        await social.db.update(
            "oauth_states",
            {"id": f"eq.{state_row['id']}"},
            {"consumed_at": datetime.now(UTC).isoformat(), "callback_context": None},
        )
        return frontend_redirect(settings, social_connected=provider.value)
    except ProviderError as exc:
        return frontend_redirect(settings, social_error=str(exc))


@router.get("/accounts/facebook/pages")
async def facebook_pages(
    selection_token: str,
    user: CurrentUser = Depends(current_user),
    social: SocialService = Depends(service),
):
    row = await social.db.one(
        "oauth_states",
        {
            "state_hash": f"eq.{hash_state(selection_token)}",
            "user_id": f"eq.{user.id}",
            "provider": "eq.facebook",
            "expires_at": f"gt.{datetime.now(UTC).isoformat()}",
            "callback_context": "not.is.null",
        },
    )
    if not row:
        raise HTTPException(status_code=400, detail="Facebook Page selection expired.")
    return [{"id": item["id"], "name": item["name"]} for item in social.decrypt_candidates(row["callback_context"])]


@router.post("/accounts/facebook/select-page", response_model=SocialAccount)
async def select_facebook_page(
    request: FacebookPageSelection,
    user: CurrentUser = Depends(current_user),
    social: SocialService = Depends(service),
):
    row = await social.db.one(
        "oauth_states",
        {
            "state_hash": f"eq.{hash_state(request.selection_token)}",
            "user_id": f"eq.{user.id}",
            "provider": "eq.facebook",
            "expires_at": f"gt.{datetime.now(UTC).isoformat()}",
            "callback_context": "not.is.null",
        },
    )
    if not row:
        raise HTTPException(status_code=400, detail="Facebook Page selection expired.")
    candidate = next(
        (item for item in social.decrypt_candidates(row["callback_context"]) if item["id"] == request.page_id),
        None,
    )
    if not candidate:
        raise HTTPException(status_code=400, detail="That Facebook Page is not available.")
    account = ProviderAccount(
        id=candidate["id"],
        name=candidate["name"],
        access_token=candidate["token"],
        expires_at=datetime.fromisoformat(candidate["expires_at"]) if candidate["expires_at"] else None,
        metadata=candidate["metadata"],
    )
    saved = await social.upsert_account(user.id, "facebook", account)
    await social.db.update("oauth_states", {"id": f"eq.{row['id']}"}, {"callback_context": None})
    return saved


@router.delete("/accounts/{account_id}", status_code=204)
async def disconnect(
    account_id: str,
    user: CurrentUser = Depends(current_user),
    social: SocialService = Depends(service),
):
    account = await social.db.one(
        "social_accounts", {"id": f"eq.{account_id}", "user_id": f"eq.{user.id}"}
    )
    if not account:
        raise HTTPException(status_code=404, detail="Connected account not found.")
    token = social.cipher.decrypt(account["encrypted_access_token"])
    try:
        await social.provider(account["provider"]).revoke(token)
    finally:
        await social.db.delete(
            "social_accounts", {"id": f"eq.{account_id}", "user_id": f"eq.{user.id}"}
        )


@router.post("/publish", response_model=PublishJob, status_code=202)
async def publish(
    request: PublishRequest,
    background: BackgroundTasks,
    user: CurrentUser = Depends(current_user),
    social: SocialService = Depends(service),
):
    existing = await social.db.one(
        "social_publish_jobs",
        {"user_id": f"eq.{user.id}", "idempotency_key": f"eq.{request.idempotency_key}"},
    )
    if existing:
        return existing
    account = await social.db.one(
        "social_accounts",
        {"id": f"eq.{request.social_account_id}", "user_id": f"eq.{user.id}", "status": "eq.connected"},
    )
    content = await social.db.one(
        "generated_content",
        {"id": f"eq.{request.generated_content_id}", "user_id": f"eq.{user.id}"},
    )
    if not account or not content:
        raise HTTPException(status_code=404, detail="Content or connected account not found.")
    job = await social.db.insert(
        "social_publish_jobs",
        {
            "user_id": user.id,
            "generated_content_id": str(request.generated_content_id),
            "social_account_id": str(request.social_account_id),
            "provider": account["provider"],
            "caption": request.caption,
            "hashtags": request.hashtags,
            "idempotency_key": request.idempotency_key,
            "status": "pending",
        },
    )
    background.add_task(social.process_publish_job, job["id"], user.id)
    return job


@router.get("/publish-history", response_model=list[PublishJob])
async def publish_history(
    user: CurrentUser = Depends(current_user), social: SocialService = Depends(service)
):
    return await social.db.query(
        "social_publish_jobs",
        params={"user_id": f"eq.{user.id}", "order": "created_at.desc", "limit": "50"},
    )


@router.get("/publish/{job_id}", response_model=PublishJob)
async def publish_status(
    job_id: str,
    user: CurrentUser = Depends(current_user),
    social: SocialService = Depends(service),
):
    job = await social.db.one(
        "social_publish_jobs", {"id": f"eq.{job_id}", "user_id": f"eq.{user.id}"}
    )
    if not job:
        raise HTTPException(status_code=404, detail="Publishing job not found.")
    return job

