-- GALAXY POINT — CUSTOMER LOGIN EVENTS
-- Run in Supabase > SQL Editor > New query
create table if not exists public.customer_login_events (
  id bigint generated always as identity primary key,
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 120),
  phone text not null check (phone ~ '^[0-9]{10}$'),
  source text not null check (source in ('website_login','mobile_login')),
  created_at timestamptz not null default now()
);

create index if not exists customer_login_events_source_created_idx
on public.customer_login_events (source, created_at desc);

alter table public.customer_login_events enable row level security;

revoke all on table public.customer_login_events from anon, authenticated;
grant insert on table public.customer_login_events to anon, authenticated;
grant select, delete on table public.customer_login_events to authenticated;

drop policy if exists "Public can register customer login" on public.customer_login_events;
drop policy if exists "Boss can view customer logins" on public.customer_login_events;

create policy "Public can register customer login"
on public.customer_login_events
for insert to anon, authenticated
with check (true);

create policy "Boss can view customer logins"
on public.customer_login_events
for select to authenticated
using (
  exists (
    select 1 from public.staff_profiles sp
    where sp.user_id = (select auth.uid())
      and sp.role = 'boss'
  )
);

-- Verify table and categories (empty until real customers register)
select source, count(*) as total_logins
from public.customer_login_events
group by source;
