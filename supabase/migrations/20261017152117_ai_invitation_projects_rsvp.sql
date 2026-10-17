-- ORBYVEN AI Invitations · published project + RSVP foundation.
-- Public traffic never receives direct Data API grants. Next.js server routes validate
-- input, enforce tenant/public boundaries and use the service role for persistence.

create table if not exists public.invitation_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  source_key text not null check (char_length(source_key) between 3 and 80),
  project_type text not null check (project_type in ('wedding','baptism','event')),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{5,79}$'),
  status text not null default 'published' check (status in ('published','archived')),
  title text not null check (char_length(title) between 1 and 180),
  draft jsonb not null check (jsonb_typeof(draft) = 'object'),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, source_key)
);

create index if not exists invitation_projects_org_type_idx
  on public.invitation_projects(organization_id, project_type, updated_at desc);
create index if not exists invitation_projects_public_slug_idx
  on public.invitation_projects(slug)
  where status = 'published';

alter table public.invitation_projects enable row level security;
revoke all on public.invitation_projects from public, anon, authenticated;
grant select, insert, update, delete on public.invitation_projects to service_role;

drop trigger if exists invitation_projects_set_updated_at on public.invitation_projects;
create trigger invitation_projects_set_updated_at
before update on public.invitation_projects
for each row execute function public.set_updated_at();

create table if not exists public.invitation_rsvps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.invitation_projects(id) on delete cascade,
  guest_name text not null check (char_length(guest_name) between 2 and 120),
  attending boolean not null,
  guest_count smallint not null check (guest_count between 0 and 12),
  message text check (message is null or char_length(message) <= 700),
  created_at timestamptz not null default now()
);

create index if not exists invitation_rsvps_project_created_idx
  on public.invitation_rsvps(project_id, created_at desc);

alter table public.invitation_rsvps enable row level security;
revoke all on public.invitation_rsvps from public, anon, authenticated;
grant select, insert, delete on public.invitation_rsvps to service_role;

-- Distributed pseudonymous rate limit for the public RSVP gateway.
create table if not exists public.invitation_rsvp_ip_quota (
  ip_fingerprint text not null check (ip_fingerprint ~ '^[0-9a-f]{64}$'),
  bucket_started_at timestamptz not null,
  hits integer not null check (hits between 1 and 10),
  primary key (ip_fingerprint, bucket_started_at)
);
create index if not exists invitation_rsvp_ip_quota_expiration_idx
  on public.invitation_rsvp_ip_quota(bucket_started_at);

alter table public.invitation_rsvp_ip_quota enable row level security;
revoke all on public.invitation_rsvp_ip_quota from public, anon, authenticated;
grant select, insert, update, delete on public.invitation_rsvp_ip_quota to service_role;

create or replace function public.claim_invitation_rsvp_ip_quota(p_fingerprint text)
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

  delete from public.invitation_rsvp_ip_quota
  where bucket_started_at < pg_catalog.now() - interval '48 hours';

  insert into public.invitation_rsvp_ip_quota(ip_fingerprint,bucket_started_at,hits)
  values (p_fingerprint,v_bucket,1)
  on conflict (ip_fingerprint,bucket_started_at)
  do update set hits = public.invitation_rsvp_ip_quota.hits + 1
  where public.invitation_rsvp_ip_quota.hits < 10
  returning hits into v_hits;

  return v_hits is not null;
end;
$function$;

revoke all on function public.claim_invitation_rsvp_ip_quota(text)
from public, anon, authenticated;
grant execute on function public.claim_invitation_rsvp_ip_quota(text)
to service_role;

comment on table public.invitation_projects is
  'Tenant-owned published invitation snapshots generated from the bounded AI design draft.';
comment on table public.invitation_rsvps is
  'Minimal RSVP data submitted through the server-only public invitation gateway.';
comment on function public.claim_invitation_rsvp_ip_quota(text) is
  'Service-role-only 10 attempts/IP/hour RSVP limiter; only HMAC pseudonyms are stored for 48h.';
