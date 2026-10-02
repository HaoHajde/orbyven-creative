-- ORBYVEN Web Design Intelligence — generative core persistence + quotas.
-- Server-only tables. Browser clients access through authenticated Next.js route handlers.

create table if not exists public.ai_web_design_drafts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  draft jsonb not null default '{}'::jsonb check (jsonb_typeof(draft) = 'object'),
  source text not null default 'local' check (source in ('local','ai','preset')),
  last_prompt text null check (last_prompt is null or char_length(last_prompt) <= 2000),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, actor_id)
);

create index if not exists ai_web_design_drafts_actor_idx
  on public.ai_web_design_drafts (actor_id);
create index if not exists ai_web_design_drafts_org_updated_idx
  on public.ai_web_design_drafts (organization_id, updated_at desc);

alter table public.ai_web_design_drafts enable row level security;
revoke all on table public.ai_web_design_drafts from public, anon, authenticated;
grant select, insert, update, delete on table public.ai_web_design_drafts to service_role;

comment on table public.ai_web_design_drafts is
  'Server-managed ORBYVEN Web Design drafts scoped to organization and actor. Browser clients access through authenticated route handlers only.';

create table if not exists public.ai_web_design_daily_usage (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  usage_date date not null,
  requests integer not null default 0 check (requests >= 0),
  primary key (organization_id, usage_date)
);

alter table public.ai_web_design_daily_usage enable row level security;
revoke all on table public.ai_web_design_daily_usage from public, anon, authenticated;
grant select, insert, update, delete on table public.ai_web_design_daily_usage to service_role;

create table if not exists public.ai_web_design_calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (char_length(provider) between 1 and 40),
  model text not null check (char_length(model) between 1 and 120),
  purpose text not null default 'site_generation'
    check (purpose in ('site_generation')),
  status text not null default 'reserved'
    check (status in ('reserved','succeeded','failed')),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  failure_code text null check (failure_code is null or char_length(failure_code) <= 80),
  started_at timestamptz not null default now(),
  finished_at timestamptz null
);

create index if not exists ai_web_design_calls_org_recent_idx
  on public.ai_web_design_calls (organization_id, started_at desc);
create index if not exists ai_web_design_calls_actor_idx
  on public.ai_web_design_calls (actor_id);

alter table public.ai_web_design_calls enable row level security;
revoke all on table public.ai_web_design_calls from public, anon, authenticated;
grant select, insert, update, delete on table public.ai_web_design_calls to service_role;

create or replace function public.ai_web_design_claim(
  p_organization_id uuid,
  p_actor_id uuid,
  p_provider text,
  p_model text,
  p_daily_limit integer default 20,
  p_minute_limit integer default 3
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
  v_daily_limit integer := greatest(1, least(coalesce(p_daily_limit, 20), 200));
  v_minute_limit integer := greatest(1, least(coalesce(p_minute_limit, 3), 20));
begin
  if p_organization_id is null
     or p_actor_id is null
     or nullif(trim(coalesce(p_provider, '')), '') is null
     or nullif(trim(coalesce(p_model, '')), '') is null then
    return jsonb_build_object('allowed', false, 'reason', 'INVALID');
  end if;

  if not exists (
    select 1
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = p_organization_id
      and m.user_id = p_actor_id
      and m.role in ('owner','admin','manager','member')
      and m.access_status = 'active'
      and o.lifecycle_status = 'active'
  ) then
    return jsonb_build_object('allowed', false, 'reason', 'ACCESS_REVOKED');
  end if;

  insert into public.ai_web_design_daily_usage (organization_id, usage_date)
  values (p_organization_id, v_today)
  on conflict (organization_id, usage_date) do nothing;

  select requests into v_daily
  from public.ai_web_design_daily_usage
  where organization_id = p_organization_id
    and usage_date = v_today
  for update;

  if v_daily >= v_daily_limit then
    return jsonb_build_object('allowed', false, 'reason', 'DAILY_LIMIT', 'remainingToday', 0);
  end if;

  select count(*)::integer into v_recent
  from public.ai_web_design_calls
  where organization_id = p_organization_id
    and started_at >= now() - interval '60 seconds';

  if v_recent >= v_minute_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'MINUTE_LIMIT',
      'remainingToday', greatest(0, v_daily_limit - v_daily)
    );
  end if;

  update public.ai_web_design_daily_usage
  set requests = requests + 1
  where organization_id = p_organization_id
    and usage_date = v_today;

  insert into public.ai_web_design_calls (
    organization_id, actor_id, provider, model
  ) values (
    p_organization_id,
    p_actor_id,
    left(trim(p_provider), 40),
    left(trim(p_model), 120)
  )
  returning id into v_id;

  return jsonb_build_object(
    'allowed', true,
    'requestId', v_id,
    'remainingToday', greatest(0, v_daily_limit - v_daily - 1)
  );
end;
$function$;

create or replace function public.ai_web_design_finish(
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
  update public.ai_web_design_calls
  set status = case when p_success then 'succeeded' else 'failed' end,
      input_tokens = greatest(0, least(coalesce(p_input_tokens, 0), 200000)),
      output_tokens = greatest(0, least(coalesce(p_output_tokens, 0), 100000)),
      failure_code = case
        when p_success then null
        else left(nullif(trim(coalesce(p_failure_code, 'UNKNOWN')), ''), 80)
      end,
      finished_at = now()
  where id = p_request_id
    and status = 'reserved';
end;
$function$;

revoke all on function public.ai_web_design_claim(uuid,uuid,text,text,integer,integer)
  from public, anon, authenticated;
grant execute on function public.ai_web_design_claim(uuid,uuid,text,text,integer,integer)
  to service_role;

revoke all on function public.ai_web_design_finish(uuid,boolean,integer,integer,text)
  from public, anon, authenticated;
grant execute on function public.ai_web_design_finish(uuid,boolean,integer,integer,text)
  to service_role;
