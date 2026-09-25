-- ORBYVEN Legal & Trust foundation.
-- Internal-only evidence registry and privacy request operations. No customer data export,
-- automatic deletion, automatic legal approval or paid checkout is enabled.
-- Deployment order: apply this migration to a verified staging DB before previewing UI.
create table if not exists public.legal_contract_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  document_type text not null check (document_type in ('contract','order_form','dpa','amendment','other')),
  title text not null check (char_length(title) between 4 and 160),
  document_version text not null check (char_length(document_version) between 1 and 80),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  evidence_reference text not null check (char_length(evidence_reference) between 4 and 450),
  -- Staff may register a reference, but this is NOT proof of signature or legal validity.
  evidence_status text not null default 'staff_recorded' check (evidence_status = 'staff_recorded'),
  merchant_key text,
  merchant_legal_name text,
  merchant_tax_id text,
  recorded_by uuid references auth.users(id) on delete set null,
  recorded_at timestamptz not null default now(),
  unique (organization_id,document_type,sha256)
);
create index if not exists legal_contract_records_org_created_idx
  on public.legal_contract_records (organization_id,recorded_at desc);

create table if not exists public.privacy_request_cases (
  id uuid primary key default gen_random_uuid(),
  -- NULL means an ORBYVEN-controller request not linked to a client tenant.
  organization_id uuid references public.organizations(id) on delete restrict,
  subject_reference text not null check (char_length(subject_reference) between 4 and 120),
  request_type text not null check
    (request_type in ('access','rectification','erasure','portability','restriction','objection','other')),
  processing_role text not null check (processing_role in ('undetermined','controller','processor')),
  channel text not null check (channel in ('email','form','other')),
  status text not null default 'received' check
    (status in ('received','identity_check','triage','in_progress','responded','closed')),
  received_at timestamptz not null default now(),
  -- Baseline only; human assessment/extension notification remain mandatory.
  due_at timestamptz not null default (now() + interval '1 month'),
  last_action text check (last_action is null or char_length(last_action) <= 500),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create index if not exists privacy_request_cases_org_received_idx
  on public.privacy_request_cases (organization_id,received_at desc);
create index if not exists privacy_request_cases_status_due_idx
  on public.privacy_request_cases (status,due_at);

create table if not exists public.privacy_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.privacy_request_cases(id) on delete restrict,
  prior_status text,
  next_status text not null,
  action_note text,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists privacy_request_events_case_created_idx
  on public.privacy_request_events (request_id,created_at asc);

alter table public.legal_contract_records enable row level security;
alter table public.privacy_request_cases enable row level security;
alter table public.privacy_request_events enable row level security;
-- No browser-facing policies. All access goes through verified platform staff API.
revoke all privileges on public.legal_contract_records,
  public.privacy_request_cases, public.privacy_request_events
  from public, anon, authenticated;
grant select,insert on public.legal_contract_records to service_role;
grant select,insert,update on public.privacy_request_cases to service_role;
grant select,insert on public.privacy_request_events to service_role;

create or replace function private.prevent_legal_evidence_mutation()
returns trigger language plpgsql security invoker set search_path = ''
as $fn$
begin
  raise exception 'Immutable compliance evidence may not be changed or deleted'
    using errcode = '42501';
end;
$fn$;
revoke all on function private.prevent_legal_evidence_mutation()
  from public, anon, authenticated;
drop trigger if exists legal_contract_records_immutable on public.legal_contract_records;
create trigger legal_contract_records_immutable
  before update or delete on public.legal_contract_records
  for each row execute function private.prevent_legal_evidence_mutation();
drop trigger if exists privacy_request_events_immutable on public.privacy_request_events;
create trigger privacy_request_events_immutable
  before update or delete on public.privacy_request_events
  for each row execute function private.prevent_legal_evidence_mutation();

create or replace function private.guard_privacy_request_case()
returns trigger language plpgsql security invoker set search_path = ''
as $fn$
begin
  if new.organization_id is distinct from old.organization_id
    or new.subject_reference is distinct from old.subject_reference
    or new.request_type is distinct from old.request_type
    or new.processing_role is distinct from old.processing_role
    or new.channel is distinct from old.channel
    or new.received_at is distinct from old.received_at
    or new.due_at is distinct from old.due_at then
    raise exception 'Identity, scope and baseline deadline of privacy case are immutable'
      using errcode = '42501';
  end if;
  if old.status <> new.status and not (
      (old.status = 'received' and new.status in ('identity_check','triage'))
      or (old.status = 'identity_check' and new.status = 'triage')
      or (old.status = 'triage' and new.status = 'in_progress')
      or (old.status = 'in_progress' and new.status = 'responded')
      or (old.status = 'responded' and new.status = 'closed')
    ) then
    raise exception 'Invalid privacy case transition'
      using errcode = '23514';
  end if;
  if new.status in ('responded','closed')
    and (new.last_action is null or char_length(btrim(new.last_action)) < 8) then
    raise exception 'Response/closure requires a recorded action'
      using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$fn$;
revoke all on function private.guard_privacy_request_case()
  from public, anon, authenticated;
drop trigger if exists privacy_case_guard on public.privacy_request_cases;
create trigger privacy_case_guard before update on public.privacy_request_cases
  for each row execute function private.guard_privacy_request_case();

create or replace function private.audit_privacy_request_case()
returns trigger language plpgsql security invoker set search_path = ''
as $fn$
begin
  insert into public.privacy_request_events
    (request_id,prior_status,next_status,action_note,actor_user_id)
  values (
    new.id,
    case when tg_op = 'INSERT' then null else old.status end,
    new.status,new.last_action,new.updated_by
  );
  return new;
end;
$fn$;
revoke all on function private.audit_privacy_request_case()
  from public, anon, authenticated;
drop trigger if exists privacy_case_audit_insert on public.privacy_request_cases;
create trigger privacy_case_audit_insert
  after insert on public.privacy_request_cases
  for each row execute function private.audit_privacy_request_case();
drop trigger if exists privacy_case_audit_update on public.privacy_request_cases;
create trigger privacy_case_audit_update
  after update of status,last_action on public.privacy_request_cases
  for each row execute function private.audit_privacy_request_case();

comment on table public.legal_contract_records is
  'Internal references to manually recorded documents; billing_terms_acceptances remains canonical for actual checkout acceptance.';
comment on table public.privacy_request_cases is
  'Internal GDPR operations register; never automatically exports/deletes tenant data or promises case completion.';
