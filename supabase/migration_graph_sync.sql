-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Intelligence Graph v1 — Supabase persistence
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- User graphs table — stores full UserGraph JSON per authenticated user
create table if not exists public.user_graphs (
  user_id      uuid primary key references public.users(id) on delete cascade,
  graph_data   jsonb not null default '{}',
  graph_version int not null default 1,
  updated_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

alter table public.user_graphs enable row level security;

create index if not exists user_graphs_updated_idx on public.user_graphs(updated_at desc);
