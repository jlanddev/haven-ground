-- ============================================================================
-- Haven Ground listings CMS. One table holds each property's FULL object as
-- jsonb (identical shape to the old propertiesData.js entries, so the public
-- site renders exactly the same and no field is ever lost), plus a few first
-- class columns for querying, sorting, and the admin list.
--
-- Security: the public site can read PUBLISHED listings. Only your admin
-- account(s) can create or edit. No service-role key needed; writes are
-- authorized by your logged-in Supabase Auth session.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists properties (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text,
  status      text default 'Available',   -- Available | Sold | Pending
  featured    boolean default false,
  published   boolean default true,       -- unpublished = draft, hidden from site
  sort_order  integer default 0,          -- controls order on the listings page
  data        jsonb not null default '{}'::jsonb,  -- the full property object
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists idx_properties_published on properties (published) where published = true;
create index if not exists idx_properties_sort on properties (sort_order);

-- Keep updated_at fresh on every write.
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_properties_updated on properties;
create trigger trg_properties_updated before update on properties
  for each row execute function set_updated_at();

-- ---- Row Level Security -----------------------------------------------------
alter table properties enable row level security;

-- Who is an admin. Add emails here (must match the Supabase Auth user email).
create or replace function is_haven_admin() returns boolean as $$
  select coalesce(
    (auth.jwt() ->> 'email') in (
      'jordan@havenground.com'
    ), false);
$$ language sql stable;

-- Public (anon + authenticated) can read published listings; admins read all.
drop policy if exists properties_read on properties;
create policy properties_read on properties
  for select using (published = true or is_haven_admin());

-- Only admins can write.
drop policy if exists properties_insert on properties;
create policy properties_insert on properties
  for insert with check (is_haven_admin());
drop policy if exists properties_update on properties;
create policy properties_update on properties
  for update using (is_haven_admin()) with check (is_haven_admin());
drop policy if exists properties_delete on properties;
create policy properties_delete on properties
  for delete using (is_haven_admin());

-- ---- Photo storage bucket ---------------------------------------------------
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

-- Anyone can view photos (public site); only admins can upload/replace/delete.
drop policy if exists property_photos_read on storage.objects;
create policy property_photos_read on storage.objects
  for select using (bucket_id = 'property-photos');
drop policy if exists property_photos_write on storage.objects;
create policy property_photos_write on storage.objects
  for insert with check (bucket_id = 'property-photos' and is_haven_admin());
drop policy if exists property_photos_update on storage.objects;
create policy property_photos_update on storage.objects
  for update using (bucket_id = 'property-photos' and is_haven_admin());
drop policy if exists property_photos_delete on storage.objects;
create policy property_photos_delete on storage.objects
  for delete using (bucket_id = 'property-photos' and is_haven_admin());
