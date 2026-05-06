-- Background job table for long-running tarot interpretations.
-- The /api/interpret route inserts a job, a Netlify background function
-- consumes it and writes back the result; the browser subscribes via
-- Supabase Realtime (or polls /api/jobs/[id] as a fallback).

create table if not exists interpretation_jobs (
  id uuid primary key default gen_random_uuid(),
  client_token text not null default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending',
  mode text not null default 'legacy',
  payload jsonb not null,
  result_text text,
  result_headers jsonb,
  model text,
  pipeline text,
  generation_mode text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interpretation_jobs_status_created_idx
  on interpretation_jobs (status, created_at desc);

create unique index if not exists interpretation_jobs_client_token_idx
  on interpretation_jobs (client_token);

alter table interpretation_jobs enable row level security;

drop policy if exists "service role full access interpretation_jobs"
  on interpretation_jobs;
create policy "service role full access interpretation_jobs"
on interpretation_jobs
for all
to service_role
using (true)
with check (true);

-- 匿名只能读到非敏感列：id / status / updated_at。
-- payload、result_text、error 等内容必须经 service role 走 /api/jobs/[id] 才能拿到。
-- Realtime 在 anon 订阅时也会按列级权限过滤 UPDATE 事件，仅作"完成通知"。
revoke all on interpretation_jobs from anon;
grant select (id, status, updated_at) on interpretation_jobs to anon;

drop policy if exists "anonymous read interpretation_jobs"
  on interpretation_jobs;
drop policy if exists "anonymous read interpretation_jobs status"
  on interpretation_jobs;
create policy "anonymous read interpretation_jobs status"
on interpretation_jobs
for select
to anon
using (true);

-- 把表加入 Realtime publication（若已存在则忽略）
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'interpretation_jobs'
  ) then
    execute 'alter publication supabase_realtime add table public.interpretation_jobs';
  end if;
end $$;

-- updated_at 自动更新
create or replace function set_interpretation_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_interpretation_jobs_updated_at on interpretation_jobs;
create trigger trg_interpretation_jobs_updated_at
  before update on interpretation_jobs
  for each row execute function set_interpretation_jobs_updated_at();
