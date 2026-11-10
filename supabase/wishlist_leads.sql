-- Run once in Supabase SQL Editor to enable live customer wishlist leads.
-- Public users may submit an enquiry, but cannot read other customers' details.
create table if not exists public.wishlist_leads (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 customer_name text not null check (char_length(trim(customer_name)) between 2 and 120),
 phone text not null check (phone ~ '^[0-9]{10}$'),
 product_id text not null,
 product_name text not null,
 action text not null default 'added' check (action = 'added')
);
alter table public.wishlist_leads enable row level security;
revoke all on public.wishlist_leads from anon, authenticated;
grant insert on public.wishlist_leads to anon, authenticated;
grant select on public.wishlist_leads to authenticated;
drop policy if exists "Public submit wishlist lead" on public.wishlist_leads;
create policy "Public submit wishlist lead" on public.wishlist_leads for insert to anon, authenticated with check (action='added');
drop policy if exists "Boss read wishlist leads" on public.wishlist_leads;
create policy "Boss read wishlist leads" on public.wishlist_leads for select to authenticated
using (exists (
 select 1 from public.staff_profiles sp
 where sp.user_id=(select auth.uid()) and sp.role='boss'
));
create index if not exists wishlist_leads_created_idx on public.wishlist_leads(created_at desc);
