create extension if not exists pgcrypto;

create table if not exists readings (
  id uuid primary key default gen_random_uuid(),
  share_token text unique not null,
  spread_slug text not null,
  question text not null default '',
  cards jsonb not null,
  draw_log jsonb,
  reading_intent jsonb,
  user_feedback jsonb,
  adaptive_answers jsonb,
  ai_interpretation text not null,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists readings_share_token_idx on readings (share_token);
create index if not exists readings_created_at_idx on readings (created_at desc);

alter table readings enable row level security;

create policy "anonymous insert readings"
on readings
for insert
to anon
with check (true);

create policy "service role full access readings"
on readings
for all
to service_role
using (true)
with check (true);

-- Phase 2 placeholders for future RAG / practitioner workspace.
-- create extension if not exists vector;
-- create table knowledge_documents (...);
-- create table knowledge_chunks (...);
