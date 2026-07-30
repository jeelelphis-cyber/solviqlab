-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Member Platform v1
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add trial + subscription fields to users table
alter table public.users
  add column if not exists trial_expires_at      timestamptz,
  add column if not exists stripe_customer_id    text unique,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_status         text check (stripe_status in ('active','past_due','canceled','trialing')),
  add column if not exists stripe_period_end     timestamptz,
  add column if not exists is_pro                boolean default false;

-- 2. Index for trial expiry checks (cron job)
create index if not exists users_trial_expires_idx on public.users(trial_expires_at)
  where trial_expires_at is not null;

create index if not exists users_is_pro_idx on public.users(is_pro)
  where is_pro = true;

-- 3. Platform events table
create table if not exists public.platform_events (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  user_id      uuid references public.users(id) on delete set null,
  anonymous_id text,
  session_id   text not null,
  lang         text not null default 'en',
  payload      jsonb,
  timestamp    timestamptz not null default now(),
  created_at   timestamptz default now()
);

create index if not exists platform_events_user_idx  on public.platform_events(user_id);
create index if not exists platform_events_name_idx  on public.platform_events(name);
create index if not exists platform_events_time_idx  on public.platform_events(timestamp desc);

alter table public.platform_events enable row level security;

-- 4. Rate limiting table (message counts)
create table if not exists public.rate_limits (
  user_id     uuid references public.users(id) on delete cascade,
  window_key  text not null,   -- e.g. 'chat:2026-07-30T10'  (hourly bucket)
  count       int default 1,
  primary key (user_id, window_key)
);

-- 5. Fix RLS policies — remove broken current_setting() approach
-- Drop old policies
drop policy if exists "users_own"            on public.users;
drop policy if exists "results_own"          on public.results;
drop policy if exists "favorites_own"        on public.favorites;
drop policy if exists "conversations_own"    on public.conversations;
drop policy if exists "coach_selections_own" on public.user_coach_selections;

-- NOTE: All writes now go through service role key (server-side API routes only).
-- Reads can use anon key with these simplified policies if needed.
-- For now: service role bypasses RLS entirely — no policy needed for writes.
-- These policies allow authenticated reads via service role (always passes).
-- ─────────────────────────────────────────────────────────────────────────────
