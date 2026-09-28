create extension if not exists pgcrypto;

create table if not exists public.generated_content (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  platform text not null,
  tone text not null,
  language text not null,
  title text not null,
  description text not null,
  caption text not null,
  cta text not null,
  hashtags text[] not null default '{}',
  detected_caption text,
  original_storage_path text not null,
  publish_storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  provider text not null check (provider in ('instagram', 'facebook')),
  provider_account_id text not null,
  account_name text not null,
  encrypted_access_token text not null,
  encrypted_refresh_token text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  provider_metadata jsonb not null default '{}'::jsonb,
  status text not null default 'connected' check (status in ('connected', 'reconnect_required')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_account_id)
);

create table if not exists public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  user_id text not null,
  provider text not null check (provider in ('instagram', 'facebook')),
  callback_context text,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.social_publish_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  generated_content_id uuid not null references public.generated_content(id) on delete restrict,
  social_account_id uuid references public.social_accounts(id) on delete set null,
  provider text not null check (provider in ('instagram', 'facebook')),
  caption text not null,
  hashtags text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'processing', 'published', 'failed')),
  idempotency_key text not null,
  provider_post_id text,
  provider_container_id text,
  attempts integer not null default 0,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (user_id, idempotency_key)
);

create index if not exists generated_content_user_created_idx
  on public.generated_content (user_id, created_at desc);
create index if not exists social_accounts_user_idx
  on public.social_accounts (user_id);
create index if not exists social_publish_jobs_user_created_idx
  on public.social_publish_jobs (user_id, created_at desc);
create index if not exists oauth_states_expiry_idx
  on public.oauth_states (expires_at);

alter table public.generated_content enable row level security;
alter table public.social_accounts enable row level security;
alter table public.oauth_states enable row level security;
alter table public.social_publish_jobs enable row level security;

revoke all on public.generated_content from anon, authenticated;
revoke all on public.social_accounts from anon, authenticated;
revoke all on public.oauth_states from anon, authenticated;
revoke all on public.social_publish_jobs from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
