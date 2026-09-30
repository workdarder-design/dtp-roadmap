-- DTP Roadmap — initial schema, RLS, seed data

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (linked to auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'admin' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'admin')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Profiles: users read own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Profiles: users update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Roadmap items
-- ---------------------------------------------------------------------------

create table public.roadmap_items (
  id text primary key,
  module text not null,
  feature text not null,
  priority text not null check (priority in ('High', 'Medium', 'Low')),
  sprint text not null,
  eta_staging date,
  eta_production date,
  business_status text not null default '',
  dev_status text not null default '',
  delivery_status text not null default '',
  remarks text not null default '',
  framework text not null default 'SAFe' check (framework in ('SAFe', 'Scrum')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index roadmap_items_sprint_idx on public.roadmap_items (sprint);
create index roadmap_items_module_idx on public.roadmap_items (module);

create trigger roadmap_items_updated_at
  before update on public.roadmap_items
  for each row execute function public.set_updated_at();

alter table public.roadmap_items enable row level security;

create policy "Roadmap: public read"
  on public.roadmap_items for select
  to anon, authenticated
  using (true);

create policy "Roadmap: admin insert"
  on public.roadmap_items for insert
  to authenticated
  with check (public.is_admin());

create policy "Roadmap: admin update"
  on public.roadmap_items for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Roadmap: admin delete"
  on public.roadmap_items for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Consultations (client share links)
-- ---------------------------------------------------------------------------

create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  slug text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index consultations_slug_idx on public.consultations (slug);
create index consultations_updated_at_idx on public.consultations (updated_at desc);

create trigger consultations_updated_at
  before update on public.consultations
  for each row execute function public.set_updated_at();

alter table public.consultations enable row level security;

create policy "Consultations: public read"
  on public.consultations for select
  to anon, authenticated
  using (true);

create policy "Consultations: admin insert"
  on public.consultations for insert
  to authenticated
  with check (public.is_admin());

create policy "Consultations: admin update"
  on public.consultations for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Consultations: admin delete"
  on public.consultations for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Announcement statuses (per sprint key)
-- ---------------------------------------------------------------------------

create table public.announcement_statuses (
  sprint_key text primary key,
  status text not null check (status in ('Draft', 'Published', 'Archived')),
  updated_at timestamptz not null default now()
);

create trigger announcement_statuses_updated_at
  before update on public.announcement_statuses
  for each row execute function public.set_updated_at();

alter table public.announcement_statuses enable row level security;

create policy "Announcements: authenticated read"
  on public.announcement_statuses for select
  to authenticated
  using (true);

create policy "Announcements: admin insert"
  on public.announcement_statuses for insert
  to authenticated
  with check (public.is_admin());

create policy "Announcements: admin update"
  on public.announcement_statuses for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Announcements: admin delete"
  on public.announcement_statuses for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- App settings (singleton — public share token)
-- ---------------------------------------------------------------------------

create table public.app_settings (
  id int primary key default 1 check (id = 1),
  share_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "Settings: public read share token"
  on public.app_settings for select
  to anon, authenticated
  using (true);

create policy "Settings: admin update"
  on public.app_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------------

insert into public.app_settings (id, share_token)
values (1, encode(gen_random_bytes(24), 'hex'))
on conflict (id) do nothing;

insert into public.roadmap_items (
  id, module, feature, priority, sprint,
  eta_staging, eta_production,
  business_status, dev_status, delivery_status, remarks, framework
) values
  ('DCAA-001', 'Employee Appraisal', 'UI Enhancements & BIGs', 'High', 'Sprint 10', '2026-05-07', null, 'Planned', 'Done', 'Handover (to Client)', '', 'SAFe'),
  ('DCAA-002', 'Employee Appraisal', 'KPI Calculation', 'High', 'Sprint 10', '2026-05-07', null, 'Gathering Req', 'Done', '', '', 'SAFe'),
  ('DCAA-003', 'Employee Appraisal', 'UAT & Extra Courses', 'High', 'Sprint 12', '2026-07-20', null, 'In Analysis', 'Done', '', '', 'SAFe'),
  ('DCAA-004', 'Performance', 'UAT Enhancements & BUGs', 'High', 'Sprint 10', '2026-05-07', null, 'Planned', 'Done', 'Handover (to Client)', '', 'SAFe'),
  ('DCAA-005', 'Committees', 'Committee CR', 'High', 'Sprint 11', '2026-07-21', null, 'Validation', 'Done', '', '', 'SAFe'),
  ('DCAA-006', 'Projects', 'Filter Unification', 'Medium', 'Sprint 12', '2026-07-30', null, 'Planned', 'In Progress', '', '', 'SAFe'),
  ('DCAA-007', 'Committees', 'Filter Unification', 'High', 'Sprint 12', '2026-07-30', null, 'Planned', 'In Progress', '', '', 'SAFe'),
  ('DCAA-008', 'Performance', 'Filter Unification', 'Medium', 'Sprint 13', null, null, 'Planned', 'In Progress', '', '', 'SAFe'),
  ('DCAA-009', 'Services', 'Filter Unification', 'High', 'Sprint 13', '2026-07-30', null, 'Planned', 'In Progress', '', '', 'SAFe'),
  ('DCAA-010', 'Innovation', 'Filter Unification', 'Medium', 'Sprint 13', null, null, 'Planned', 'In Progress', '', '', 'SAFe'),
  ('DCAA-011', 'BAU', 'Filter Unification', 'High', 'Sprint 13', '2026-07-30', null, 'Planned', 'In Progress', '', '', 'SAFe'),
  ('DCAA-012', 'Audit', 'Filter Unification', 'Medium', 'Sprint 13', null, null, 'Planned', 'In Progress', '', '', 'SAFe'),
  ('DCAA-013', 'Audit', 'Data Migration', 'High', 'Sprint 11', '2026-07-07', '2026-07-07', 'Planned', 'Done', 'Handover (to Client)', '', 'SAFe'),
  ('DCAA-014', 'Committees', 'Apply Dubai Font in Meeting Minutes', 'High', 'Sprint 14', null, null, '', '', '', '', 'SAFe'),
  ('DCAA-015', 'Committees', 'Enhance Agenda Items Structure', 'High', 'Sprint 14', null, null, '', '', '', '', 'SAFe'),
  ('DCAA-016', 'Committees', 'Enhance External Attendees (Guests) Entry Form', 'High', 'Sprint 14', null, null, '', '', '', '', 'SAFe'),
  ('DCAA-017', 'Committees', 'Display Meeting Information on Tasks and Decisions', 'Medium', 'Sprint 14', null, null, '', '', '', '', 'SAFe'),
  ('DCAA-018', 'Committees', 'Add Concerned Person Field to Tasks', 'Medium', 'Sprint 14', null, null, '', '', '', '', 'SAFe')
on conflict (id) do nothing;

insert into public.consultations (id, client_name, slug, notes, created_at, updated_at)
values
  (
    'a0000001-0000-4000-8000-000000000001',
    'Ahmed Mohamed',
    'ahmed-mohamed',
    'DCAA program roadmap share',
    '2026-09-01T08:00:00.000Z',
    '2026-09-20T10:00:00.000Z'
  ),
  (
    'a0000002-0000-4000-8000-000000000002',
    'Sara Al Hashimi',
    'sara-al-hashimi',
    'Stakeholder review link',
    '2026-09-10T09:00:00.000Z',
    '2026-09-22T14:00:00.000Z'
  )
on conflict (id) do nothing;

-- Admin reset: delete all roadmap rows and re-insert baseline (admin only)
create or replace function public.reset_roadmap_to_seed()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  delete from public.roadmap_items;

  insert into public.roadmap_items (
    id, module, feature, priority, sprint,
    eta_staging, eta_production,
    business_status, dev_status, delivery_status, remarks, framework
  ) values
    ('DCAA-001', 'Employee Appraisal', 'UI Enhancements & BIGs', 'High', 'Sprint 10', '2026-05-07', null, 'Planned', 'Done', 'Handover (to Client)', '', 'SAFe'),
    ('DCAA-002', 'Employee Appraisal', 'KPI Calculation', 'High', 'Sprint 10', '2026-05-07', null, 'Gathering Req', 'Done', '', '', 'SAFe'),
    ('DCAA-003', 'Employee Appraisal', 'UAT & Extra Courses', 'High', 'Sprint 12', '2026-07-20', null, 'In Analysis', 'Done', '', '', 'SAFe'),
    ('DCAA-004', 'Performance', 'UAT Enhancements & BUGs', 'High', 'Sprint 10', '2026-05-07', null, 'Planned', 'Done', 'Handover (to Client)', '', 'SAFe'),
    ('DCAA-005', 'Committees', 'Committee CR', 'High', 'Sprint 11', '2026-07-21', null, 'Validation', 'Done', '', '', 'SAFe'),
    ('DCAA-006', 'Projects', 'Filter Unification', 'Medium', 'Sprint 12', '2026-07-30', null, 'Planned', 'In Progress', '', '', 'SAFe'),
    ('DCAA-007', 'Committees', 'Filter Unification', 'High', 'Sprint 12', '2026-07-30', null, 'Planned', 'In Progress', '', '', 'SAFe'),
    ('DCAA-008', 'Performance', 'Filter Unification', 'Medium', 'Sprint 13', null, null, 'Planned', 'In Progress', '', '', 'SAFe'),
    ('DCAA-009', 'Services', 'Filter Unification', 'High', 'Sprint 13', '2026-07-30', null, 'Planned', 'In Progress', '', '', 'SAFe'),
    ('DCAA-010', 'Innovation', 'Filter Unification', 'Medium', 'Sprint 13', null, null, 'Planned', 'In Progress', '', '', 'SAFe'),
    ('DCAA-011', 'BAU', 'Filter Unification', 'High', 'Sprint 13', '2026-07-30', null, 'Planned', 'In Progress', '', '', 'SAFe'),
    ('DCAA-012', 'Audit', 'Filter Unification', 'Medium', 'Sprint 13', null, null, 'Planned', 'In Progress', '', '', 'SAFe'),
    ('DCAA-013', 'Audit', 'Data Migration', 'High', 'Sprint 11', '2026-07-07', '2026-07-07', 'Planned', 'Done', 'Handover (to Client)', '', 'SAFe'),
    ('DCAA-014', 'Committees', 'Apply Dubai Font in Meeting Minutes', 'High', 'Sprint 14', null, null, '', '', '', '', 'SAFe'),
    ('DCAA-015', 'Committees', 'Enhance Agenda Items Structure', 'High', 'Sprint 14', null, null, '', '', '', '', 'SAFe'),
    ('DCAA-016', 'Committees', 'Enhance External Attendees (Guests) Entry Form', 'High', 'Sprint 14', null, null, '', '', '', '', 'SAFe'),
    ('DCAA-017', 'Committees', 'Display Meeting Information on Tasks and Decisions', 'Medium', 'Sprint 14', null, null, '', '', '', '', 'SAFe'),
    ('DCAA-018', 'Committees', 'Add Concerned Person Field to Tasks', 'Medium', 'Sprint 14', null, null, '', '', '', '', 'SAFe');
end;
$$;

grant execute on function public.reset_roadmap_to_seed() to authenticated;

-- Backfill profiles for auth users created before this migration
insert into public.profiles (id, display_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data->>'role', 'admin')
from auth.users u
on conflict (id) do nothing;
