# Sparkle AI

Sparkle AI turns a product photo into ready-to-publish marketing content. It generates copy, stores the generated product image and history durably in Supabase, and can publish a single-image post to an Instagram professional account or a Facebook Page.

## Demo

[![Watch the Sparkle AI product demo on YouTube](https://img.youtube.com/vi/rMe9cmW_wwI/maxresdefault.jpg)](https://youtu.be/rMe9cmW_wwI)

Watch the [Sparkle AI product demo on YouTube](https://youtu.be/rMe9cmW_wwI).

## What It Does

- Generates product marketing copy from a prompt and image.
- Keeps product images and generated content history after the browser, app, or local server is closed.
- Connects Instagram Business or Creator accounts and Facebook Pages through Meta OAuth.
- Publishes image, caption, and hashtags through the connected social account.
- Lets users review generated content, publishing history, and connected accounts from the dashboard.

## Architecture

| Component | Technology | Responsibility |
| --- | --- | --- |
| Web application | Next.js 16 | Dashboard, Clerk session handling, and authenticated requests to the API |
| API | FastAPI | Content generation, media persistence, OAuth, account management, and publishing |
| Identity | Clerk | User sign-in and bearer-token authentication |
| Persistence | Supabase Postgres and Storage | Generated-content records, publishing records, encrypted social tokens, and product images |
| Social publishing | Meta Graph API | Instagram professional-account and Facebook Page publishing |

The frontend never accesses Supabase with privileged credentials. FastAPI validates the Clerk token, scopes records to that verified user, and uses the server-only Supabase key to access the private Storage bucket. This keeps generated images available across restarts without making the bucket public.

## Prerequisites

- Node.js 22 or newer
- Python 3.11 or newer
- A Clerk application
- A Supabase project
- A Meta Business app for social publishing
- Docker Desktop, optionally, for containerized deployment

## Quick Start

1. Create environment files from the templates:

   ```powershell
   Copy-Item .env.example .env.local
   Copy-Item backend/.env.example backend/.env
   ```

2. Set the required Clerk, Supabase, and Meta values. Details are listed in [Environment Configuration](#environment-configuration).

3. Generate a token-encryption key once. Keep the value unchanged after social accounts have been connected, or stored provider tokens cannot be decrypted.

   ```powershell
   python -c "import base64,secrets; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())"
   ```

4. Apply the Supabase migration described in [Supabase Setup](#supabase-setup).

5. Start the API:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

6. In a second terminal, start the web application:

   ```powershell
   npm install
   npm run dev
   ```

Open `http://localhost:3000` and sign in.

## Supabase Setup

Run [`backend/supabase/migrations/202609220001_social_publishing.sql`](backend/supabase/migrations/202609220001_social_publishing.sql) in the Supabase SQL Editor for the target project. The migration creates:

- `generated_content` for saved content and image metadata
- `social_accounts` for encrypted OAuth tokens and connected-account metadata
- `oauth_states` for short-lived OAuth state validation
- `social_publish_jobs` for idempotent publishing jobs and their outcomes
- A private `product-images` Storage bucket

The migration enables Row Level Security and removes direct browser-role access. Storage policies are based on Supabase RLS, while the backend's service key is deliberately restricted to FastAPI. See the official [Supabase Storage access-control documentation](https://supabase.com/docs/guides/storage/security/access-control) for the underlying model.

Product images are stored in Supabase, not in temporary browser or Docker storage. They remain available after an app restart, provided the same Supabase project and bucket configuration are used.

## Environment Configuration

Use the checked-in templates as the source of truth:

- [`.env.example`](.env.example) for the Next.js application
- [`backend/.env.example`](backend/.env.example) for FastAPI

| Variable group | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_*` | `.env.local` | Browser-safe Clerk configuration only |
| `CLERK_SECRET_KEY`, `FASTAPI_URL` | `.env.local` | Server-side Next.js configuration |
| `CLERK_ISSUER_URL`, `CLERK_JWKS_URL` | `backend/.env` | Lets FastAPI verify Clerk JWTs |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_STORAGE_BUCKET` | `backend/.env` | Persistent data and image storage; service key is backend-only |
| `SOCIAL_TOKEN_ENCRYPTION_KEY` | `backend/.env` | Stable secret used to encrypt saved provider tokens |
| `INSTAGRAM_*`, `FACEBOOK_*`, `META_GRAPH_API_VERSION` | `backend/.env` | Meta OAuth and publishing configuration |
| `FRONTEND_URL` and provider redirect URIs | `backend/.env` | Must match the public deployment URL in production |
| `HF_*` | `backend/.env` | Optional Hugging Face generation configuration |

Never commit real environment files or expose `SUPABASE_SERVICE_KEY`, `SOCIAL_TOKEN_ENCRYPTION_KEY`, Clerk secret keys, Meta app secrets, or provider access tokens with a `NEXT_PUBLIC_` prefix.

## Meta OAuth and Publishing

Configure a Meta Business app with the following products and exact redirect URLs:

| Provider | Product | Required redirect URI | Required permissions |
| --- | --- | --- | --- |
| Instagram | Instagram API with Instagram Login | `INSTAGRAM_REDIRECT_URI` | `instagram_business_basic`, `instagram_business_content_publish` |
| Facebook | Facebook Login for Business | `FACEBOOK_REDIRECT_URI` | `pages_show_list`, `pages_read_engagement`, `pages_manage_posts` |

Instagram publishing supports professional Business and Creator accounts. Facebook publishing supports Pages that the connected user can manage and for which the account has the required Page task. Personal Instagram accounts and Facebook profiles are not supported.

For local development, Meta needs a publicly reachable HTTPS callback URL; `localhost` cannot receive Meta's callback. A tunnel can work while developing, but it is temporary. For reliable publishing, deploy the application and register the exact deployed HTTPS callback URLs in both Meta and `backend/.env`. Restarting or changing a tunnel URL requires updating both places before reconnecting.

OAuth state is intentionally single-use and short-lived. Start a fresh connection from the dashboard if a callback reports that the request expired or was already used. Reconnecting does not remove the existing connected account unless you explicitly disconnect it or connect a different account.

## Docker Deployment

Docker runs the frontend and API together. Supabase remains a managed external database and Storage service, so your images persist independently of the containers.

1. Configure `.env.local` and `backend/.env` as described above.
2. Build and run the stack:

   ```powershell
   docker compose --env-file .env.local up --build
   ```

3. Open `http://localhost:3000`.

The frontend reaches the API over Docker's internal `backend:8000` address. Port `8000` is exposed for local diagnostics and OAuth development. Before deploying publicly, set `FRONTEND_URL`, `INSTAGRAM_REDIRECT_URI`, and `FACEBOOK_REDIRECT_URI` to the production HTTPS domain, then rebuild and redeploy.

## API Reference

Except for OAuth callbacks and `GET /health`, application endpoints require a Clerk bearer token.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `POST` | `/generate` | Generate and persist content and product media |
| `GET` | `/history` | List saved generated content |
| `DELETE` | `/history/{record_id}` | Remove a saved generated-content record |
| `GET` | `/social/accounts` | List connected social accounts |
| `POST` | `/social/accounts/{provider}/connect` | Start provider OAuth |
| `GET` | `/social/oauth/{provider}/callback` | Complete OAuth after Meta redirects back |
| `GET` | `/social/accounts/facebook/pages` | List selectable Facebook Pages |
| `POST` | `/social/accounts/facebook/select-page` | Save a selected Facebook Page |
| `DELETE` | `/social/accounts/{account_id}` | Disconnect an account |
| `POST` | `/social/publish` | Create an idempotent publish job |
| `GET` | `/social/publish/{job_id}` | Read one publish job's status |
| `GET` | `/social/publish-history` | List recent publish attempts |

## Supported Scope

This release supports single-image feed posts to Instagram professional accounts and Facebook Pages. It does not currently support personal accounts, carousels, Reels, Stories, scheduled publishing, or other networks.

Additional providers can implement `SocialMediaProvider` in `backend/app/providers/`. The shared account, OAuth, publishing-job, history, encryption, and error contracts can then be reused.

## Verification

Run these checks before releasing changes:

```powershell
npm run lint
npm test
npm run build

cd backend
pytest -q
```

Provider tests mock external Meta responses. A live publish additionally requires configured and approved Meta credentials, a test or production social account, Clerk, and Supabase.
