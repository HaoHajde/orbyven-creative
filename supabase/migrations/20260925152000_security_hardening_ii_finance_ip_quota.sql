-- ORBYVEN Security Hardening II (STAGED; do not apply to production before coordinated release).
-- Finance visibility matches the existing Expenses UI: owner/admin/manager only.
-- Restrictive policies compose with tenant membership + paid-entitlement RLS.
create or replace function private.can_access_org_finances(target_org uuid)
returns boolean language sql stable security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = target_org
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and o.lifecycle_status = 'active'
      and m.role in ('owner','admin','manager')
  );
$function$;
revoke all on function private.can_access_org_finances(uuid) from public, anon;
grant execute on function private.can_access_org_finances(uuid) to authenticated;

drop policy if exists finance_confidential_access on public.finance_expenses;
create policy finance_confidential_access
on public.finance_expenses as restrictive for all to authenticated
using (private.can_access_org_finances(organization_id))
with check (private.can_access_org_finances(organization_id));

drop policy if exists finance_confidential_access on public.finance_budget_entries;
create policy finance_confidential_access
on public.finance_budget_entries as restrictive for all to authenticated
using (private.can_access_org_finances(organization_id))
with check (private.can_access_org_finances(organization_id));

-- Distributed, atomic IP-based quota for the Next.js public project-request gateway.
-- The route sends a SHA-256 pseudonym, never a raw IP. Public RPC callers remain
-- separately rate-limited by the existing per-email database trigger.
create table if not exists public.project_request_ip_quota (
  ip_fingerprint text not null check (ip_fingerprint ~ '^[0-9a-f]{64}$'),
  bucket_started_at timestamptz not null,
  hits integer not null check (hits between 1 and 12),
  primary key (ip_fingerprint, bucket_started_at)
);
create index if not exists project_request_ip_quota_expiration_idx
  on public.project_request_ip_quota(bucket_started_at);
alter table public.project_request_ip_quota enable row level security;
revoke all on public.project_request_ip_quota from anon, authenticated;
grant select, insert, update, delete on public.project_request_ip_quota to service_role;

create or replace function public.claim_project_request_ip_quota(
  p_fingerprint text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_hits integer;
  v_bucket timestamptz := pg_catalog.date_trunc('hour', pg_catalog.now());
begin
  if p_fingerprint is null or p_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid request identity' using errcode = '22023';
  end if;

  -- Data-minimization: remove old pseudonyms during normal traffic.
  delete from public.project_request_ip_quota
  where bucket_started_at < pg_catalog.now() - interval '48 hours';

  insert into public.project_request_ip_quota(ip_fingerprint,bucket_started_at,hits)
  values (p_fingerprint,v_bucket,1)
  on conflict (ip_fingerprint,bucket_started_at)
  do update set hits = public.project_request_ip_quota.hits + 1
  where public.project_request_ip_quota.hits < 12
  returning hits into v_hits;

  return v_hits is not null;
end;
$function$;
revoke all on function public.claim_project_request_ip_quota(text)
from public, anon, authenticated;
grant execute on function public.claim_project_request_ip_quota(text)
to service_role;

comment on function public.claim_project_request_ip_quota(text)
is 'Service-role-only rate limiter for /api/project-requests; 12 attempts/IP/hour, 48h retention; direct anon RPC still guarded separately per email.';
