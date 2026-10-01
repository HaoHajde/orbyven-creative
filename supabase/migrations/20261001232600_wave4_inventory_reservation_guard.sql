-- ORBYVEN Wave 4 hardening — reserved stock cannot be consumed by another task.
-- Physical stock remains the source of truth; this guard only protects allocations.

create or replace function private.inventory_reservation_outflow_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_stock numeric;
  protected_for_other_tasks numeric;
begin
  if new.quantity_delta >= 0
     or new.movement_type not in ('consumption','adjustment_out','return_out') then
    return new;
  end if;

  if (select auth.uid()) is null
     or not private.is_billing_module_allowed(new.organization_id, 'inventory') then
    raise exception 'inventory access denied' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = new.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
  ) then
    raise exception 'inventory write denied' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      new.organization_id::text || ':' || new.material_id::text,
      0
    )
  );

  select coalesce(sum(m.quantity_delta), 0::numeric)
    into current_stock
  from public.ops_inventory_movements m
  where m.organization_id = new.organization_id
    and m.material_id = new.material_id;

  select coalesce(sum(p.reserved_quantity), 0::numeric)
    into protected_for_other_tasks
  from public.ops_inventory_task_material_plan p
  where p.organization_id = new.organization_id
    and p.material_id = new.material_id
    and (
      new.task_id is null
      or p.task_id <> new.task_id
    );

  if current_stock + new.quantity_delta < protected_for_other_tasks then
    raise exception 'inventory_reserved_for_other_work';
  end if;

  return new;
end
$function$;

drop trigger if exists ops_inventory_reservation_outflow_guard
  on public.ops_inventory_movements;
create trigger ops_inventory_reservation_outflow_guard
before insert on public.ops_inventory_movements
for each row execute function private.inventory_reservation_outflow_guard();

comment on function private.inventory_reservation_outflow_guard() is
  'Prevents one task or a manual stock adjustment from consuming physical stock reserved for other active work.';
