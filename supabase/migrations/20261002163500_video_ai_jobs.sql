create table if not exists public.video_ai_jobs (
  id text primary key
    check (char_length(id) >= 12 and char_length(id) <= 80),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  actor_id uuid
    references auth.users(id) on delete set null,
  provider text
    check (provider is null or provider in ('webhook', 'wan', 'ltx')),
  status text not null default 'provider_required'
    check (status in ('provider_required', 'queued', 'rendering', 'complete', 'failed')),
  storyboard jsonb not null
    check (jsonb_typeof(storyboard) = 'object'),
  reference_url text
    check (reference_url is null or char_length(reference_url) <= 2048),
  source_urls jsonb not null default '[]'::jsonb
    check (jsonb_typeof(source_urls) = 'array'),
  provider_job_id text
    check (provider_job_id is null or char_length(provider_job_id) <= 240),
  output_url text
    check (output_url is null or char_length(output_url) <= 2048),
  failure_code text
    check (failure_code is null or char_length(failure_code) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists video_ai_jobs_org_recent_idx
  on public.video_ai_jobs (organization_id, created_at desc);

create index if not exists video_ai_jobs_actor_recent_idx
  on public.video_ai_jobs (actor_id, created_at desc)
  where actor_id is not null;

create index if not exists video_ai_jobs_provider_status_idx
  on public.video_ai_jobs (provider, status, created_at desc)
  where provider is not null and status in ('queued', 'rendering');

alter table public.video_ai_jobs enable row level security;

revoke all on table public.video_ai_jobs from anon, authenticated;
grant all on table public.video_ai_jobs to service_role;
grant all on table public.video_ai_jobs to postgres;

comment on table public.video_ai_jobs is
  'Server-managed ORBYVEN Video AI render lifecycle. Browser roles have no direct access.';
