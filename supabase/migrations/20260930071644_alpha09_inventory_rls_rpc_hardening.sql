-- Alpha 0.9 hardening: the public procurement RPC runs with caller
-- privileges and RLS. Direct inserts are still constrained to manager roles,
-- the current tenant, active suppliers, active operations and tracked materials.

drop policy if exists ops_purchase_orders_insert_manager on public.ops_purchase_orders;
create policy ops_purchase_orders_insert_manager
on public.ops_purchase_orders
for insert to authenticated
with check (
  private.is_billing_module_allowed(organization_id,'inventory')
  and status = 'draft'
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_purchase_orders.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
  and exists (
    select 1 from public.ops_suppliers s
    where s.organization_id = ops_purchase_orders.organization_id
      and s.id = ops_purchase_orders.supplier_id
      and s.active = true
  )
  and (
    task_id is null
    or exists (
      select 1 from public.ops_tasks t
      where t.organization_id = ops_purchase_orders.organization_id
        and t.id = ops_purchase_orders.task_id
        and t.kind in ('work','order')
        and t.status not in ('done','cancelled')
    )
  )
);

drop policy if exists ops_purchase_order_items_insert_manager on public.ops_purchase_order_items;
create policy ops_purchase_order_items_insert_manager
on public.ops_purchase_order_items
for insert to authenticated
with check (
  private.is_billing_module_allowed(organization_id,'inventory')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_purchase_order_items.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
  and exists (
    select 1 from public.ops_purchase_orders po
    where po.organization_id = ops_purchase_order_items.organization_id
      and po.id = ops_purchase_order_items.purchase_order_id
      and po.status = 'draft'
  )
  and exists (
    select 1 from public.ops_material_catalog c
    where c.organization_id = ops_purchase_order_items.organization_id
      and c.id = ops_purchase_order_items.material_id
      and c.stock_tracked = true
  )
);

grant insert on public.ops_purchase_orders to authenticated;
grant insert on public.ops_purchase_order_items to authenticated;

alter function public.inventory_create_purchase_order(uuid,uuid,uuid,date,text,jsonb)
  security invoker;

create index if not exists ops_inventory_movements_created_by_idx
  on public.ops_inventory_movements(created_by)
  where created_by is not null;
create index if not exists ops_inventory_movements_order_idx
  on public.ops_inventory_movements(organization_id,purchase_order_id)
  where purchase_order_id is not null;
create index if not exists ops_purchase_orders_created_by_idx
  on public.ops_purchase_orders(created_by)
  where created_by is not null;
create index if not exists ops_purchase_orders_org_task_idx
  on public.ops_purchase_orders(organization_id,task_id)
  where task_id is not null;
create index if not exists ops_suppliers_created_by_idx
  on public.ops_suppliers(created_by)
  where created_by is not null;
