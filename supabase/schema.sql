-- SolviqLab — User Data Schema
-- Run this in Supabase SQL Editor

-- Users table (synced from Google OAuth)
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  google_id   text unique not null,
  email       text unique not null,
  name        text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Calculator results (migrated from localStorage)
create table if not exists public.results (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.users(id) on delete cascade,
  instrument_slug text not null,
  instrument_name text not null,
  result_value    numeric,
  result_label    text,
  unit            text,
  cluster         text,
  completed_at    timestamptz default now()
);

-- Favorites
create table if not exists public.favorites (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.users(id) on delete cascade,
  instrument_slug text not null,
  created_at      timestamptz default now(),
  unique(user_id, instrument_slug)
);

-- RLS (Row Level Security) — users see only their own data
alter table public.users   enable row level security;
alter table public.results  enable row level security;
alter table public.favorites enable row level security;

-- Policies
create policy "users_own" on public.users
  for all using (google_id = current_setting('app.google_id', true));

create policy "results_own" on public.results
  for all using (
    user_id = (select id from public.users where google_id = current_setting('app.google_id', true))
  );

create policy "favorites_own" on public.favorites
  for all using (
    user_id = (select id from public.users where google_id = current_setting('app.google_id', true))
  );

-- Indexes
create index if not exists results_user_id_idx   on public.results(user_id);
create index if not exists results_cluster_idx   on public.results(cluster);
create index if not exists favorites_user_id_idx on public.favorites(user_id);
