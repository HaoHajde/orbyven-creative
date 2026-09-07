create extension if not exists pgcrypto;

create schema if not exists private;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  legal_name text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','manager','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.organization_modules (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_id text not null,
  enabled boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, module_id)
);

create table if not exists public.organization_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  display_name text,
  greeting_name text,
  logo_url text,
  timezone text not null default 'Europe/Bucharest',
  locale text not null default 'ro-RO',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();

drop trigger if exists organization_modules_set_updated_at on public.organization_modules;
create trigger organization_modules_set_updated_at before update on public.organization_modules for each row execute function public.set_updated_at();

drop trigger if exists organization_profiles_set_updated_at on public.organization_profiles;
create trigger organization_profiles_set_updated_at before update on public.organization_profiles for each row execute function public.set_updated_at();

create or replace function private.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org and m.user_id = auth.uid()
  );
$$;

create or replace function private.is_org_admin(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  );
$$;

revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.is_org_admin(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.is_org_admin(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_modules enable row level security;
alter table public.organization_profiles enable row level security;

create policy "organizations_select_member" on public.organizations for select to authenticated using (private.is_org_member(id));
create policy "organizations_insert_authenticated" on public.organizations for insert to authenticated with check (created_by = auth.uid());
create policy "organizations_update_admin" on public.organizations for update to authenticated using (private.is_org_admin(id)) with check (private.is_org_admin(id));
create policy "organizations_delete_owner" on public.organizations for delete to authenticated using (exists (select 1 from public.organization_members m where m.organization_id = id and m.user_id = auth.uid() and m.role = 'owner'));

create policy "members_select_org_members" on public.organization_members for select to authenticated using (private.is_org_member(organization_id));
create policy "members_insert_admin" on public.organization_members for insert to authenticated with check (private.is_org_admin(organization_id));
create policy "members_update_admin" on public.organization_members for update to authenticated using (private.is_org_admin(organization_id)) with check (private.is_org_admin(organization_id));
create policy "members_delete_admin" on public.organization_members for delete to authenticated using (private.is_org_admin(organization_id));

create policy "modules_select_member" on public.organization_modules for select to authenticated using (private.is_org_member(organization_id));
create policy "modules_insert_admin" on public.organization_modules for insert to authenticated with check (private.is_org_admin(organization_id));
create policy "modules_update_admin" on public.organization_modules for update to authenticated using (private.is_org_admin(organization_id)) with check (private.is_org_admin(organization_id));
create policy "modules_delete_admin" on public.organization_modules for delete to authenticated using (private.is_org_admin(organization_id));

create policy "profiles_select_member" on public.organization_profiles for select to authenticated using (private.is_org_member(organization_id));
create policy "profiles_insert_admin" on public.organization_profiles for insert to authenticated with check (private.is_org_admin(organization_id));
create policy "profiles_update_admin" on public.organization_profiles for update to authenticated using (private.is_org_admin(organization_id)) with check (private.is_org_admin(organization_id));
create policy "profiles_delete_admin" on public.organization_profiles for delete to authenticated using (private.is_org_admin(organization_id));

create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists organization_modules_org_enabled_idx on public.organization_modules(organization_id, enabled);
