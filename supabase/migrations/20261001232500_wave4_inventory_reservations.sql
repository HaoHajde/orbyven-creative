-- ORBYVEN Wave 4 — Inventory reservations & task material readiness
-- Additive reservation layer over the append-only stock ledger.
-- Reservations do not change physical on-hand quantity; consumption remains the only stock outflow.

create table if not exists public.ops_inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null,
  material_id uuid not null,
  reserved_quantity numeric not null check (reserved_quantity > 0),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, task_id, material_id),
  constraint ops_inventory_reservations_task_fk
    foreign key (organization_id, task_id)
    references public.ops_tasks(organization_id, id)
    on delete cascade,
  constraint ops_inventory_reservations_material_fk
    foreign key (organization_id, material_id)
    references public.ops_material_catalog(organization_id, id)
    on delete restrict
);

create index if not exists ops_inventory_reservations_material_idx
  on public.ops_inventory_reservations(organization_id, material_id, task_id);
create index if not exists ops_inventory_reservations_created_by_idx
  on public.ops_inventory_reservations(created_by)
  where created_by is not null;

drop trigger if exists ops_inventory_reservations_updated_at
  on public.ops_inventory_reservations;
create trigger ops_inventory_reservations_updated_at
before update on public.ops_inventory_reservations
for each row execute function public.set_updated_at();

create or replace view public.ops_inventory_task_material_plan
with (security_invoker = true)
as
with accepted_task_estimates as (
  select id, organization_id, task_id
  from (
    select
      e.id,
      e.organization_id,
      e.task_id,
      row_number() over (
        partition by e.organization_id, e.task_id
        order by e.updated_at desc, e.id desc
      ) as rn
    from public.sales_estimates e
    join public.ops_tasks t
      on t.organization_id = e.organization_id
     and t.id = e.task_id
    where e.status = 'accepted'
      and e.task_id is not null
      and t.kind in ('work','order')
      and t.status not in ('done','cancelled')
  ) ranked
  where rn = 1
),
requirements as (
  select
    req.organization_id,
    ae.task_id,
    ae.id as estimate_id,
    req.material_id,
    sum(req.quantity) as required_quantity
  from public.sales_material_requirements req
  join accepted_task_estimates ae
    on ae.organization_id = req.organization_id
   and ae.id = req.estimate_id
  where req.material_id is not null
  group by req.organization_id, ae.task_id, ae.id, req.material_id
),
consumed as (
  select
    m.organization_id,
    m.task_id,
    m.material_id,
    sum(-m.quantity_delta) as consumed_quantity
  from public.ops_inventory_movements m
  where m.movement_type = 'consumption'
    and m.quantity_delta < 0
    and m.task_id is not null
  group by m.organization_id, m.task_id, m.material_id
),
stock as (
  select
    m.organization_id,
    m.material_id,
    sum(m.quantity_delta) as on_hand
  from public.ops_inventory_movements m
  group by m.organization_id, m.material_id
),
on_order as (
  select
    p.organization_id,
    p.material_id,
    sum(greatest(0::numeric, p.ordered_quantity - p.received_quantity)) as on_order
  from public.ops_purchase_order_item_progress p
  join public.ops_purchase_orders po
    on po.organization_id = p.organization_id
   and po.id = p.purchase_order_id
  where po.status in ('ordered','partially_received')
  group by p.organization_id, p.material_id
),
base as (
  select
    r.organization_id,
    r.task_id,
    r.estimate_id,
    r.material_id,
    c.name,
    c.unit,
    c.unit_cost_cents,
    c.stock_tracked,
    c.preferred_supplier_id,
    r.required_quantity,
    coalesce(x.consumed_quantity, 0::numeric) as consumed_quantity,
    greatest(
      0::numeric,
      r.required_quantity - coalesce(x.consumed_quantity, 0::numeric)
    ) as outstanding_quantity,
    coalesce(s.on_hand, 0::numeric) as on_hand,
    coalesce(o.on_order, 0::numeric) as on_order
  from requirements r
  join public.ops_material_catalog c
    on c.organization_id = r.organization_id
   and c.id = r.material_id
  left join consumed x
    on x.organization_id = r.organization_id
   and x.task_id = r.task_id
   and x.material_id = r.material_id
  left join stock s
    on s.organization_id = r.organization_id
   and s.material_id = r.material_id
  left join on_order o
    on o.organization_id = r.organization_id
   and o.material_id = r.material_id
),
effective_reservations as (
  select
    b.organization_id,
    b.task_id,
    b.material_id,
    greatest(
      0::numeric,
      least(coalesce(r.reserved_quantity, 0::numeric), b.required_quantity)
      - b.consumed_quantity
    ) as effective_reserved
  from base b
  left join public.ops_inventory_reservations r
    on r.organization_id = b.organization_id
   and r.task_id = b.task_id
   and r.material_id = b.material_id
),
reservation_totals as (
  select
    organization_id,
    material_id,
    sum(effective_reserved) as total_reserved
  from effective_reservations
  group by organization_id, material_id
)
select
  b.organization_id,
  b.task_id,
  b.estimate_id,
  b.material_id,
  b.name,
  b.unit,
  b.unit_cost_cents,
  b.stock_tracked,
  b.preferred_supplier_id,
  b.required_quantity,
  b.consumed_quantity,
  b.outstanding_quantity,
  er.effective_reserved as reserved_quantity,
  greatest(
    0::numeric,
    coalesce(rt.total_reserved, 0::numeric) - er.effective_reserved
  ) as reserved_elsewhere,
  b.on_hand,
  b.on_order,
  greatest(
    0::numeric,
    b.on_hand - coalesce(rt.total_reserved, 0::numeric)
  ) as available_unreserved,
  least(
    greatest(0::numeric, b.outstanding_quantity - er.effective_reserved),
    greatest(0::numeric, b.on_hand - coalesce(rt.total_reserved, 0::numeric))
  ) as available_to_reserve,
  greatest(
    0::numeric,
    b.outstanding_quantity
      - er.effective_reserved
      - greatest(0::numeric, b.on_hand - coalesce(rt.total_reserved, 0::numeric))
  ) as shortage_after_reservation
