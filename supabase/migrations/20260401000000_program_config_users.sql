-- Program modules / sprints (configurable in Settings) + admin user management

-- ---------------------------------------------------------------------------
-- Program modules & sprints
-- ---------------------------------------------------------------------------

create table public.program_modules (
  name text primary key,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.program_sprints (
  name text primary key,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.program_modules enable row level security;
alter table public.program_sprints enable row level security;

create policy "Program modules: public read"
  on public.program_modules for select
  to anon, authenticated
  using (true);

create policy "Program modules: admin insert"
  on public.program_modules for insert
  to authenticated
  with check (public.is_admin());

create policy "Program modules: admin delete"
  on public.program_modules for delete
  to authenticated
  using (public.is_admin());

create policy "Program sprints: public read"
  on public.program_sprints for select
  to anon, authenticated
  using (true);

create policy "Program sprints: admin insert"
  on public.program_sprints for insert
  to authenticated
  with check (public.is_admin());

create policy "Program sprints: admin delete"
  on public.program_sprints for delete
  to authenticated
  using (public.is_admin());

insert into public.program_modules (name, sort_order) values
  ('Dashboards', 0),
  ('Performance', 1),
  ('Services', 2),
  ('Projects', 3),
  ('Admin', 4),
  ('Committees', 5),
  ('BAU', 6),
  ('Employee Appraisal', 7),
  ('Innovation', 8),
  ('Audit', 9)
on conflict (name) do nothing;

insert into public.program_sprints (name, sort_order) values
  ('Sprint 10', 0),
  ('Sprint 11', 1),
  ('Sprint 12', 2),
  ('Sprint 13', 3),
  ('Sprint 14', 4),
  ('Sprint 15', 5),
  ('Sprint 16', 6),
  ('Sprint 17', 7),
  ('Sprint 18', 8),
  ('Sprint 19', 9),
  ('Sprint 20', 10)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Profiles: email + admin team management
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'admin'),
    new.email
  );
  return new;
end;
$$;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is distinct from u.email);

create policy "Profiles: admin read all"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "Profiles: admin update any"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  if target_id = auth.uid() then
    raise exception 'Cannot delete your own account';
  end if;
  delete from auth.users where id = target_id;
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;
