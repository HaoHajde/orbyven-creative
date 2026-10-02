-- ORBYVEN Intelligence authenticated action fallback
-- Keeps ai_action_proposals server-only at the table level while exposing a
-- narrow, actor-scoped RPC state machine for deployments that intentionally
-- do not carry SUPABASE_SERVICE_ROLE_KEY.

create or replace function private.ai_actor_can_mutate(
  target_org uuid,
  target_actor uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_org is not null
    and target_actor is not null
    and (
      auth.role() = 'service_role'
      or target_actor = (select auth.uid())
    )
    and exists (
      select 1
      from public.organization_members m
      join public.organizations o on o.id = m.organization_id
      where m.organization_id = target_org
        and m.user_id = target_actor
        and m.access_status = 'active'
        and m.role = any (array['owner'::text, 'admin'::text, 'manager'::text, 'member'::text])
        and o.lifecycle_status = 'active'
    );
$$;

revoke all on function private.ai_actor_can_mutate(uuid, uuid) from public, anon, authenticated;

create or replace function public.ai_action_proposals_insert(
  p_organization_id uuid,
  p_actor_id uuid,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb;
  v_id uuid;
  v_action_type text;
  v_payload jsonb;
  v_summary text;
  v_conversation_id uuid;
  v_expires_at timestamptz;
  v_results jsonb := '[]'::jsonb;
  v_count integer;
begin
  if not private.ai_actor_can_mutate(p_organization_id, p_actor_id) then
    raise exception 'AI_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'AI_ACTION_ROWS_INVALID';
  end if;

  v_count := jsonb_array_length(p_rows);
  if v_count < 1 or v_count > 8 then
    raise exception 'AI_ACTION_ROWS_INVALID';
  end if;

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    if jsonb_typeof(v_row) <> 'object' then
      raise exception 'AI_ACTION_ROW_INVALID';
    end if;

    v_id := case
      when nullif(trim(coalesce(v_row->>'id', '')), '') is null then gen_random_uuid()
      else (v_row->>'id')::uuid
    end;
    v_action_type := trim(coalesce(v_row->>'action_type', ''));
    v_payload := coalesce(v_row->'payload', '{}'::jsonb);
    v_summary := trim(coalesce(v_row->>'summary', ''));
    v_conversation_id := case
      when nullif(trim(coalesce(v_row->>'conversation_id', '')), '') is null then null
      else (v_row->>'conversation_id')::uuid
    end;
    v_expires_at := case
      when nullif(trim(coalesce(v_row->>'expires_at', '')), '') is null then now() + interval '15 minutes'
      else (v_row->>'expires_at')::timestamptz
    end;

    if v_action_type not in (
      'create_lead',
      'create_client',
      'create_task',
      'create_calendar_event',
      'create_estimate',
      'create_document_draft'
    ) then
      raise exception 'AI_ACTION_TYPE_INVALID';
    end if;

    if jsonb_typeof(v_payload) <> 'object' then
      raise exception 'AI_ACTION_PAYLOAD_INVALID';
    end if;

    if char_length(v_summary) < 1 or char_length(v_summary) > 500 then
      raise exception 'AI_ACTION_SUMMARY_INVALID';
    end if;

    if v_expires_at <= now() or v_expires_at > now() + interval '60 minutes' then
      raise exception 'AI_ACTION_EXPIRY_INVALID';
    end if;

    if v_conversation_id is not null and not exists (
      select 1
      from public.ai_conversations c
      where c.id = v_conversation_id
        and c.organization_id = p_organization_id
        and c.actor_id = p_actor_id
        and c.status = 'active'
    ) then
      raise exception 'AI_ACTION_CONVERSATION_INVALID';
    end if;

    insert into public.ai_action_proposals (
      id,
      organization_id,
      actor_id,
      action_type,
      payload,
      summary,
      status,
      expires_at,
      conversation_id
    )
    values (
      v_id,
      p_organization_id,
      p_actor_id,
      v_action_type,
      v_payload,
      v_summary,
      'pending',
      v_expires_at,
      v_conversation_id
    );

    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'id', v_id,
        'expires_at', v_expires_at
      )
    );
  end loop;

  return v_results;
