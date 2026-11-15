-- Galaxy Point CRM: additive schema for private lead, service, and billing records.
-- Apply only to the existing Galaxy Point Website Supabase project.

begin;

-- Keep the existing Boss and website Manager roles. Add two narrowly scoped CRM roles.
alter table public.staff_profiles
  drop constraint if exists staff_profiles_role_check;
alter table public.staff_profiles
  add constraint staff_profiles_role_check
  check (role = any (array['boss'::text, 'manager'::text, 'social_media_manager'::text, 'service_center'::text]));

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 120),
  customer_phone text not null check (char_length(regexp_replace(customer_phone, '[^0-9]', '', 'g')) between 10 and 15),
  source text not null check (source in ('instagram_message', 'whatsapp_message', 'whatsapp_call', 'normal_call', 'justdial')),
  destination text not null check (destination in ('service_center', 'sales_new', 'sales_used', 'accessories')),
  forwarded_by uuid not null references auth.users(id),
  forwarded_to text,
  status text not null default 'forwarded' check (status in ('forwarded', 'received', 'in_progress', 'bill_created', 'closed', 'not_converted')),
  response_received_at timestamptz,
  response_note text check (response_note is null or char_length(response_note) <= 1000),
  follow_up_at timestamptz,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  interaction_type text not null check (interaction_type in ('inquiry', 'response', 'follow_up', 'note')),
  channel text not null check (channel in ('instagram_message', 'whatsapp_message', 'whatsapp_call', 'normal_call', 'justdial')),
  summary text check (summary is null or char_length(summary) <= 1000),
  created_by uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.crm_bills (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  bill_number text not null check (char_length(btrim(bill_number)) between 1 and 80),
  bill_date date not null default current_date,
  amount_inr numeric(12,2) not null check (amount_inr >= 0),
  created_by uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  unique (lead_id, bill_number)
);

create index if not exists crm_leads_created_at_idx on public.crm_leads (created_at desc);
create index if not exists crm_leads_destination_status_idx on public.crm_leads (destination, status, created_at desc);
create index if not exists crm_leads_creator_idx on public.crm_leads (created_by, created_at desc);
create index if not exists crm_leads_forwarder_idx on public.crm_leads (forwarded_by);
create index if not exists crm_interactions_lead_created_idx on public.crm_interactions (lead_id, created_at desc);
create index if not exists crm_interactions_channel_created_idx on public.crm_interactions (channel, created_at desc);
create index if not exists crm_interactions_creator_idx on public.crm_interactions (created_by);
create index if not exists crm_bills_lead_date_idx on public.crm_bills (lead_id, bill_date desc);
create index if not exists crm_bills_creator_idx on public.crm_bills (created_by);

alter table public.crm_leads enable row level security;
alter table public.crm_interactions enable row level security;
alter table public.crm_bills enable row level security;

revoke all on public.crm_leads, public.crm_interactions, public.crm_bills from public;
revoke all on public.crm_leads, public.crm_interactions, public.crm_bills from anon;
revoke all on public.crm_leads, public.crm_interactions, public.crm_bills from authenticated;
grant select, insert on public.crm_leads, public.crm_interactions, public.crm_bills to authenticated;
grant update (status, response_received_at, response_note, follow_up_at, notes, forwarded_to, updated_at)
  on public.crm_leads to authenticated;

drop policy if exists crm_leads_read_by_role on public.crm_leads;
create policy crm_leads_read_by_role on public.crm_leads
  for select to authenticated
  using (
    exists (select 1 from public.staff_profiles sp where sp.user_id = (select auth.uid()) and sp.role = 'boss')
    or (created_by = (select auth.uid()) and exists (select 1 from public.staff_profiles sp where sp.user_id = (select auth.uid()) and sp.role = 'social_media_manager'))
    or (destination = 'service_center' and exists (select 1 from public.staff_profiles sp where sp.user_id = (select auth.uid()) and sp.role = 'service_center'))
  );

drop policy if exists crm_leads_insert_by_role on public.crm_leads;
create policy crm_leads_insert_by_role on public.crm_leads
  for insert to authenticated
  with check (
    created_by = (select auth.uid()) and forwarded_by = (select auth.uid())
    and exists (select 1 from public.staff_profiles sp where sp.user_id = (select auth.uid()) and sp.role in ('boss', 'social_media_manager'))
  );

drop policy if exists crm_leads_update_by_role on public.crm_leads;
create policy crm_leads_update_by_role on public.crm_leads
  for update to authenticated
  using (
    exists (select 1 from public.staff_profiles sp where sp.user_id = (select auth.uid()) and sp.role = 'boss')
    or (created_by = (select auth.uid()) and exists (select 1 from public.staff_profiles sp where sp.user_id = (select auth.uid()) and sp.role = 'social_media_manager'))
    or (destination = 'service_center' and exists (select 1 from public.staff_profiles sp where sp.user_id = (select auth.uid()) and sp.role = 'service_center'))
  )
  with check (
    exists (select 1 from public.staff_profiles sp where sp.user_id = (select auth.uid()) and sp.role = 'boss')
    or (created_by = (select auth.uid()) and forwarded_by = (select auth.uid()) and exists (select 1 from public.staff_profiles sp where sp.user_id = (select auth.uid()) and sp.role = 'social_media_manager'))
    or (destination = 'service_center' and exists (select 1 from public.staff_profiles sp where sp.user_id = (select auth.uid()) and sp.role = 'service_center'))
  );

drop policy if exists crm_interactions_read_by_role on public.crm_interactions;
create policy crm_interactions_read_by_role on public.crm_interactions
  for select to authenticated
  using (exists (select 1 from public.crm_leads l where l.id = lead_id));

drop policy if exists crm_interactions_insert_by_role on public.crm_interactions;
create policy crm_interactions_insert_by_role on public.crm_interactions
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.crm_leads l
      where l.id = lead_id
        and (
          exists (select 1 from public.staff_profiles sp where sp.user_id = (select auth.uid()) and sp.role = 'boss')
          or (l.created_by = (select auth.uid()) and exists (select 1 from public.staff_profiles sp where sp.user_id = (select auth.uid()) and sp.role = 'social_media_manager'))
          or (l.destination = 'service_center' and exists (select 1 from public.staff_profiles sp where sp.user_id = (select auth.uid()) and sp.role = 'service_center'))
        )
    )
  );

drop policy if exists crm_bills_read_by_role on public.crm_bills;
create policy crm_bills_read_by_role on public.crm_bills
  for select to authenticated
  using (exists (select 1 from public.crm_leads l where l.id = lead_id));

drop policy if exists crm_bills_insert_by_role on public.crm_bills;
create policy crm_bills_insert_by_role on public.crm_bills
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.crm_leads l
      where l.id = lead_id and l.destination = 'service_center'
        and exists (select 1 from public.staff_profiles sp where sp.user_id = (select auth.uid()) and sp.role in ('boss', 'service_center'))
    )
  );

commit;