from base b
join effective_reservations er
  on er.organization_id = b.organization_id
 and er.task_id = b.task_id
 and er.material_id = b.material_id
left join reservation_totals rt
  on rt.organization_id = b.organization_id
 and rt.material_id = b.material_id;

alter table public.ops_inventory_reservations enable row level security;

drop policy if exists ops_inventory_reservations_select_member
  on public.ops_inventory_reservations;
create policy ops_inventory_reservations_select_member
on public.ops_inventory_reservations
for select to authenticated
using (
  private.is_org_member(organization_id)
  and private.is_billing_module_allowed(organization_id, 'inventory')
);

drop policy if exists ops_inventory_reservations_insert_operator
  on public.ops_inventory_reservations;
create policy ops_inventory_reservations_insert_operator
on public.ops_inventory_reservations
for insert to authenticated
with check (
  private.is_billing_module_allowed(organization_id, 'inventory')
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = ops_inventory_reservations.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
  )
);

drop policy if exists ops_inventory_reservations_update_operator
  on public.ops_inventory_reservations;
create policy ops_inventory_reservations_update_operator
on public.ops_inventory_reservations
for update to authenticated
using (
  private.is_billing_module_allowed(organization_id, 'inventory')
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = ops_inventory_reservations.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
  )
)
with check (
  private.is_billing_module_allowed(organization_id, 'inventory')
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = ops_inventory_reservations.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
  )
);

drop policy if exists ops_inventory_reservations_delete_operator
  on public.ops_inventory_reservations;
create policy ops_inventory_reservations_delete_operator
on public.ops_inventory_reservations
for delete to authenticated
using (
  private.is_billing_module_allowed(organization_id, 'inventory')
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = ops_inventory_reservations.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
  )
);

create or replace function public.inventory_reserve_task_stock(
  p_organization_id uuid,
  p_task_id uuid,
  p_material_id uuid default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  actor_role text;
  candidate record;
  plan_row record;
  existing_raw numeric;
  target_raw numeric;
  changed_count integer := 0;
begin
  if (select auth.uid()) is null
     or not private.is_billing_module_allowed(p_organization_id, 'inventory') then
    raise exception 'inventory access denied' using errcode = '42501';
  end if;

  select m.role into actor_role
  from public.organization_members m
  where m.organization_id = p_organization_id
    and m.user_id = (select auth.uid())
    and m.access_status = 'active'
  limit 1;

  if actor_role not in ('owner','admin','manager','member') then
    raise exception 'inventory reservation write denied' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.ops_tasks t
    where t.organization_id = p_organization_id
      and t.id = p_task_id
      and t.kind in ('work','order')
      and t.status not in ('done','cancelled')
  ) then
    raise exception 'task/order is not available';
  end if;

  for candidate in
    select p.material_id
    from public.ops_inventory_task_material_plan p
    where p.organization_id = p_organization_id
      and p.task_id = p_task_id
      and p.stock_tracked = true
      and p.available_to_reserve > 0
      and (p_material_id is null or p.material_id = p_material_id)
    order by p.material_id
  loop
    -- Same advisory key as the stock movement guard: reservation and physical
    -- consumption for one material cannot race each other.
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        p_organization_id::text || ':' || candidate.material_id::text,
        0
      )
    );

    select
      p.required_quantity,
      p.consumed_quantity,
      p.available_to_reserve
    into plan_row
    from public.ops_inventory_task_material_plan p
    where p.organization_id = p_organization_id
      and p.task_id = p_task_id
      and p.material_id = candidate.material_id;

    if not found or plan_row.available_to_reserve <= 0 then
      continue;
    end if;

    select r.reserved_quantity
      into existing_raw
    from public.ops_inventory_reservations r
    where r.organization_id = p_organization_id
      and r.task_id = p_task_id
      and r.material_id = candidate.material_id
    for update;

    target_raw := least(
      plan_row.required_quantity,
      greatest(coalesce(existing_raw, 0::numeric), plan_row.consumed_quantity)
        + plan_row.available_to_reserve
    );

    if target_raw <= plan_row.consumed_quantity then
      continue;
    end if;

    insert into public.ops_inventory_reservations(
      organization_id,
      task_id,
      material_id,
      reserved_quantity,
      created_by
    )
    values (
      p_organization_id,
      p_task_id,
      candidate.material_id,
      target_raw,
      (select auth.uid())
    )
    on conflict (organization_id, task_id, material_id)
    do update set
      reserved_quantity = excluded.reserved_quantity,
      updated_at = pg_catalog.now();

    changed_count := changed_count + 1;
  end loop;

  return changed_count;
end
$function$;

grant select, insert, update, delete
  on public.ops_inventory_reservations to authenticated;
grant select on public.ops_inventory_task_material_plan to authenticated;

revoke all on public.ops_inventory_reservations from anon;
revoke all on public.ops_inventory_task_material_plan from anon;

revoke all on function public.inventory_reserve_task_stock(uuid,uuid,uuid)
  from public, anon;
grant execute on function public.inventory_reserve_task_stock(uuid,uuid,uuid)
  to authenticated;

comment on table public.ops_inventory_reservations is
  'Operational stock allocations by task/material. Reservations never mutate physical stock.';
comment on view public.ops_inventory_task_material_plan is
  'Accepted-estimate material requirements with consumption, effective reservations, available stock and task shortage.';
