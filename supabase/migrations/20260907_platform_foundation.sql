-- ORBYVEN platform foundation
-- Multi-tenant organizations, memberships and portable module assignments.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'trial', 'paused', 'cancelled')),
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
  icon text,
  route text not null,
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

-- Users can only see organizations they belong to.
drop policy if exists "members can read organizations" on public.organizations;
create policy "members can read organizations"
on public.organizations for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = organizations.id
      and membership.user_id = auth.uid()
  )
);

-- Users can see memberships only inside organizations they belong to.
drop policy if exists "members can read memberships" on public.organization_memberships;
create policy "members can read memberships"
on public.organization_memberships for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships self_membership
    where self_membership.organization_id = organization_memberships.organization_id
      and self_membership.user_id = auth.uid()
  )
);

-- Module catalogue is safe for authenticated platform users to read.
drop policy if exists "authenticated can read modules" on public.modules;
create policy "authenticated can read modules"
on public.modules for select
to authenticated
using (is_active = true);

-- Module assignments/config are tenant-isolated.
drop policy if exists "members can read organization modules" on public.organization_modules;
create policy "members can read organization modules"
on public.organization_modules for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = organization_modules.organization_id
      and membership.user_id = auth.uid()
  )
);

-- Only owners/admins may change module configuration from authenticated clients.
drop policy if exists "admins can update organization modules" on public.organization_modules;
create policy "admins can update organization modules"
on public.organization_modules for update
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = organization_modules.organization_id
      and membership.user_id = auth.uid()
      and membership.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = organization_modules.organization_id
      and membership.user_id = auth.uid()
      and membership.role in ('owner', 'admin')
  )
);

insert into public.modules (id, name, description, icon, route)
values
  ('clients', 'Clienți', 'Contacte, istoric și relația cu clienții.', 'users', '/platform/modules/clients'),
  ('jobs', 'Lucrări', 'Lucrări, statusuri și activitatea din teren.', 'briefcase', '/platform/modules/jobs'),
  ('bookings', 'Rezervări', 'Programări și disponibilitate.', 'calendar', '/platform/modules/bookings'),
  ('quotes', 'Oferte', 'Oferte comerciale și urmărirea lor.', 'file-text', '/platform/modules/quotes')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  route = excluded.route,
  is_active = true;
