create extension if not exists pgcrypto;

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  contact_type text not null default 'wechat',
  topic text not null,
  preferred_time text,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists bookings_created_at_idx on bookings (created_at desc);
create index if not exists bookings_status_idx on bookings (status);

alter table bookings enable row level security;

create policy "anonymous insert bookings"
on bookings
for insert
to anon
with check (true);

create policy "service role full access bookings"
on bookings
for all
to service_role
using (true)
with check (true);
