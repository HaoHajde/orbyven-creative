-- ORBYVEN workspace backend
-- Connects the portable module registry to real tenant-aware Supabase persistence.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'trial' check (status in ('active', 'trial', 'paused', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.modules (
  id text primary key,
  name text not null,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_modules (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_id text not null references public.modules(id) on delete cascade,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, module_id)
);

create index if not exists organization_memberships_user_idx
  on public.organization_memberships(user_id);
create index if not exists organization_modules_org_idx
  on public.organization_modules(organization_id);

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.modules enable row level security;
alter table public.organization_modules enable row level security;

-- SECURITY DEFINER helpers avoid recursive RLS evaluation on memberships.
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_org
      and membership.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(target_org uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_org
      and membership.user_id = auth.uid()
      and membership.role = any(allowed_roles)
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, text[]) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, text[]) to authenticated;

drop policy if exists "members can read organizations" on public.organizations;
create policy "members can read organizations"
on public.organizations for select
to authenticated
using (public.is_org_member(id));

drop policy if exists "admins can update organizations" on public.organizations;
create policy "admins can update organizations"
on public.organizations for update
to authenticated
using (public.has_org_role(id, array['owner', 'admin']))
with check (public.has_org_role(id, array['owner', 'admin']));

drop policy if exists "members can read memberships" on public.organization_memberships;
create policy "members can read memberships"
on public.organization_memberships for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "authenticated can read modules" on public.modules;
create policy "authenticated can read modules"
on public.modules for select
to authenticated
using (is_active = true);

drop policy if exists "members can read organization modules" on public.organization_modules;
create policy "members can read organization modules"
on public.organization_modules for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "admins can insert organization modules" on public.organization_modules;
create policy "admins can insert organization modules"
on public.organization_modules for insert
to authenticated
with check (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "admins can update organization modules" on public.organization_modules;
create policy "admins can update organization modules"
on public.organization_modules for update
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']))
with check (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "admins can delete organization modules" on public.organization_modules;
create policy "admins can delete organization modules"
on public.organization_modules for delete
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']));

-- IDs must stay aligned with lib/orbyven-modules.ts.
insert into public.modules (id, name, description)
values
  ('overview', 'Overview', 'Imaginea de ansamblu a businessului, fără zgomot.'),
  ('leads', 'Clienți & cereri', 'Centralizează cererile, contactele și progresul comercial.'),
  ('tasks', 'Lucrări & taskuri', 'Ce trebuie făcut, de cine și până când.'),
  ('calendar', 'Programări', 'Programări, vizite și intervenții într-un singur calendar.'),
  ('estimates', 'Oferte & devize', 'Creează și urmărește oferte comerciale.'),
  ('documents', 'Documente', 'Fișierele firmei organizate lâă contextul lor real.'),
  ('expenses', 'Cheltuieli', 'O vedere simplă asupra costurilor și ieșirilor de bani.'),
  ('team', 'Echipă', 'Responsabilități și activitate pentru oamenii din teren.')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true;

-- Creates the first organization for an authenticated pilot account.
-- Public signup is intentionally not introduced here; ORBYVEN controls who receives an auth account.
create or replace function public.bootstrap_organization(
  p_name text,
  p_slug text,
  p_module_ids text[] default array['overview', 'leads', 'tasks']::text[]
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  new_org_id uuid;
  clean_name text := btrim(p_name);
  clean_slug text := lower(btrim(p_slug));
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1
    from public.organization_memberships
    where user_id = current_user_id
  ) then
    raise exception 'User already belongs to an ORBYVEN organization';
  end if;

  if char_length(clean_name) < 2 or char_length(clean_name) > 120 then
    raise exception 'Organization name must contain between 2 and 120 characters';
  end if;

  if clean_slug !~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$' then
    raise exception 'Invalid organization slug';
  end if;

  insert into public.organizations (name, slug, status)
  values (clean_name, clean_slug, 'trial')
  returning id into new_org_id;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (new_org_id, current_user_id, 'owner');

  insert into public.organization_modules (organization_id, module_id, enabled)
  select new_org_id, module.id, true
  from public.modules module
  where module.is_active = true
    and module.id = any(coalesce(p_module_ids, array['overview', 'leads', 'tasks']::text[]));

  -- Overview is a core module and is always present.
  insert into public.organization_modules (organization_id, module_id, enabled)
  values (new_org_id, 'overview', true)
  on conflict (organization_id, module_id) do update set enabled = true;

  return new_org_id;
end;
$$;

revoke all on function public.bootstrap_organization(text, text, text[]) from public;
grant execute on function public.bootstrap_organization(text, text, text[]) to authenticated;
