-- Legal & Trust release 2026-09-30: manual, auditable client offboarding. No automatic destruction.
-- Depends on 20260925144000 Legal & Trust and 20260927181500 order evidence.
-- Actor UUIDs are intentionally not foreign keys to auth.users: audit evidence must not block Auth account deletion.\ncreate table if not exists public.organization_exit_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  status text not null default 'requested' check (
    status in ('requested','authorized','package_generated','retention_review','closed')
  ),
  action_note text not null default 'Exportul organizației a fost solicitat.'
    check (char_length(action_note) between 8 and 500),
  action_by uuid,
  updated_at timestamptz not null default now(),
  package_sha256 text check (package_sha256 is null or package_sha256 ~ '^[0-9a-f]{64}$'),
  package_generated_at timestamptz,
  package_generated_by uuid,
  closure_reference text check (closure_reference is null or char_length(closure_reference) between 8 and 450),
  closed_at timestamptz,
  constraint generated_package_complete check (
    (package_sha256 is null and package_generated_at is null and package_generated_by is null)
    or (package_sha256 is not null and package_generated_at is not null and package_generated_by is not null)
  ),
  constraint closed_with_documented_review check (
    (status = 'closed' and closure_reference is not null and closed_at is not null)
    or (status <> 'closed' and closure_reference is null and closed_at is null)
  )
);
create unique index if not exists organization_exit_one_active_case_idx
  on public.organization_exit_cases (organization_id)
  where status <> 'closed';
create index if not exists organization_exit_cases_org_idx
  on public.organization_exit_cases (organization_id,requested_at desc);

create table if not exists public.organization_exit_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.organization_exit_cases(id) on delete restrict,
  prior_status text,
  next_status text not null,
  action_note text not null,
  actor_user_id uuid,
  package_sha256 text,
  created_at timestamptz not null default now()
);
create index if not exists organization_exit_events_case_idx
  on public.organization_exit_events (case_id,created_at);

alter table public.organization_exit_cases enable row level security;
alter table public.organization_exit_events enable row level security;
revoke all privileges on public.organization_exit_cases, public.organization_exit_events
  from public,anon,authenticated;
grant select,insert,update on public.organization_exit_cases to service_role;
grant select,insert on public.organization_exit_events to service_role;

create or replace function private.guard_exit_case()
returns trigger language plpgsql security invoker set search_path=''
as $fn$
begin
  if new.id is distinct from old.id
    or new.organization_id is distinct from old.organization_id
    or new.requested_by is distinct from old.requested_by
    or new.requested_at is distinct from old.requested_at then
    raise exception 'The exit request identity is immutable' using errcode='42501';
  end if;
  if old.status <> new.status and not (
    (old.status='requested' and new.status='authorized') or
    (old.status='authorized' and new.status='package_generated') or
    (old.status='package_generated' and new.status='retention_review') or
    (old.status='retention_review' and new.status='closed')
  ) then
    raise exception 'Invalid offboarding transition' using errcode='23514';
  end if;
  if new.package_sha256 is distinct from old.package_sha256 and
     old.package_sha256 is not null then
    raise exception 'Generated archive checksum cannot be rewritten' using errcode='42501';
  end if;
  if old.status = 'closed' then
    raise exception 'Closed exit records are immutable' using errcode='42501';
  end if;
  if new.status in ('requested','authorized')
     and (new.package_sha256 is not null or new.package_generated_at is not null or new.package_generated_by is not null) then
    raise exception 'Archive evidence is not allowed before package generation' using errcode='23514';
  end if;
  if new.status = 'package_generated' and new.package_sha256 is null then
    raise exception 'Archive evidence required before package_generated' using errcode='23514';
  end if;
  if new.status in ('retention_review','closed') and new.package_sha256 is null then
    raise exception 'Archive evidence required before retention review' using errcode='23514';
  end if;
  new.updated_at=now();
  return new;
end;
$fn$;
revoke all on function private.guard_exit_case() from public,anon,authenticated;
drop trigger if exists exit_case_guard on public.organization_exit_cases;
create trigger exit_case_guard before update on public.organization_exit_cases
  for each row execute function private.guard_exit_case();

create or replace function private.audit_exit_case()
returns trigger language plpgsql security invoker set search_path=''
as $fn$
begin
  insert into public.organization_exit_events
    (case_id,prior_status,next_status,action_note,actor_user_id,package_sha256)
  values (
    new.id,
    case when tg_op='INSERT' then null else old.status end,
    new.status,new.action_note,new.action_by,new.package_sha256
  );
  return new;
end;
$fn$;
revoke all on function private.audit_exit_case() from public,anon,authenticated;
drop trigger if exists exit_case_insert_audit on public.organization_exit_cases;
create trigger exit_case_insert_audit after insert on public.organization_exit_cases
  for each row execute function private.audit_exit_case();
drop trigger if exists exit_case_update_audit on public.organization_exit_cases;
create trigger exit_case_update_audit
  after update of status,action_note on public.organization_exit_cases
  for each row execute function private.audit_exit_case();

create or replace function private.immutable_exit_event()
returns trigger language plpgsql security invoker set search_path=''
as $fn$
begin
  raise exception 'Exit evidence is append-only' using errcode='42501';
end;
$fn$;
revoke all on function private.immutable_exit_event() from public,anon,authenticated;
drop trigger if exists exit_event_immutable on public.organization_exit_events;
create trigger exit_event_immutable before update or delete on public.organization_exit_events
  for each row execute function private.immutable_exit_event();

comment on table public.organization_exit_cases is
  'Manual client offboarding: generated archive is NOT verified delivery; retention_review/closed are human attestation, never automatic deletion.';
