alter table public.ai_action_proposals
  drop constraint if exists ai_action_proposals_action_type_check;

alter table public.ai_action_proposals
  add constraint ai_action_proposals_action_type_check
  check (action_type in (
    'create_lead',
    'create_client',
    'create_task',
    'create_calendar_event',
    'create_estimate'
  ));

create or replace function public.ai_create_estimate_draft(
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
security invoker
set search_path = ''
as $function$
declare
  v_estimate_id uuid;
  v_item jsonb;
  v_description text;
  v_quantity numeric;
  v_unit_price_cents bigint;
  v_subtotal_cents bigint := 0;
  v_discount_cents bigint := 0;
  v_tax_cents bigint := 0;
  v_total_cents bigint := 0;
  v_position integer := 0;
begin
  if p_organization_id is null or p_actor_id is null then
    raise exception 'organization and actor are required';
  end if;
  if p_title is null or char_length(trim(p_title)) = 0 or char_length(trim(p_title)) > 180 then
    raise exception 'invalid estimate title';
  end if;
  if p_currency is null or char_length(trim(p_currency)) < 3 or char_length(trim(p_currency)) > 8 then
    raise exception 'invalid currency';
  end if;
  if p_discount_cents is null or p_discount_cents < 0
     or p_planned_labor_cents is null or p_planned_labor_cents < 0
     or p_other_cost_cents is null or p_other_cost_cents < 0 then
    raise exception 'invalid monetary values';
  end if;
  if p_tax_rate is not null and (p_tax_rate < 0 or p_tax_rate > 100) then
    raise exception 'invalid tax rate';
  end if;
  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1
     or jsonb_array_length(p_items) > 100 then
    raise exception 'invalid estimate items';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_description := trim(coalesce(v_item->>'description', ''));
    v_quantity := nullif(v_item->>'quantity', '')::numeric;
    v_unit_price_cents := nullif(v_item->>'unit_price_cents', '')::bigint;

    if v_description = '' or char_length(v_description) > 500
       or v_quantity is null or v_quantity <= 0
       or v_unit_price_cents is null or v_unit_price_cents < 0 then
      raise exception 'invalid estimate item';
    end if;

    v_subtotal_cents := v_subtotal_cents + round(v_quantity * v_unit_price_cents)::bigint;
  end loop;

  v_discount_cents := least(v_subtotal_cents, p_discount_cents);
  if p_tax_rate is not null then
    v_tax_cents := round((v_subtotal_cents - v_discount_cents) * (p_tax_rate / 100))::bigint;
  end if;
  v_total_cents := greatest(0, v_subtotal_cents - v_discount_cents + v_tax_cents);

  insert into public.sales_estimates (
    organization_id,status,title,client_id,task_id,currency,
    subtotal_cents,discount_cents,tax_rate,total_cents,
    planned_labor_cents,other_cost_cents,valid_until,notes,created_by
  )
  values (
    p_organization_id,'draft',trim(p_title),p_client_id,p_task_id,upper(trim(p_currency)),
    v_subtotal_cents,v_discount_cents,p_tax_rate,v_total_cents,
    p_planned_labor_cents,p_other_cost_cents,p_valid_until,
    nullif(trim(coalesce(p_notes, '')), ''),p_actor_id
  )
  returning id into v_estimate_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_description := trim(v_item->>'description');
    v_quantity := (v_item->>'quantity')::numeric;
    v_unit_price_cents := (v_item->>'unit_price_cents')::bigint;

    insert into public.sales_estimate_items (
      organization_id,estimate_id,description,quantity,unit_price_cents,position,created_by
    )
    values (
      p_organization_id,v_estimate_id,v_description,v_quantity,
      v_unit_price_cents,v_position,p_actor_id
    );
    v_position := v_position + 1;
  end loop;

  return v_estimate_id;
end;
$function$;

revoke execute on function public.ai_create_estimate_draft(
  uuid, uuid, text, uuid, uuid, text, bigint, numeric, date, text, bigint, bigint, jsonb
) from public, anon, authenticated;

grant execute on function public.ai_create_estimate_draft(
  uuid, uuid, text, uuid, uuid, text, bigint, numeric, date, text, bigint, bigint, jsonb
) to service_role;
