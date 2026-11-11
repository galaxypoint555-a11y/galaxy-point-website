-- Run once in the existing Galaxy Point Supabase project's SQL Editor.
-- Public visitors may INSERT login events; only authenticated staff can SELECT.
-- IMPORTANT: restrict SELECT to the same staff identities already authorized for the Boss Dashboard.
create table if not exists public.customer_login_events (
 id bigint generated always as identity primary key,
 customer_name text not null check (char_length(trim(customer_name)) between 2 and 120),
 phone text not null check (phone ~ '^[0-9]{10}$'),
 source text not null check (source in ('website_login','mobile_login')),
 created_at timestamptz not null default now()
);
create index if not exists customer_login_events_source_created_idx on public.customer_login_events (source,created_at desc);
alter table public.customer_login_events enable row level security;
revoke all on public.customer_login_events from anon,authenticated;
grant insert on public.customer_login_events to anon,authenticated;
grant usage,select on sequence public.customer_login_events_id_seq to anon,authenticated;
grant select on public.customer_login_events to authenticated;
drop policy if exists "Public can register customer login" on public.customer_login_events;
create policy "Public can register customer login" on public.customer_login_events for insert to anon,authenticated with check (true);
-- Do not enable read access for all authenticated users.
-- Add a SELECT policy scoped to your verified boss/staff auth UIDs before expecting dashboard reads.
-- Example (replace UUID with real boss account UID):
-- create policy "Boss can read customer login events" on public.customer_login_events
-- for select to authenticated using (auth.uid() = 'REPLACE-WITH-BOSS-UUID'::uuid);
