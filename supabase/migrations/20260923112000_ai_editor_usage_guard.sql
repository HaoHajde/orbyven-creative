-- ORBYVEN AI editor Alpha: server-only, per-organization usage guard.
-- Use UTC calendar days. No prompts, keys, or generated content are stored.
-- Review and apply to the intended Supabase environment BEFORE enabling Preview AI.

create table if not exists public.ai_editor_daily_usage (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  usage_date date not null,
  requests integer not null default 0 check (requests >= 0),
  primary key (organization_id, usage_date)
);

create table if not exists public.ai_editor_calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  status text not null default 'reserved'
    check (status in ('reserved', 'succeeded', 'failed')),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0)
);

create index if not exists ai_editor_calls_org_started_idx
  on public.ai_editor_calls (organization_id, started_at desc);

alter table public.ai_editor_daily_usage enable row level security;
alter table public.ai_editor_calls enable row level security;

-- Deliberately no anon/authenticated policies, including SELECT.
revoke all on table public.ai_editor_daily_usage from public, anon, authenticated;
revoke all on table public.ai_editor_calls from public, anon, authenticated;
grant select, insert, update on public.ai_editor_daily_usage to service_role;
grant select, insert, update on public.ai_editor_calls to service_role;

-- Service-role only; no SECURITY DEFINER and no public grant.
create or replace function public.ai_editor_claim(
  p_organization_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'UTC')::date;
  v_daily integer;
  v_recent integer;
  v_id uuid;
begin
  if p_organization_id is null or p_actor_id is null then
    return jsonb_build_object('allowed', false, 'reason', 'INVALID');
  end if;

  -- Revalidate access inside the same transaction as quota consumption.
  if not exists (
    select 1
      from public.organization_members m
      join public.organizations o on o.id = m.organization_id
     where m.organization_id = p_organization_id
       and m.user_id = p_actor_id
       and m.role in ('owner', 'admin')
       and m.access_status = 'active'
       and o.lifecycle_status = 'active'
  ) then
    return jsonb_build_object('allowed', false, 'reason', 'ACCESS_REVOKED');
  end if;

  insert into public.ai_editor_daily_usage (organization_id, usage_date)
  values (p_organization_id, v_today)
  on conflict (organization_id, usage_date) do nothing;

  -- Per-organization row lock serializes concurrent claims across serverless instances.
  select requests into v_daily
    from public.ai_editor_daily_usage
   where organization_id = p_organization_id and usage_date = v_today
   for update;

  if v_daily >= 8 then
    return jsonb_build_object('allowed', false, 'reason', 'DAILY_LIMIT', 'remainingToday', 0);
  end if;

  select count(*)::integer into v_recent
    from public.ai_editor_calls
   where organization_id = p_organization_id
     and started_at >= now() - interval '60 seconds';

  if v_recent >= 2 then
    return jsonb_build_object('allowed', false, 'reason', 'MINUTE_LIMIT', 'remainingToday', 8 - v_daily);
  end if;

  update public.ai_editor_daily_usage
     set requests = requests + 1
   where organization_id = p_organization_id and usage_date = v_today;

  insert into public.ai_editor_calls (organization_id, actor_id)
  values (p_organization_id, p_actor_id)
  returning id into v_id;

  return jsonb_build_object(
    'allowed', true,
    'requestId', v_id,
    'remainingToday', 8 - v_daily - 1
  );
end;
$$;

revoke all on function public.ai_editor_claim(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.ai_editor_claim(uuid, uuid) to service_role;

-- Claim remains consumed even if the AI provider times out or fails:
-- this prevents unlimited retries from causing unlimited external spend.
create or replace function public.ai_editor_finish(
  p_request_id uuid,
  p_success boolean,
  p_input_tokens integer,
  p_output_tokens integer
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.ai_editor_calls
     set status = case when p_success then 'succeeded' else 'failed' end,
         input_tokens = greatest(0, least(coalesce(p_input_tokens, 0), 50000)),
         output_tokens = greatest(0, least(coalesce(p_output_tokens, 0), 50000))
   where id = p_request_id and status = 'reserved';
end;
$$;

revoke all on function public.ai_editor_finish(uuid, boolean, integer, integer)
  from public, anon, authenticated;
grant execute on function public.ai_editor_finish(uuid, boolean, integer, integer)
  to service_role;

comment on table public.ai_editor_daily_usage is
  'Server-only AI editor daily org request caps; reset at UTC midnight.';
comment on table public.ai_editor_calls is
  'Server-only AI editor reservation and token counts; does not retain prompts.';
