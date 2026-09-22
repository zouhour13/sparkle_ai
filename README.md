# Sparkle AI

Sparkle AI is a full-stack marketing content generator for product images. Users upload a product photo, choose a target platform and tone, and receive a ready-to-use content package with a headline, description, social caption, call to action, and hashtags.

The project combines a Next.js dashboard, a FastAPI AI backend, Hugging Face models, Clerk authentication, and Supabase persistence/export tooling.

## Features

- Product image upload with preview, drag-and-drop support, and file validation.
- Platform-aware copy generation for Instagram, Facebook, TikTok, and ecommerce.
- Tone presets: professional, luxury, friendly, trendy, playful, and minimalist.
- AI image captioning with BLIP.
- Text generation through Hugging Face Inference API, with local TinyLlama fallback.
- Clerk-protected dashboard and API proxy routes.
- Supabase Storage for uploaded product images.
- Supabase history table for generated content.
- History browsing, deletion, and one-click reuse.
- CSV, Excel, and ZIP exports.
- Export translation support for English, French, Arabic, and Spanish.
- Dark/light theme support.

## Architecture

```text
Sparkle_AI/
|-- sparkle-ai/          # Next.js frontend and authenticated API proxy
|   |-- app/
|   |   |-- page.tsx             # Landing page
|   |   |-- dashboard/page.tsx   # Main generator dashboard
|   |   |-- pricing/page.tsx     # Pricing screen
|   |   |-- login/               # Clerk sign-in page
|   |   |-- signup/              # Clerk sign-up page
|   |   `-- api/                 # Next.js proxy routes to FastAPI
|   `-- package.json
|
`-- sparkle-backend/     # FastAPI backend
    |-- main.py                  # App entry point, CORS, router setup
    |-- config.py                # Environment-based settings
    |-- routes/                  # Generate, history, and export endpoints
    |-- schemas/                 # Pydantic request/response models
    |-- services/                # AI, Supabase, translation, export services
    |-- tests/                   # Backend tests
    |-- schema.sql               # Supabase database schema
    `-- requirements.txt
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Authentication | Clerk |
| Backend | FastAPI, Python, Uvicorn |
| Validation | Pydantic v2 |
| Image AI | Salesforce BLIP image captioning |
| Text AI | Zephyr-7B via Hugging Face Inference API, TinyLlama fallback |
| Database | Supabase Postgres |
| Storage | Supabase Storage |
| Exports | CSV, Excel, ZIP |
| Testing | Pytest |

## Prerequisites

- Node.js 20 or newer
- Python 3.11 or newer
- A Clerk project
- A Supabase project
- A Hugging Face account and token, recommended for faster text generation

## Environment Variables

### Frontend

Create `sparkle-ai/.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
FASTAPI_URL=http://localhost:8000
```

### Backend

Create `sparkle-backend/.env`:

```env
HF_TOKEN=hf_your_hugging_face_token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=product-images
HOST=0.0.0.0
PORT=8000
DEBUG=false
```

Keep `SUPABASE_SERVICE_KEY` server-side only. Do not expose it in the frontend.

## Supabase Setup

1. Open your Supabase project.
2. Go to SQL Editor.
3. Run the schema in `sparkle-backend/schema.sql`.
4. The backend will attempt to create the `product-images` public storage bucket on startup.

The backend writes generated content to the `history` table and uploads product images to Supabase Storage when Supabase credentials are configured.

## Installation

Install frontend dependencies:

```powershell
cd sparkle-ai
npm install
```

Install backend dependencies:

```powershell
cd ..\sparkle-backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If PyTorch needs to be installed explicitly for CPU usage:

```powershell
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

## Running Locally

Start the FastAPI backend:

```powershell
cd sparkle-backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

Open the backend docs at:

```text
http://localhost:8000/docs
```

Start the Next.js frontend in a second terminal:

```powershell
cd sparkle-ai
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

On first startup, the backend downloads and caches the BLIP model. Local text-generation fallback can also download a TinyLlama model if `HF_TOKEN` is not configured.

## Usage

1. Sign up or sign in through Clerk.
2. Open the dashboard.
3. Upload a product image.
4. Select a platform and tone.
5. Generate content.
6. Copy individual fields, copy the full output, revisit history, or export saved generations.

## API Overview

### Backend

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Backend health check |
| `POST` | `/generate` | Generate marketing content from an uploaded product image |
| `GET` | `/history` | Fetch generation history, newest first |
| `DELETE` | `/history/{record_id}` | Delete one history record |
| `GET` | `/export/csv` | Export history as English CSV |
| `GET` | `/export/csv/{lang}` | Export CSV in `en`, `fr`, `ar`, or `es` |
| `GET` | `/export/excel` | Export history as English Excel |
| `GET` | `/export/excel/{lang}` | Export Excel in `en`, `fr`, `ar`, or `es` |
| `GET` | `/export/zip` | Export history as a ZIP archive |

### Generate Request

`POST /generate` expects `multipart/form-data`.

| Field | Type | Required | Values |
| --- | --- | --- | --- |
| `image` | File | Yes | JPG, PNG, WEBP, GIF up to 10 MB |
| `platform` | String | No | `instagram`, `facebook`, `tiktok`, `ecommerce` |
| `tone` | String | No | `professional`, `luxury`, `friendly`, `trendy`, `playful`, `minimalist` |

Example response:

```json
{
  "headline": "Black Slim-Fit Joggers With White Logo",
  "description": "A concise product description tailored to the selected tone.",
  "social_caption": "Platform-ready social copy with a strong hook.",
  "cta": "Shop now while this style is available.",
  "hashtags": ["#OOTD", "#NewArrival", "#ShopNow"],
  "platform": "instagram",
  "detected_caption": "black pants with white logo",
  "image_url": "https://your-project.supabase.co/storage/v1/object/public/product-images/...",
  "record_id": "uuid"
}
```

## Frontend Proxy Routes

The Next.js app exposes authenticated proxy routes under `/api`:

| Route | Backend Target |
| --- | --- |
| `POST /api/generate` | `POST /generate` |
| `GET /api/history` | `GET /history` |
| `DELETE /api/history/{id}` | `DELETE /history/{id}` |
| `GET /api/export/*` | `GET /export/*` |

These routes require a Clerk session and keep backend calls centralized through `FASTAPI_URL`.

## Testing

Run backend tests:

```powershell
cd sparkle-backend
.\venv\Scripts\Activate.ps1
pytest tests -v
```

Run frontend linting:

```powershell
cd sparkle-ai
npm run lint
```

Build the frontend:

```powershell
cd sparkle-ai
npm run build
```

## Notes for Development

- The backend uses Supabase REST APIs directly through `httpx`, not the Supabase Python SDK.
- Image upload and database persistence are designed to be non-fatal where possible, so generation can still return content if storage persistence fails.
- `HF_TOKEN` is recommended. Without it, the backend falls back to local CPU inference, which can be significantly slower.
- Next.js generation proxy timeout is configured for long-running AI inference.

## License

MIT. Free to use, modify, and distribute.
