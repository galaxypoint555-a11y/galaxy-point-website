-- Run once in Supabase SQL Editor. Never expose service_role keys in the browser.
create extension if not exists pgcrypto;
create table if not exists public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade, role text not null check(role in ('admin','boss','editor')));
create table if not exists public.products (id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, brand text not null, category text not null, variant text not null, condition text default 'Pre-owned', color text default '', price_inr integer not null check(price_inr>0), original_price_inr integer, stock integer not null default 0 check(stock>=0), image_url text, description text default '', featured boolean default false, active boolean default true, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.site_settings (id integer primary key default 1 check(id=1), hero_title text, hero_label text, hero_video_url text, hero_image_url text, banner_image_url text, banner_link text);
insert into public.site_settings(id,hero_title,hero_label,banner_link) values (1,'Browse our latest products','THE GALAXY EDIT · 2026','#shop') on conflict(id) do nothing;
create table if not exists public.orders (id uuid primary key default gen_random_uuid(), customer_name text, total_inr integer not null check(total_inr>=0), payment_status text not null default 'unpaid' check(payment_status in ('unpaid','pending','paid','failed','refunded')), status text not null default 'new' check(status in ('new','pending','processing','shipped','completed','cancelled')), created_at timestamptz default now());
create table if not exists public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, product_id uuid references public.products(id), title text not null, quantity integer not null check(quantity>0), unit_price_inr integer not null check(unit_price_inr>=0));
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()) and a.role in ('admin','boss','editor'))$$;
create or replace function public.is_boss() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()) and a.role in ('admin','boss'))$$;
alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.site_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
create policy "Staff read own role" on public.admin_users for select to authenticated using (user_id=(select auth.uid()));
create policy "Public view active products" on public.products for select to anon,authenticated using (active=true or public.is_staff());
create policy "Staff create products" on public.products for insert to authenticated with check(public.is_staff());
create policy "Staff update products" on public.products for update to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "Staff delete products" on public.products for delete to authenticated using(public.is_staff());
create policy "Public view site settings" on public.site_settings for select to anon,authenticated using(true);
create policy "Staff update site settings" on public.site_settings for update to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "Boss read orders" on public.orders for select to authenticated using(public.is_boss());
create policy "Boss update fulfilment" on public.orders for update to authenticated using(public.is_boss()) with check(public.is_boss());
create policy "Boss read order items" on public.order_items for select to authenticated using(public.is_boss());
-- Paid payment_status must only be written by a trusted server-side verified payment webhook.
-- The dashboard client must not be allowed to mark orders paid.
create or replace function public.protect_order_payment_fields() returns trigger language plpgsql set search_path='' as $$begin if new.payment_status is distinct from old.payment_status or new.total_inr is distinct from old.total_inr then raise exception 'Payment status and totals can only be changed by trusted server';end if;return new;end$$;
drop trigger if exists protect_order_payment_fields_trigger on public.orders;
create trigger protect_order_payment_fields_trigger before update on public.orders for each row execute function public.protect_order_payment_fields();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('gp-site-media','gp-site-media',true,31457280,array['image/jpeg','image/png','image/webp','video/mp4','video/webm']) on conflict(id) do nothing;
create policy "Public read site media" on storage.objects for select to anon,authenticated using(bucket_id='gp-site-media');
create policy "Staff upload site media" on storage.objects for insert to authenticated with check(bucket_id='gp-site-media' and public.is_staff());
-- Grant access after staff signs up: replace the UUIDs with auth.users IDs.
-- insert into public.admin_users(user_id,role) values ('BOSS_AUTH_UUID','boss'),('EDITOR_AUTH_UUID','editor');
