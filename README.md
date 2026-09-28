# Sparkle AI

Sparkle AI turns product photos into marketing copy and can publish the generated image, caption, and hashtags to Instagram professional accounts and Facebook Pages.

## Architecture

- `app/`: Next.js 16 frontend, Clerk authentication, and authenticated backend proxies.
- `backend/app/`: FastAPI generation, OAuth, account management, and publishing API.
- `backend/supabase/migrations/`: Postgres schema, RLS lockdown, and private Storage bucket setup.
- Clerk is the only user identity provider. FastAPI validates Clerk session JWTs.
- Supabase is accessed only by FastAPI with a server-side service key. Meta tokens are encrypted before storage.

## Supported publishing

- Instagram Business and Creator accounts through Instagram Login.
- Facebook Pages for which the connected user has the `CREATE_CONTENT` task.
- Single-image posts. Instagram images are normalized to JPEG and served to Meta through a short-lived Supabase signed URL.

Personal Instagram accounts, Facebook personal profiles, carousels, Reels, Stories, and scheduling are not supported in this release.

## Configuration

Copy `.env.example` to `.env.local` for Next.js. Copy `backend/.env.example` to `backend/.env` for FastAPI.

Generate the token encryption key once and keep it stable and secret:

```powershell
python -c "import base64,secrets; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())"
```

Never expose `SUPABASE_SERVICE_KEY`, `SOCIAL_TOKEN_ENCRYPTION_KEY`, Meta app secrets, or access tokens through `NEXT_PUBLIC_*` variables.

## Supabase setup

Apply `backend/supabase/migrations/202609220001_social_publishing.sql` to the target Supabase project. It creates:

- `generated_content`
- `social_accounts`
- `oauth_states`
- `social_publish_jobs`
- A private `product-images` Storage bucket

The migration enables RLS and revokes browser-role access. The application backend additionally filters every record by the verified Clerk user ID.

## Meta setup

Create a Meta Business app and configure these products:

1. Instagram API with Instagram Login. Add the exact `INSTAGRAM_REDIRECT_URI` and request `instagram_business_basic` and `instagram_business_content_publish`.
2. Facebook Login for Business. Add the exact `FACEBOOK_REDIRECT_URI` and request `pages_show_list`, `pages_read_engagement`, and `pages_manage_posts`.
3. Add development users as app roles/testers. Complete App Review and request Advanced Access before allowing arbitrary production users.

Instagram publishing works only for professional Business/Creator accounts. Facebook publishing works only for Pages the user can manage. The UI reports those restrictions and prompts users to reconnect expired or revoked accounts.

## Local development

Use Python 3.11 or newer. The pinned runtime also provides Windows wheels for Python 3.14.

Install and run FastAPI:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Install and run Next.js in another terminal:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`, sign in, generate content, and use **Post to social media**. Meta cannot fetch media from localhost, but it can fetch the short-lived HTTPS URL generated from Supabase Storage.

## Docker

Docker runs the Next.js frontend and FastAPI backend together; Supabase remains the managed database and Storage service.

1. Copy `.env.example` to `.env.local` and `backend/.env.example` to `backend/.env`, then set the real credentials.
2. Start the stack, making the browser-safe Clerk values available for the frontend build:

```powershell
docker compose --env-file .env.local up --build
```

Open `http://localhost:3000`. The frontend calls the backend over Docker's internal `backend:8000` network address, while port `8000` is also exposed for the OAuth callback during local testing.

For Instagram or Facebook OAuth in a deployed environment, set `FRONTEND_URL`, `INSTAGRAM_REDIRECT_URI`, and `FACEBOOK_REDIRECT_URI` in `backend/.env` to your public HTTPS domain and register those exact callback URLs with Meta. A temporary tunnel can be used locally, but a deployed HTTPS domain is required for reliable publishing.

## API

All application endpoints except OAuth callbacks require a Clerk bearer token.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/generate` | Generate and persist content and images |
| `GET` | `/social/accounts` | List connected accounts |
| `POST` | `/social/accounts/{provider}/connect` | Start OAuth |
| `GET` | `/social/oauth/{provider}/callback` | Complete OAuth securely |
| `GET` | `/social/accounts/facebook/pages` | List selectable Pages after OAuth |
| `POST` | `/social/accounts/facebook/select-page` | Save a selected Page |
| `DELETE` | `/social/accounts/{id}` | Revoke and disconnect an account |
| `POST` | `/social/publish` | Create an idempotent publishing job |
| `GET` | `/social/publish/{id}` | Read publishing status |
| `GET` | `/social/publish-history` | List recent publishing attempts |

## Verification

```powershell
npm run lint
npm test
npm run build

cd backend
pytest -q
```

Provider tests mock Meta HTTP responses; a real end-to-end publish requires configured Meta app credentials, approved/test accounts, Clerk, and Supabase.

## Extending providers

New platforms implement `SocialMediaProvider` in `backend/app/providers/`. OAuth, account discovery, publishing, refresh, revocation, and normalized errors remain behind that interface, so LinkedIn, TikTok, or X can reuse the existing account, job, history, and UI contracts.
