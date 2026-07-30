-- ============================================================================
--  LAVA Training Portal — Supabase setup
--  Run this once in your Supabase project:  Dashboard -> SQL Editor -> New query
--  -> paste everything below -> Run.
-- ============================================================================

-- 1) TABLE ---------------------------------------------------------------------
create table if not exists public.calendars (
  id          uuid primary key default gen_random_uuid(),
  agency      text        not null default 'New Insurance Agency',
  first_name  text        not null default 'Jane',
  last_name   text        not null default 'Smith',
  support     text        not null default 'Commercial Lines',
  active_day  int         not null default 1 check (active_day between 1 and 15),
  photo_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- keep updated_at fresh on every change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists calendars_set_updated_at on public.calendars;
create trigger calendars_set_updated_at
  before update on public.calendars
  for each row execute function public.set_updated_at();


-- 2) ROW LEVEL SECURITY --------------------------------------------------------
alter table public.calendars enable row level security;

-- === QUICK-START POLICIES (default) ==========================================
-- Anyone with the site URL can read AND edit. Good for an internal team tool
-- behind a link you only share with staff. Simple and works immediately.
drop policy if exists "public read"   on public.calendars;
drop policy if exists "public write"  on public.calendars;
drop policy if exists "public update" on public.calendars;
drop policy if exists "public delete" on public.calendars;

create policy "public read"   on public.calendars for select using (true);
create policy "public write"  on public.calendars for insert with check (true);
create policy "public update"  on public.calendars for update using (true) with check (true);
create policy "public delete"  on public.calendars for delete using (true);

-- === PRODUCTION / LOCKED-DOWN ALTERNATIVE (recommended for real deployments) =
-- Public can VIEW (so share links keep working), but only signed-in managers
-- can add / edit / delete. To use this instead:
--   1. Delete the four "public write/update/delete" policies above.
--   2. Uncomment the three policies below and re-run.
--   3. Create a manager user in Authentication -> Users, and add a login step.
--
-- create policy "auth insert" on public.calendars for insert to authenticated with check (true);
-- create policy "auth update" on public.calendars for update to authenticated using (true) with check (true);
-- create policy "auth delete" on public.calendars for delete to authenticated using (true);


-- 3) STORAGE BUCKET FOR VA PHOTOS ---------------------------------------------
insert into storage.buckets (id, name, public)
values ('va-photos', 'va-photos', true)
on conflict (id) do nothing;

-- Public read of photos (so avatars display everywhere); public upload/update
-- to match the quick-start table policies above.
drop policy if exists "va photos read"   on storage.objects;
drop policy if exists "va photos write"  on storage.objects;
drop policy if exists "va photos update" on storage.objects;

create policy "va photos read"
  on storage.objects for select
  using (bucket_id = 'va-photos');

create policy "va photos write"
  on storage.objects for insert
  with check (bucket_id = 'va-photos');

create policy "va photos update"
  on storage.objects for update
  using (bucket_id = 'va-photos');

-- For the locked-down setup, restrict the two write policies above to
-- `to authenticated` the same way as the table policies.
