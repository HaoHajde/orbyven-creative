-- ORBYVEN Alpha 0.8.6 — Selective Language Layer telemetry + quota.
-- Server-only. Language generation never owns business facts or mutations.

create table if not exists public.ai_language_daily_usage (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  usage_date date not null,
  requests integer not null default 0 check (requests >= 0),
  primary key (organization_id, usage_date)
);

alter table public.ai_language_daily_usage enable row level security;
revoke all on table public.ai_language_daily_usage from public, anon, authenticated;
grant select, insert, update, delete on table public.ai_language_daily_usage to service_role;

create table if not exists public.ai_language_calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid null references public.ai_conversations(id) on delete set null,
  provider text not null check (char_length(provider) between 1 and 40),
  model text not null check (char_length(model) between 1 and 120),
  purpose text not null default 'answer_polish'
    check (purpose in ('answer_polish')),
  status text not null default 'reserved'
    check (status in ('reserved','succeeded','failed')),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  failure_code text null check (failure_code is null or char_length(failure_code) <= 80),
  started_at timestamptz not null default now(),
  finished_at timestamptz null
);

create index if not exists ai_language_calls_org_recent_idx
  on public.ai_language_calls (organization_id, started_at desc);
create index if not exists ai_language_calls_actor_id_idx
  on public.ai_language_calls (actor_id);
create index if not exists ai_language_calls_conversation_idx
  on public.ai_language_calls (conversation_id)
  where conversation_id is not null;

alter table public.ai_language_calls enable row level security;
revoke all on table public.ai_language_calls from public, anon, authenticated;
grant select, insert, update, delete on table public.ai_language_calls to service_role;

create or replace function public.ai_language_claim(
  p_organization_id uuid,
  p_actor_id uuid,
  p_conversation_id uuid,
  p_provider text,
  p_model text,
  p_daily_limit integer default 30,
  p_minute_limit integer default 4
)
returns jsonb
language plpgsql
set search_path = ''
as $function$
declare
  v_today date := (now() at time zone 'UTC')::date;
  v_daily integer;
  v_recent integer;
  v_id uuid;
  v_daily_limit integer := greatest(1, least(coalesce(p_daily_limit, 30), 200));
  v_minute_limit integer := greatest(1, least(coalesce(p_minute_limit, 4), 20));
begin
  if p_organization_id is null
     or p_actor_id is null
     or nullif(trim(coalesce(p_provider, '')), '') is null
     or nullif(trim(coalesce(p_model, '')), '') is null then
    return jsonb_build_object('allowed', false, 'reason', 'INVALID');
  end if;

  if p_conversation_id is not null and not exists (
    select 1 from public.ai_conversations c
    where c.id = p_conversation_id
      and c.organization_id = p_organization_id
      and c.actor_id = p_actor_id
      and c.status = 'active'
  ) then
    return jsonb_build_object('allowed', false, 'reason', 'CONVERSATION_INVALID');
  end if;

  if not exists (
    select 1
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = p_organization_id
      and m.user_id = p_actor_id
      and m.role in ('owner','admin','manager','member','viewer')
      and m.access_status = 'active'
      and o.lifecycle_status = 'active'
  ) then
    return jsonb_build_object('allowed', false, 'reason', 'ACCESS_REVOKED');
  end if;

  insert into public.ai_language_daily_usage (organization_id, usage_date)
  values (p_organization_id, v_today)
  on conflict (organization_id, usage_date) do nothing;

  select requests into v_daily
  from public.ai_language_daily_usage
  where organization_id = p_organization_id and usage_date = v_today
  for update;

  if v_daily >= v_daily_limit then
    return jsonb_build_object('allowed', false, 'reason', 'DAILY_LIMIT', 'remainingToday', 0);
  end if;

  select count(*)::integer into v_recent
  from public.ai_language_calls
  where organization_id = p_organization_id
    and started_at >= now() - interval '60 seconds';

  if v_recent >= v_minute_limit then
    return jsonb_build_object(
      'allowed', false, 'reason', 'MINUTE_LIMIT',
      'remainingToday', greatest(0, v_daily_limit - v_daily)
    );
  end if;

  update public.ai_language_daily_usage
  set requests = requests + 1
  where organization_id = p_organization_id and usage_date = v_today;

  insert into public.ai_language_calls (
    organization_id, actor_id, conversation_id, provider, model
  ) values (
    p_organization_id, p_actor_id, p_conversation_id,
    left(trim(p_provider), 40), left(trim(p_model), 120)
  )
  returning id into v_id;

  return jsonb_build_object(
    'allowed', true,
    'requestId', v_id,
    'remainingToday', greatest(0, v_daily_limit - v_daily - 1)
  );
end;
$function$;

create or replace function public.ai_language_finish(
  p_request_id uuid,
  p_success boolean,
  p_input_tokens integer,
  p_output_tokens integer,
  p_failure_code text default null
)
returns void
language plpgsql
set search_path = ''
as $function$
begin
  update public.ai_language_calls
  set status = case when p_success then 'succeeded' else 'failed' end,
      input_tokens = greatest(0, least(coalesce(p_input_tokens, 0), 100000)),
      output_tokens = greatest(0, least(coalesce(p_output_tokens, 0), 50000)),
      failure_code = case
        when p_success then null
        else left(nullif(trim(coalesce(p_failure_code, 'UNKNOWN')), ''), 80)
      end,
      finished_at = now()
  where id = p_request_id and status = 'reserved';
end;
$function$;

revoke all on function public.ai_language_claim(uuid,uuid,uuid,text,text,integer,integer)
  from public, anon, authenticated;
grant execute on function public.ai_language_claim(uuid,uuid,uuid,text,text,integer,integer)
  to service_role;

revoke all on function public.ai_language_finish(uuid,boolean,integer,integer,text)
  from public, anon, authenticated;
grant execute on function public.ai_language_finish(uuid,boolean,integer,integer,text)
  to service_role;
