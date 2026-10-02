-- Move Web Design privileged quota operations out of the exposed public schema.
-- Public RPCs stay SECURITY INVOKER and delegate to private SECURITY DEFINER helpers.

create or replace function private.ai_web_design_claim_impl(
  p_organization_id uuid,
  p_actor_id uuid,
  p_provider text,
  p_model text,
  p_daily_limit integer default 20,
  p_minute_limit integer default 3
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_today date := (now() at time zone 'UTC')::date;
  v_daily integer;
  v_recent integer;
  v_id uuid;
  v_daily_limit integer := greatest(1, least(coalesce(p_daily_limit, 20), 200));
  v_minute_limit integer := greatest(1, least(coalesce(p_minute_limit, 3), 20));
  v_auth_user uuid := (select auth.uid());
begin
  if p_organization_id is null
     or p_actor_id is null
     or nullif(trim(coalesce(p_provider, '')), '') is null
     or nullif(trim(coalesce(p_model, '')), '') is null then
    return jsonb_build_object('allowed', false, 'reason', 'INVALID');
  end if;

  if v_auth_user is not null and p_actor_id <> v_auth_user then
    return jsonb_build_object('allowed', false, 'reason', 'ACTOR_MISMATCH');
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

create or replace function private.ai_web_design_finish_impl(
  p_request_id uuid,
  p_success boolean,
  p_input_tokens integer,
  p_output_tokens integer,
  p_failure_code text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_auth_user uuid := (select auth.uid());
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
    and status = 'reserved'
    and (
      v_auth_user is null
      or actor_id = v_auth_user
    );
end;
$function$;

revoke all on function private.ai_web_design_claim_impl(uuid,uuid,text,text,integer,integer)
  from public, anon;
grant execute on function private.ai_web_design_claim_impl(uuid,uuid,text,text,integer,integer)
  to authenticated, service_role;

revoke all on function private.ai_web_design_finish_impl(uuid,boolean,integer,integer,text)
  from public, anon;
grant execute on function private.ai_web_design_finish_impl(uuid,boolean,integer,integer,text)
  to authenticated, service_role;

create or replace function public.ai_web_design_claim(
  p_organization_id uuid,
  p_actor_id uuid,
  p_provider text,
  p_model text,
  p_daily_limit integer default 20,
  p_minute_limit integer default 3
)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select private.ai_web_design_claim_impl(
    p_organization_id,
    p_actor_id,
    p_provider,
    p_model,
    p_daily_limit,
    p_minute_limit
  );
$function$;

create or replace function public.ai_web_design_finish(
  p_request_id uuid,
  p_success boolean,
  p_input_tokens integer,
  p_output_tokens integer,
  p_failure_code text default null
)
returns void
language sql
security invoker
set search_path = ''
as $function$
  select private.ai_web_design_finish_impl(
    p_request_id,
    p_success,
    p_input_tokens,
    p_output_tokens,
    p_failure_code
  );
$function$;

revoke all on function public.ai_web_design_claim(uuid,uuid,text,text,integer,integer)
  from public, anon;
grant execute on function public.ai_web_design_claim(uuid,uuid,text,text,integer,integer)
  to authenticated, service_role;

revoke all on function public.ai_web_design_finish(uuid,boolean,integer,integer,text)
  from public, anon;
grant execute on function public.ai_web_design_finish(uuid,boolean,integer,integer,text)
  to authenticated, service_role;
