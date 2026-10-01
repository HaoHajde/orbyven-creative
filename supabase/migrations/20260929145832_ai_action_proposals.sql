-- ORBYVEN Alpha 0.8.1 — confirmed AI action proposals.
-- Browser clients never access this table directly. Server-side service role owns proposal lifecycle.

create table if not exists public.ai_action_proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action_type text not null check (action_type in ('create_lead','create_client','create_task','create_calendar_event')),
  payload jsonb not null default '{}'::jsonb,
  summary text not null check (char_length(trim(summary)) between 1 and 500),
  status text not null default 'pending'
    check (status in ('pending','executing','executed','rejected','expired','failed')),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  executed_at timestamptz,
  result_type text,
  result_id uuid,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(payload) = 'object')
);

create index if not exists ai_action_proposals_actor_pending_idx
  on public.ai_action_proposals (organization_id, actor_id, status, expires_at);

create index if not exists ai_action_proposals_expires_idx
  on public.ai_action_proposals (expires_at)
  where status = 'pending';

alter table public.ai_action_proposals enable row level security;

revoke all on table public.ai_action_proposals from public, anon, authenticated;
grant select, insert, update on table public.ai_action_proposals to service_role;

comment on table public.ai_action_proposals is
  'Server-only ORBYVEN Intelligence action proposals. A proposal must be explicitly confirmed before execution.';
