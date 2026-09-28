-- ORBYVEN Platform Core v2 — auth lifecycle, tenant suspension, staff RBAC and audit.
-- Ownership: Chat 2 / Platform Core.
-- Does not add module business tables or billing/entitlement logic.

alter table public.organizations
  add column if not exists lifecycle_status text not null default 'active';

alter table public.organizations
  drop constraint if exists organizations_lifecycle_status_check;

alter table public.organizations
  add constraint organizations_lifecycle_status_check
  check (lifecycle_status in ('provisioning', 'active', 'suspended', 'archived'));

alter table public.organization_members
  add column if not exists access_status text not null default 'active';

alter table public.organization_members
  add column if not exists updated_at timestamptz not null default now();

alter table public.organization_members
  drop constraint if exists organization_members_access_status_check;

alter table public.organization_members
  add constraint organization_members_access_status_check
  check (access_status in ('active', 'suspended'));

drop trigger if exists organization_members_set_updated_at on public.organization_members;
create trigger organization_members_set_updated_at
before update on public.organization_members
for each row execute function public.set_updated_at();

create table if not exists public.platform_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('platform_owner', 'platform_admin', 'support')),
  enabled boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists platform_staff_set_updated_at on public.platform_staff;
create trigger platform_staff_set_updated_at
before update on public.platform_staff
for each row execute function public.set_updated_at();

create table if not exists public.platform_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_role text,
  organization_id uuid references public.organizations(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.platform_staff enable row level security;
alter table public.platform_audit_log enable row level security;

-- Intentionally no authenticated policies on platform_staff/platform_audit_log.
-- These tables are internal and are accessed only by the server-side service role.

create index if not exists organizations_lifecycle_status_idx
  on public.organizations(lifecycle_status);
create index if not exists organization_members_user_access_idx
  on public.organization_members(user_id, access_status);
create index if not exists platform_staff_enabled_idx
  on public.platform_staff(enabled, role);
create index if not exists platform_audit_log_org_created_idx
  on public.platform_audit_log(organization_id, created_at desc);
create index if not exists platform_audit_log_actor_created_idx
  on public.platform_audit_log(actor_user_id, created_at desc);

-- A tenant member is visible only when both the membership and organization are active.
-- Existing module policies consume this helper, so suspension propagates to every
-- tenant-scoped module without Chat 1 having to duplicate access checks.
create or replace function private.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.access_status = 'active'
      and o.lifecycle_status = 'active'
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
    select 1
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
      and m.access_status = 'active'
      and o.lifecycle_status = 'active'
  );
$$;

revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.is_org_admin(uuid) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.is_org_admin(uuid) to authenticated;

-- Self-service organization creation must go through bootstrap_organization().
-- Control Center uses the service role and is not affected by this policy removal.
drop policy if exists "organizations_insert_authenticated" on public.organizations;

drop policy if exists "organizations_delete_owner" on public.organizations;
create policy "organizations_delete_owner"
on public.organizations
for delete
to authenticated
using (
  lifecycle_status = 'active'
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = id
      and m.user_id = auth.uid()
      and m.role = 'owner'
      and m.access_status = 'active'
  )
);

-- One explicit entry-state contract lets the client distinguish a genuinely new
-- account from a suspended tenant. This prevents a suspended member from being
-- incorrectly sent back through company onboarding.
create or replace function public.workspace_entry_state()
returns text
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  member_access text;
  organization_status text;
begin
  if current_user_id is null then
    return 'login';
  end if;

  select m.access_status, o.lifecycle_status
  into member_access, organization_status
  from public.organization_members m
  join public.organizations o on o.id = m.organization_id
  where m.user_id = current_user_id
  order by
    case
      when m.access_status = 'active' and o.lifecycle_status = 'active' then 0
      else 1
    end,
    m.created_at asc
  limit 1;

  if not found then
    return 'onboarding';
  end if;

  if member_access <> 'active' then
    return 'member_suspended';
  end if;

  if organization_status = 'provisioning' then
    return 'organization_provisioning';
  end if;

  if organization_status = 'suspended' then
    return 'organization_suspended';
  end if;

  if organization_status = 'archived' then
    return 'organization_archived';
  end if;

  return 'workspace';
end;
$$;

revoke execute on function public.workspace_entry_state() from public;
revoke execute on function public.workspace_entry_state() from anon;
grant execute on function public.workspace_entry_state() to authenticated;
