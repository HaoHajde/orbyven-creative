create table if not exists public.video_ai_jobs (
  id text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  provider text,
  status text not null default 'provider_required',
  storyboard jsonb not null,
  reference_url text,
  source_urls jsonb not null default '[]'::jsonb,
  provider_job_id text,
  output_url text,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_ai_jobs_id_check check (char_length(id) between 12 and 80),
  constraint video_ai_jobs_provider_check check (provider is null or provider in ('webhook', 'wan', 'ltx')),
  constraint video_ai_jobs_status_check check (status in ('provider_required', 'queued', 'rendering', 'complete', 'failed')),
  constraint video_ai_jobs_storyboard_check check (jsonb_typeof(storyboard) = 'object'),
  constraint video_ai_jobs_reference_url_check check (reference_url is null or char_length(reference_url) <= 2048),
  constraint video_ai_jobs_source_urls_check check (jsonb_typeof(source_urls) = 'array'),
  constraint video_ai_jobs_provider_job_id_check check (provider_job_id is null or char_length(provider_job_id) <= 240),
  constraint video_ai_jobs_output_url_check check (output_url is null or char_length(output_url) <= 2048),
  constraint video_ai_jobs_failure_code_check check (failure_code is null or char_length(failure_code) <= 120)
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
grant select, insert, update, delete, truncate, references, trigger on table public.video_ai_jobs to service_role;
