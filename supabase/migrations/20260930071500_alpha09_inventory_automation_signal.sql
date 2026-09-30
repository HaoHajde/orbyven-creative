-- Alpha 0.9 follow-up: expose the deterministic procurement recommendation
-- consumed by ORBYVEN Automation without moving business math into the UI.
create or replace view public.ops_inventory_procurement_gaps
with (security_invoker = true)
as
with accepted_estimates as (
  select id, organization_id, task_id
  from (
    select
      e.id,
      e.organization_id,
      e.task_id,
      row_number() over (
        partition by e.organization_id, coalesce(e.task_id, e.id)
        order by e.updated_at desc, e.id desc
      ) as rn
    from public.sales_estimates e
    left join public.ops_tasks t
      on t.organization_id = e.organization_id
     and t.id = e.task_id
    where e.status = 'accepted'
      and (t.id is null or t.status not in ('done','cancelled'))
  ) ranked
  where rn = 1
),
demand as (
  select req.organization_id, req.material_id, sum(req.quantity) as demand_quantity
  from public.sales_material_requirements req
  join accepted_estimates ae
    on ae.organization_id = req.organization_id
   and ae.id = req.estimate_id
  where req.material_id is not null
  group by req.organization_id, req.material_id
),
consumed as (
  select m.organization_id, m.material_id, sum(-m.quantity_delta) as consumed_quantity
  from public.ops_inventory_movements m
  join accepted_estimates ae
    on ae.organization_id = m.organization_id
   and ae.task_id is not null
   and ae.task_id = m.task_id
  where m.movement_type = 'consumption'
    and m.quantity_delta < 0
  group by m.organization_id, m.material_id
),
stock as (
  select m.organization_id, m.material_id, sum(m.quantity_delta) as on_hand
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
    c.organization_id,
    c.id as material_id,
    c.name,
    c.unit,
    c.unit_cost_cents,
    c.preferred_supplier_id,
    coalesce(s.on_hand,0::numeric) as on_hand,
    greatest(
      0::numeric,
      coalesce(d.demand_quantity,0::numeric) - coalesce(x.consumed_quantity,0::numeric)
    ) as outstanding_demand,
    coalesce(o.on_order,0::numeric) as on_order,
    c.reorder_point
  from public.ops_material_catalog c
  left join stock s
    on s.organization_id = c.organization_id and s.material_id = c.id
  left join demand d
    on d.organization_id = c.organization_id and d.material_id = c.id
  left join consumed x
    on x.organization_id = c.organization_id and x.material_id = c.id
  left join on_order o
    on o.organization_id = c.organization_id and o.material_id = c.id
  where c.stock_tracked = true
)
select
  organization_id,
  material_id,
  name,
  unit,
  unit_cost_cents,
  preferred_supplier_id,
  on_hand,
  outstanding_demand,
  on_order,
  reorder_point,
  greatest(
    0::numeric,
    outstanding_demand + reorder_point - on_hand - on_order
  ) as suggested_order
from base;

grant select on public.ops_inventory_procurement_gaps to authenticated;
revoke all on public.ops_inventory_procurement_gaps from anon;