end;
$$;

create or replace function public.ai_action_proposals_list(
  p_organization_id uuid,
  p_actor_id uuid,
  p_conversation_id uuid default null,
  p_limit integer default 128
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer := least(128, greatest(1, coalesce(p_limit, 128)));
  v_result jsonb;
begin
  if not private.ai_actor_can_mutate(p_organization_id, p_actor_id) then
    raise exception 'AI_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc), '[]'::jsonb)
  into v_result
  from (
    select
      p.id,
      p.organization_id,
      p.actor_id,
      p.action_type,
      p.payload,
      p.summary,
      p.status,
      p.expires_at,
      p.executed_at,
      p.result_type,
      p.result_id,
      p.failure_code,
      p.conversation_id,
      p.created_at,
      p.updated_at
    from public.ai_action_proposals p
    where p.organization_id = p_organization_id
      and p.actor_id = p_actor_id
      and (p_conversation_id is null or p.conversation_id = p_conversation_id)
    order by p.created_at desc, p.id desc
    limit v_limit
  ) q;

  return v_result;
end;
$$;

create or replace function public.ai_action_proposal_reject(
  p_organization_id uuid,
  p_actor_id uuid,
  p_proposal_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.ai_action_proposals%rowtype;
  v_status text;
begin
  if not private.ai_actor_can_mutate(p_organization_id, p_actor_id) then
    raise exception 'AI_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  update public.ai_action_proposals
  set status = 'rejected', updated_at = now()
  where id = p_proposal_id
    and organization_id = p_organization_id
    and actor_id = p_actor_id
    and status = 'pending'
  returning * into v_row;

  if found then
    return jsonb_build_object('state', 'rejected', 'proposal', to_jsonb(v_row));
  end if;

  select p.status
  into v_status
  from public.ai_action_proposals p
  where p.id = p_proposal_id
    and p.organization_id = p_organization_id
    and p.actor_id = p_actor_id;

  return jsonb_build_object('state', coalesce(v_status, 'not_found'));
end;
$$;

create or replace function public.ai_action_proposal_claim(
  p_organization_id uuid,
  p_actor_id uuid,
  p_proposal_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.ai_action_proposals%rowtype;
  v_dependency_text text;
  v_dependency_id uuid;
  v_dependency public.ai_action_proposals%rowtype;
  v_plan_id text;
  v_dependency_plan_id text;
  v_step_text text;
  v_dependency_step_text text;
begin
  if not private.ai_actor_can_mutate(p_organization_id, p_actor_id) then
    raise exception 'AI_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  update public.ai_action_proposals
  set status = 'expired', updated_at = now()
  where id = p_proposal_id
    and organization_id = p_organization_id
    and actor_id = p_actor_id
    and status = 'pending'
    and expires_at <= now();

  select p.*
  into v_row
  from public.ai_action_proposals p
  where p.id = p_proposal_id
    and p.organization_id = p_organization_id
    and p.actor_id = p_actor_id
  for update;

  if not found then
    return jsonb_build_object('state', 'not_found');
  end if;

  if v_row.status <> 'pending' then
    return jsonb_build_object('state', v_row.status, 'proposal', to_jsonb(v_row));
  end if;

  if v_row.expires_at <= now() then
    update public.ai_action_proposals
    set status = 'expired', updated_at = now()
    where id = v_row.id;
    v_row.status := 'expired';
    return jsonb_build_object('state', 'expired', 'proposal', to_jsonb(v_row));
  end if;

  v_dependency_text := nullif(trim(coalesce(v_row.payload #>> '{__orbyven_plan,dependsOnProposalId}', '')), '');
  if v_dependency_text is not null then
    if v_dependency_text !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$' then
      return jsonb_build_object('state', 'dependency_invalid');
    end if;

    v_dependency_id := v_dependency_text::uuid;
    select p.*
    into v_dependency
    from public.ai_action_proposals p
    where p.id = v_dependency_id
      and p.organization_id = p_organization_id
      and p.actor_id = p_actor_id;

    if not found or v_dependency.status <> 'executed' then
      return jsonb_build_object('state', 'dependency_required');
    end if;

    v_plan_id := nullif(v_row.payload #>> '{__orbyven_plan,id}', '');
    v_dependency_plan_id := nullif(v_dependency.payload #>> '{__orbyven_plan,id}', '');
    v_step_text := nullif(v_row.payload #>> '{__orbyven_plan,step}', '');
    v_dependency_step_text := nullif(v_dependency.payload #>> '{__orbyven_plan,step}', '');

    if v_plan_id is null
       or v_dependency_plan_id is distinct from v_plan_id
       or v_step_text !~ '^[0-9]+$'
       or v_dependency_step_text !~ '^[0-9]+$'
       or v_dependency_step_text::integer <> v_step_text::integer - 1 then
      return jsonb_build_object('state', 'dependency_invalid');
    end if;
  end if;

  update public.ai_action_proposals
  set status = 'executing', updated_at = now()
  where id = v_row.id
    and status = 'pending'
  returning * into v_row;

  if not found then
    return jsonb_build_object('state', 'not_pending');
  end if;

  return jsonb_build_object('state', 'claimed', 'proposal', to_jsonb(v_row));
end;
$$;

create or replace function public.ai_action_proposal_finish(
  p_organization_id uuid,
  p_actor_id uuid,
  p_proposal_id uuid,
  p_success boolean,
  p_result_type text default null,
  p_result_id uuid default null,
  p_failure_code text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if not private.ai_actor_can_mutate(p_organization_id, p_actor_id) then
    raise exception 'AI_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  if p_success then
    update public.ai_action_proposals
    set
      status = 'executed',
      executed_at = now(),
      result_type = nullif(trim(coalesce(p_result_type, '')), ''),
      result_id = p_result_id,
      failure_code = null,
      updated_at = now()
    where id = p_proposal_id
      and organization_id = p_organization_id
      and actor_id = p_actor_id
      and status = 'executing';
  else
    update public.ai_action_proposals
    set
      status = 'failed',
      failure_code = left(coalesce(nullif(trim(p_failure_code), ''), 'ACTION_EXECUTION_FAILED'), 120),
      updated_at = now()
    where id = p_proposal_id
      and organization_id = p_organization_id
      and actor_id = p_actor_id
      and status = 'executing';
  end if;

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

create or replace function public.ai_action_proposals_supersede(
  p_organization_id uuid,
  p_actor_id uuid,
  p_proposal_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if not private.ai_actor_can_mutate(p_organization_id, p_actor_id) then
    raise exception 'AI_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  if p_proposal_ids is null or coalesce(array_length(p_proposal_ids, 1), 0) > 8 then
    raise exception 'AI_ACTION_IDS_INVALID';
  end if;

  update public.ai_action_proposals
  set
    status = 'rejected',
    failure_code = 'PLAN_SUPERSEDED_BY_RECOVERY',
    updated_at = now()
  where organization_id = p_organization_id
    and actor_id = p_actor_id
    and id = any(p_proposal_ids)
    and status = 'pending';

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

revoke all on function public.ai_action_proposals_insert(uuid, uuid, jsonb) from public, anon;
revoke all on function public.ai_action_proposals_list(uuid, uuid, uuid, integer) from public, anon;
revoke all on function public.ai_action_proposal_reject(uuid, uuid, uuid) from public, anon;
revoke all on function public.ai_action_proposal_claim(uuid, uuid, uuid) from public, anon;
revoke all on function public.ai_action_proposal_finish(uuid, uuid, uuid, boolean, text, uuid, text) from public, anon;
revoke all on function public.ai_action_proposals_supersede(uuid, uuid, uuid[]) from public, anon;

grant execute on function public.ai_action_proposals_insert(uuid, uuid, jsonb) to authenticated, service_role;
grant execute on function public.ai_action_proposals_list(uuid, uuid, uuid, integer) to authenticated, service_role;
grant execute on function public.ai_action_proposal_reject(uuid, uuid, uuid) to authenticated, service_role;
grant execute on function public.ai_action_proposal_claim(uuid, uuid, uuid) to authenticated, service_role;
grant execute on function public.ai_action_proposal_finish(uuid, uuid, uuid, boolean, text, uuid, text) to authenticated, service_role;
grant execute on function public.ai_action_proposals_supersede(uuid, uuid, uuid[]) to authenticated, service_role;


create or replace function public.ai_create_estimate_draft_actor(
  p_organization_id uuid,
  p_actor_id uuid,
  p_title text,
  p_client_id uuid,
  p_task_id uuid,
  p_currency text,
  p_discount_cents bigint,
  p_tax_rate numeric,
  p_valid_until date,
  p_notes text,
  p_planned_labor_cents bigint,
  p_other_cost_cents bigint,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.ai_actor_can_mutate(p_organization_id, p_actor_id) then
    raise exception 'AI_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.organization_modules m
    join public.organization_entitlements e
      on e.organization_id = m.organization_id
     and e.module_id = m.module_id
    where m.organization_id = p_organization_id
      and m.module_id = 'estimates'
      and m.enabled = true
      and e.enabled = true
      and (e.starts_at is null or e.starts_at <= now())
      and (e.ends_at is null or e.ends_at > now())
  ) then
    raise exception 'MODULE_NOT_AVAILABLE' using errcode = '42501';
  end if;

  if p_client_id is not null and not exists (
    select 1
    from public.crm_leads c
    where c.id = p_client_id
      and c.organization_id = p_organization_id
  ) then
    raise exception 'CLIENT_NOT_FOUND';
  end if;

  if p_task_id is not null and not exists (
    select 1
    from public.ops_tasks t
    where t.id = p_task_id
      and t.organization_id = p_organization_id
  ) then
    raise exception 'TASK_NOT_FOUND';
  end if;

  return public.ai_create_estimate_draft(
    p_organization_id,
    p_actor_id,
    p_title,
    p_client_id,
    p_task_id,
    p_currency,
    p_discount_cents,
    p_tax_rate,
    p_valid_until,
    p_notes,
    p_planned_labor_cents,
    p_other_cost_cents,
    p_items
  );
end;
$$;

create or replace function public.ai_action_audit_write(
  p_organization_id uuid,
  p_actor_id uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  if not private.ai_actor_can_mutate(p_organization_id, p_actor_id) then
    raise exception 'AI_ACTION_FORBIDDEN' using errcode = '42501';
  end if;

  if p_action not in ('ai_action.executed', 'ai_plan.recovered') then
    raise exception 'AI_AUDIT_ACTION_INVALID';
  end if;

  if p_target_type is null or char_length(trim(p_target_type)) < 1 or char_length(trim(p_target_type)) > 80 then
    raise exception 'AI_AUDIT_TARGET_INVALID';
  end if;

  if jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'AI_AUDIT_METADATA_INVALID';
  end if;

  select m.role::text
  into v_role
  from public.organization_members m
  where m.organization_id = p_organization_id
    and m.user_id = p_actor_id
    and m.access_status = 'active'
  limit 1;

  insert into public.platform_audit_log (
    actor_user_id,
    actor_role,
    organization_id,
    action,
    target_type,
    target_id,
    metadata
  )
  values (
    p_actor_id,
    v_role,
    p_organization_id,
    p_action,
    trim(p_target_type),
    p_target_id,
    coalesce(p_metadata, '{}'::jsonb)
  );

  return true;
end;
$$;

revoke all on function public.ai_create_estimate_draft_actor(uuid, uuid, text, uuid, uuid, text, bigint, numeric, date, text, bigint, bigint, jsonb) from public, anon;
revoke all on function public.ai_action_audit_write(uuid, uuid, text, text, uuid, jsonb) from public, anon;

grant execute on function public.ai_create_estimate_draft_actor(uuid, uuid, text, uuid, uuid, text, bigint, numeric, date, text, bigint, bigint, jsonb) to authenticated, service_role;
grant execute on function public.ai_action_audit_write(uuid, uuid, text, text, uuid, jsonb) to authenticated, service_role;

-- Preserve the table-level server-only boundary.
revoke select, insert, update, delete on table public.ai_action_proposals from authenticated;
drop policy if exists ai_action_proposals_select_own on public.ai_action_proposals;
drop policy if exists ai_action_proposals_insert_own on public.ai_action_proposals;
drop policy if exists ai_action_proposals_update_own on public.ai_action_proposals;
