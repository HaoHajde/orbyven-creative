-- ORBYVEN Control Center integrity audit foundation.
-- All three tables are server-only. Browser clients never receive direct table access;
-- the Control Center API mediates access after platform-owner + AAL2 verification.

create table if not exists public.platform_integrity_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique,
  source text not null check (source in ('scheduled', 'manual', 'ci')),
  status text not null check (status in ('queued', 'running', 'passed', 'warning', 'failed', 'error')),
  branch text,
  commit_sha text,
  started_at timestamptz not null,
  finished_at timestamptz,
  overall_score smallint check (overall_score between 0 and 100),
  category_scores jsonb not null default '{}'::jsonb,
  summary text,
  report_markdown text,
  report_sha256 text,
  metadata jsonb not null default '{}'::jsonb,
  requested_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_integrity_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.platform_integrity_runs(id) on delete cascade,
  fingerprint text not null,
  category text not null check (category in ('code', 'security', 'seo', 'legal')),
  severity text not null check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  title text not null,
  summary text not null,
  evidence text,
  manual_action text,
  ai_action text,
  can_ai_execute boolean not null default false,
  requires_human boolean not null default false,
  status text not null default 'open' check (status in ('open', 'queued', 'in_progress', 'resolved', 'accepted_risk')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, fingerprint)
);

create table if not exists public.platform_integrity_actions (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references public.platform_integrity_findings(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  executor text not null check (executor in ('human', 'orbyven_guardian')),
  mode text not null check (mode in ('manual', 'prepare_pr', 'safe_auto')),
  status text not null check (status in ('queued', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled')),
  branch_name text,
  pr_url text,
  result_summary text,
  execution_log text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_integrity_runs_created_at_idx
  on public.platform_integrity_runs (created_at desc);

create index if not exists platform_integrity_findings_run_id_idx
  on public.platform_integrity_findings (run_id, created_at desc);

create index if not exists platform_integrity_findings_open_idx
  on public.platform_integrity_findings (status, severity, created_at desc);

create index if not exists platform_integrity_actions_finding_id_idx
  on public.platform_integrity_actions (finding_id, created_at desc);

create unique index if not exists platform_integrity_guardian_active_unique_idx
  on public.platform_integrity_actions (finding_id)
  where executor = 'orbyven_guardian'
    and status in ('queued', 'running', 'waiting_approval');

alter table public.platform_integrity_runs enable row level security;
alter table public.platform_integrity_findings enable row level security;
alter table public.platform_integrity_actions enable row level security;

-- No anon/authenticated policies by design. Even an authenticated ORBYVEN customer must
-- not be able to enumerate platform-security findings or detailed audit evidence.
revoke all on table public.platform_integrity_runs from public, anon, authenticated;
revoke all on table public.platform_integrity_findings from public, anon, authenticated;
revoke all on table public.platform_integrity_actions from public, anon, authenticated;

grant all on table public.platform_integrity_runs to service_role;
grant all on table public.platform_integrity_findings to service_role;
grant all on table public.platform_integrity_actions to service_role;

comment on table public.platform_integrity_runs is
  'Server-only ORBYVEN platform integrity audit runs. Access is mediated by Control Center APIs.';
comment on table public.platform_integrity_findings is
  'Server-only normalized integrity findings for code, security, SEO, and legal/compliance.';
comment on table public.platform_integrity_actions is
  'Server-only execution queue/audit trail for manual work and ORBYVEN Guardian PR preparation.';
