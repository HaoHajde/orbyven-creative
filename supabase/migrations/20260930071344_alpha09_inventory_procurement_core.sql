-- ORBYVEN Alpha 0.9 — Inventory & Procurement Core
-- Additive operational ledger over the existing material library and accepted-estimate demand.

alter table public.sales_material_requirements
  add column if not exists material_id uuid;

alter table public.sales_material_requirements
  drop constraint if exists sales_material_requirements_material_fk;
alter table public.sales_material_requirements
  add constraint sales_material_requirements_material_fk
  foreign key (organization_id, material_id)
  references public.ops_material_catalog(organization_id, id)
  on delete restrict;

create index if not exists sales_material_requirements_material_idx
  on public.sales_material_requirements(organization_id, material_id, estimate_id)
  where material_id is not null;

-- Safe legacy backfill: exact catalog name + exact unit only.
update public.sales_material_requirements req
set material_id = c.id
from public.ops_material_catalog c
where req.material_id is null
  and c.organization_id = req.organization_id
  and lower(trim(c.name)) = lower(trim(req.description))
  and lower(trim(c.unit)) = lower(trim(req.unit));

create table if not exists public.ops_suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 180),
  contact_name text,
  email text,
  phone text,
  website text,
  payment_terms_days integer not null default 0 check (payment_terms_days between 0 and 365),
  active boolean not null default true,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);
create unique index if not exists ops_suppliers_org_name_unique
  on public.ops_suppliers(organization_id, lower(trim(name)));
create index if not exists ops_suppliers_org_active_idx
  on public.ops_suppliers(organization_id, active, name);
drop trigger if exists ops_suppliers_updated_at on public.ops_suppliers;
create trigger ops_suppliers_updated_at
before update on public.ops_suppliers
for each row execute function public.set_updated_at();

alter table public.ops_material_catalog
  add column if not exists sku text,
  add column if not exists stock_tracked boolean not null default false,
  add column if not exists reorder_point numeric not null default 0,
  add column if not exists preferred_supplier_id uuid;

alter table public.ops_material_catalog
  drop constraint if exists ops_material_catalog_reorder_point_check;
alter table public.ops_material_catalog
  add constraint ops_material_catalog_reorder_point_check
  check (reorder_point >= 0);

alter table public.ops_material_catalog
  drop constraint if exists ops_material_catalog_preferred_supplier_fk;
alter table public.ops_material_catalog
  add constraint ops_material_catalog_preferred_supplier_fk
  foreign key (organization_id, preferred_supplier_id)
  references public.ops_suppliers(organization_id, id)
  on delete set null;

create index if not exists ops_material_catalog_preferred_supplier_idx
  on public.ops_material_catalog(organization_id, preferred_supplier_id)
  where preferred_supplier_id is not null;

create table if not exists public.ops_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid not null,
  task_id uuid,
  status text not null default 'draft'
    check (status in ('draft','ordered','partially_received','received','cancelled')),
  reference text not null check (char_length(trim(reference)) between 1 and 80),
  ordered_on date,
  expected_on date,
  currency text not null default 'RON' check (char_length(trim(currency)) = 3),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, reference),
  constraint ops_purchase_orders_supplier_fk
    foreign key (organization_id, supplier_id)
    references public.ops_suppliers(organization_id, id) on delete restrict,
  constraint ops_purchase_orders_task_fk
    foreign key (organization_id, task_id)
    references public.ops_tasks(organization_id, id) on delete set null
);
create index if not exists ops_purchase_orders_org_status_idx
  on public.ops_purchase_orders(organization_id, status, updated_at desc);
create index if not exists ops_purchase_orders_supplier_idx
  on public.ops_purchase_orders(organization_id, supplier_id, created_at desc);
drop trigger if exists ops_purchase_orders_updated_at on public.ops_purchase_orders;
create trigger ops_purchase_orders_updated_at
before update on public.ops_purchase_orders
for each row execute function public.set_updated_at();

create table if not exists public.ops_purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  purchase_order_id uuid not null,
  material_id uuid not null,
  description text not null check (char_length(trim(description)) between 1 and 240),
  ordered_quantity numeric not null check (ordered_quantity > 0),
  unit text not null check (char_length(trim(unit)) between 1 and 30),
  unit_cost_cents bigint not null default 0 check (unit_cost_cents >= 0),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint ops_purchase_order_items_order_fk
    foreign key (organization_id, purchase_order_id)
    references public.ops_purchase_orders(organization_id, id) on delete cascade,
  constraint ops_purchase_order_items_material_fk
    foreign key (organization_id, material_id)
    references public.ops_material_catalog(organization_id, id) on delete restrict
);
create index if not exists ops_purchase_order_items_order_idx
  on public.ops_purchase_order_items(organization_id, purchase_order_id, position, id);
create index if not exists ops_purchase_order_items_material_idx
  on public.ops_purchase_order_items(organization_id, material_id, created_at desc);

create table if not exists public.ops_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  material_id uuid not null,
  task_id uuid,
  purchase_order_id uuid,
  purchase_order_item_id uuid,
  movement_type text not null
    check (movement_type in ('receipt','consumption','adjustment_in','adjustment_out','return_in','return_out')),
  quantity_delta numeric not null check (quantity_delta <> 0),
  unit_cost_cents bigint not null default 0 check (unit_cost_cents >= 0),
  note text,
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint ops_inventory_movements_material_fk
    foreign key (organization_id, material_id)
    references public.ops_material_catalog(organization_id, id) on delete restrict,
  constraint ops_inventory_movements_task_fk
    foreign key (organization_id, task_id)
    references public.ops_tasks(organization_id, id) on delete set null,
  constraint ops_inventory_movements_order_fk
    foreign key (organization_id, purchase_order_id)
    references public.ops_purchase_orders(organization_id, id) on delete set null,
  constraint ops_inventory_movements_order_item_fk
    foreign key (organization_id, purchase_order_item_id)
    references public.ops_purchase_order_items(organization_id, id) on delete set null
);
create index if not exists ops_inventory_movements_material_idx
  on public.ops_inventory_movements(organization_id, material_id, occurred_at desc, id);
create index if not exists ops_inventory_movements_task_idx
  on public.ops_inventory_movements(organization_id, task_id, occurred_at desc)
  where task_id is not null;
create index if not exists ops_inventory_movements_order_item_idx
  on public.ops_inventory_movements(organization_id, purchase_order_item_id, occurred_at)
  where purchase_order_item_id is not null;

create or replace view public.ops_purchase_order_item_progress
with (security_invoker = true)
as
select
  poi.id,
  poi.organization_id,
  poi.purchase_order_id,
  poi.material_id,
  poi.description,
  poi.ordered_quantity,
  coalesce(receipts.received_quantity, 0::numeric) as received_quantity,
  poi.unit,
  poi.unit_cost_cents,
  poi.position
from public.ops_purchase_order_items poi
left join lateral (
  select coalesce(sum(m.quantity_delta),0::numeric) as received_quantity
  from public.ops_inventory_movements m
  where m.organization_id = poi.organization_id
    and m.purchase_order_item_id = poi.id
    and m.movement_type = 'receipt'
) receipts on true;

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
  select
    req.organization_id,
    req.material_id,
    sum(req.quantity) as demand_quantity
  from public.sales_material_requirements req
  join accepted_estimates ae
    on ae.organization_id = req.organization_id
   and ae.id = req.estimate_id
  where req.material_id is not null
  group by req.organization_id, req.material_id
),
consumed as (
  select
    m.organization_id,
    m.material_id,
    sum(-m.quantity_delta) as consumed_quantity
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
)
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
where c.stock_tracked = true;

create or replace function private.inventory_movement_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_role text;
  current_stock numeric;
  item_record record;
  received_so_far numeric;
  tracked boolean;
begin
  if (select auth.uid()) is null
     or not private.is_billing_module_allowed(new.organization_id, 'inventory') then
    raise exception 'inventory access denied' using errcode = '42501';
  end if;

  select m.role into actor_role
  from public.organization_members m
  where m.organization_id = new.organization_id
    and m.user_id = (select auth.uid())
    and m.access_status = 'active'
  limit 1;

  if actor_role not in ('owner','admin','manager','member') then
    raise exception 'inventory write denied' using errcode = '42501';
  end if;

  if new.movement_type in ('adjustment_in','adjustment_out')
     and actor_role not in ('owner','admin','manager') then
    raise exception 'inventory adjustment requires manager' using errcode = '42501';
  end if;

  select c.stock_tracked into tracked
  from public.ops_material_catalog c
  where c.organization_id = new.organization_id
    and c.id = new.material_id;
  if tracked is distinct from true then
    raise exception 'material is not tracked in inventory';
  end if;

  if new.movement_type in ('receipt','adjustment_in','return_in') and new.quantity_delta <= 0 then
    raise exception 'inventory inflow must be positive';
  end if;
  if new.movement_type in ('consumption','adjustment_out','return_out') and new.quantity_delta >= 0 then
    raise exception 'inventory outflow must be negative';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.organization_id::text || ':' || new.material_id::text, 0)
  );

  if new.purchase_order_item_id is not null then
    if new.movement_type <> 'receipt' then
      raise exception 'purchase order item can only be linked to a receipt';
    end if;

    select
      poi.purchase_order_id,
      poi.material_id,
      poi.ordered_quantity,
      poi.unit_cost_cents,
      po.status
    into item_record
    from public.ops_purchase_order_items poi
    join public.ops_purchase_orders po
      on po.organization_id = poi.organization_id
     and po.id = poi.purchase_order_id
    where poi.organization_id = new.organization_id
      and poi.id = new.purchase_order_item_id
    for update of poi, po;

    if not found
       or item_record.material_id <> new.material_id
       or item_record.status not in ('ordered','partially_received') then
      raise exception 'purchase order item is not receivable';
    end if;

    select coalesce(sum(m.quantity_delta),0::numeric)
      into received_so_far
    from public.ops_inventory_movements m
    where m.organization_id = new.organization_id
      and m.purchase_order_item_id = new.purchase_order_item_id
      and m.movement_type = 'receipt';

    if received_so_far + new.quantity_delta > item_record.ordered_quantity then
      raise exception 'receipt exceeds ordered quantity';
    end if;

    new.purchase_order_id := item_record.purchase_order_id;
    new.unit_cost_cents := item_record.unit_cost_cents;
  elsif new.movement_type = 'receipt' then
    raise exception 'receipt requires purchase order item';
  end if;

  if new.task_id is not null and not exists (
    select 1 from public.ops_tasks t
    where t.organization_id = new.organization_id
      and t.id = new.task_id
      and t.kind in ('work','order')
      and t.status <> 'cancelled'
  ) then
    raise exception 'task/order is not available';
  end if;

  if new.quantity_delta < 0 then
    select coalesce(sum(m.quantity_delta),0::numeric)
      into current_stock
    from public.ops_inventory_movements m
    where m.organization_id = new.organization_id
      and m.material_id = new.material_id;

    if current_stock + new.quantity_delta < 0 then
      raise exception 'insufficient inventory';
    end if;
  end if;

  new.created_by := (select auth.uid());
  new.occurred_at := coalesce(new.occurred_at, pg_catalog.now());
  return new;
end
$function$;

create or replace function private.inventory_movement_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target_order uuid;
  has_items boolean;
  has_any_received boolean;
  all_received boolean;
begin
  if new.movement_type = 'receipt' and new.purchase_order_item_id is not null then
    if new.unit_cost_cents > 0 then
      update public.ops_material_catalog
      set unit_cost_cents = new.unit_cost_cents
      where organization_id = new.organization_id
        and id = new.material_id;
    end if;

    select poi.purchase_order_id into target_order
    from public.ops_purchase_order_items poi
    where poi.organization_id = new.organization_id
      and poi.id = new.purchase_order_item_id;

    select
      count(*) > 0,
      coalesce(bool_or(progress.received_quantity > 0),false),
      coalesce(bool_and(progress.received_quantity >= progress.ordered_quantity),false)
    into has_items, has_any_received, all_received
    from public.ops_purchase_order_item_progress progress
    where progress.organization_id = new.organization_id
      and progress.purchase_order_id = target_order;

    update public.ops_purchase_orders
    set status = case
      when has_items and all_received then 'received'
      when has_any_received then 'partially_received'
      else status
    end
    where organization_id = new.organization_id
      and id = target_order
      and status in ('ordered','partially_received');
  end if;
  return null;
end
$function$;

create or replace function private.inventory_catalog_settings_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_role text;
begin
  if row(new.stock_tracked,new.reorder_point,new.preferred_supplier_id,new.sku)
     is distinct from
     row(old.stock_tracked,old.reorder_point,old.preferred_supplier_id,old.sku) then
    if not private.is_billing_module_allowed(new.organization_id, 'inventory') then
      raise exception 'inventory access denied' using errcode = '42501';
    end if;
    select m.role into actor_role
    from public.organization_members m
    where m.organization_id = new.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
    limit 1;
    if actor_role not in ('owner','admin','manager') then
      raise exception 'inventory settings require manager' using errcode = '42501';
    end if;
    if new.preferred_supplier_id is not null and not exists (
      select 1 from public.ops_suppliers s
      where s.organization_id = new.organization_id
        and s.id = new.preferred_supplier_id
        and s.active = true
    ) then
      raise exception 'preferred supplier is not active';
    end if;
  end if;
  return new;
end
$function$;

create or replace function private.purchase_order_status_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  has_items boolean;
  any_received boolean;
  all_received boolean;
begin
  if new.status = old.status then return new; end if;

  if old.status = 'draft' and new.status in ('ordered','cancelled') then
    if new.status = 'ordered' then
      new.ordered_on := coalesce(new.ordered_on, pg_catalog.current_date);
    end if;
    return new;
  end if;

  if old.status in ('ordered','partially_received')
     and new.status = 'cancelled' then
    return new;
  end if;

  if new.status in ('partially_received','received')
     and old.status in ('ordered','partially_received') then
    select
      count(*) > 0,
      coalesce(bool_or(p.received_quantity > 0),false),
      coalesce(bool_and(p.received_quantity >= p.ordered_quantity),false)
    into has_items, any_received, all_received
    from public.ops_purchase_order_item_progress p
    where p.organization_id = new.organization_id
      and p.purchase_order_id = new.id;

    if new.status = 'received' and has_items and all_received then return new; end if;
    if new.status = 'partially_received' and any_received and not all_received then return new; end if;
  end if;

  raise exception 'invalid purchase order status transition';
end
$function$;

drop trigger if exists ops_inventory_movements_guard on public.ops_inventory_movements;
create trigger ops_inventory_movements_guard
before insert on public.ops_inventory_movements
for each row execute function private.inventory_movement_guard();

drop trigger if exists ops_inventory_movements_after_insert on public.ops_inventory_movements;
create trigger ops_inventory_movements_after_insert
after insert on public.ops_inventory_movements
for each row execute function private.inventory_movement_after_insert();

drop trigger if exists ops_material_catalog_inventory_settings_guard on public.ops_material_catalog;
create trigger ops_material_catalog_inventory_settings_guard
before update on public.ops_material_catalog
for each row execute function private.inventory_catalog_settings_guard();

drop trigger if exists ops_purchase_orders_status_guard on public.ops_purchase_orders;
create trigger ops_purchase_orders_status_guard
before update of status on public.ops_purchase_orders
for each row execute function private.purchase_order_status_guard();

create or replace function public.inventory_create_purchase_order(
  p_organization_id uuid,
  p_supplier_id uuid,
  p_task_id uuid default null,
  p_expected_on date default null,
  p_note text default null,
  p_items jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_role text;
  new_order_id uuid;
  new_reference text;
  item_count integer;
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
  if actor_role not in ('owner','admin','manager') then
    raise exception 'procurement requires manager' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.ops_suppliers s
    where s.organization_id = p_organization_id
      and s.id = p_supplier_id
      and s.active = true
  ) then
    raise exception 'supplier is not available';
  end if;

  if p_task_id is not null and not exists (
    select 1 from public.ops_tasks t
    where t.organization_id = p_organization_id
      and t.id = p_task_id
      and t.kind in ('work','order')
      and t.status not in ('done','cancelled')
  ) then
    raise exception 'task/order is not available';
  end if;

  if pg_catalog.jsonb_typeof(p_items) <> 'array' then
    raise exception 'purchase order items must be an array';
  end if;
  item_count := pg_catalog.jsonb_array_length(p_items);
  if item_count < 1 or item_count > 100 then
    raise exception 'purchase order requires 1 to 100 items';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_to_recordset(p_items)
      as x(material_id uuid, quantity numeric, unit_cost_cents bigint)
    left join public.ops_material_catalog c
      on c.organization_id = p_organization_id
     and c.id = x.material_id
    where c.id is null
       or c.stock_tracked is distinct from true
       or x.quantity is null
       or x.quantity <= 0
       or (x.unit_cost_cents is not null and x.unit_cost_cents < 0)
  ) then
    raise exception 'purchase order contains invalid inventory items';
  end if;

  new_order_id := gen_random_uuid();
  new_reference :=
    'PO-' ||
    pg_catalog.to_char(pg_catalog.clock_timestamp(),'YYMMDD') ||
    '-' ||
    pg_catalog.upper(pg_catalog.substr(pg_catalog.replace(new_order_id::text,'-',''),1,6));

  insert into public.ops_purchase_orders(
    id, organization_id, supplier_id, task_id, status, reference,
    expected_on, currency, note, created_by
  )
  values (
    new_order_id, p_organization_id, p_supplier_id, p_task_id, 'draft',
    new_reference, p_expected_on, 'RON', nullif(pg_catalog.trim(p_note),''),
    (select auth.uid())
  );

  insert into public.ops_purchase_order_items(
    organization_id, purchase_order_id, material_id, description,
    ordered_quantity, unit, unit_cost_cents, position
  )
  select
    p_organization_id,
    new_order_id,
    x.material_id,
    c.name,
    x.quantity,
    c.unit,
    coalesce(x.unit_cost_cents, c.unit_cost_cents),
    x.ordinality - 1
  from pg_catalog.jsonb_to_recordset(p_items)
    with ordinality as x(material_id uuid, quantity numeric, unit_cost_cents bigint, ordinality bigint)
  join public.ops_material_catalog c
    on c.organization_id = p_organization_id
   and c.id = x.material_id;

  return new_order_id;
end
$function$;

alter table public.ops_suppliers enable row level security;
alter table public.ops_purchase_orders enable row level security;
alter table public.ops_purchase_order_items enable row level security;
alter table public.ops_inventory_movements enable row level security;

drop policy if exists ops_suppliers_select_member on public.ops_suppliers;
create policy ops_suppliers_select_member on public.ops_suppliers
for select to authenticated
using (private.is_billing_module_allowed(organization_id,'inventory'));

drop policy if exists ops_suppliers_insert_manager on public.ops_suppliers;
create policy ops_suppliers_insert_manager on public.ops_suppliers
for insert to authenticated
with check (
  private.is_billing_module_allowed(organization_id,'inventory')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_suppliers.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
);

drop policy if exists ops_suppliers_update_manager on public.ops_suppliers;
create policy ops_suppliers_update_manager on public.ops_suppliers
for update to authenticated
using (
  private.is_billing_module_allowed(organization_id,'inventory')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_suppliers.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
)
with check (
  private.is_billing_module_allowed(organization_id,'inventory')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_suppliers.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
);

drop policy if exists ops_suppliers_delete_manager on public.ops_suppliers;
create policy ops_suppliers_delete_manager on public.ops_suppliers
for delete to authenticated
using (
  private.is_billing_module_allowed(organization_id,'inventory')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_suppliers.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
);

drop policy if exists ops_purchase_orders_select_member on public.ops_purchase_orders;
create policy ops_purchase_orders_select_member on public.ops_purchase_orders
for select to authenticated
using (private.is_billing_module_allowed(organization_id,'inventory'));

drop policy if exists ops_purchase_orders_update_manager on public.ops_purchase_orders;
create policy ops_purchase_orders_update_manager on public.ops_purchase_orders
for update to authenticated
using (
  private.is_billing_module_allowed(organization_id,'inventory')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_purchase_orders.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
)
with check (
  private.is_billing_module_allowed(organization_id,'inventory')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_purchase_orders.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
);

drop policy if exists ops_purchase_order_items_select_member on public.ops_purchase_order_items;
create policy ops_purchase_order_items_select_member on public.ops_purchase_order_items
for select to authenticated
using (private.is_billing_module_allowed(organization_id,'inventory'));

drop policy if exists ops_inventory_movements_select_member on public.ops_inventory_movements;
create policy ops_inventory_movements_select_member on public.ops_inventory_movements
for select to authenticated
using (private.is_billing_module_allowed(organization_id,'inventory'));

drop policy if exists ops_inventory_movements_insert_operator on public.ops_inventory_movements;
create policy ops_inventory_movements_insert_operator on public.ops_inventory_movements
for insert to authenticated
with check (
  private.is_billing_module_allowed(organization_id,'inventory')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_inventory_movements.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
  )
);

grant select, insert, update, delete on public.ops_suppliers to authenticated;
grant select on public.ops_purchase_orders to authenticated;
grant update(status, ordered_on) on public.ops_purchase_orders to authenticated;
grant select on public.ops_purchase_order_items to authenticated;
grant select, insert on public.ops_inventory_movements to authenticated;
grant select on public.ops_purchase_order_item_progress to authenticated;
grant select on public.ops_inventory_procurement_gaps to authenticated;

revoke all on public.ops_suppliers from anon;
revoke all on public.ops_purchase_orders from anon;
revoke all on public.ops_purchase_order_items from anon;
revoke all on public.ops_inventory_movements from anon;
revoke all on public.ops_purchase_order_item_progress from anon;
revoke all on public.ops_inventory_procurement_gaps from anon;

revoke all on function public.inventory_create_purchase_order(uuid,uuid,uuid,date,text,jsonb)
  from public, anon;
grant execute on function public.inventory_create_purchase_order(uuid,uuid,uuid,date,text,jsonb)
  to authenticated;

-- Existing active PRO subscriptions receive the entitlement. The module itself
-- remains user-configurable unless this is an explicit Alpha pilot.
insert into public.organization_entitlements
  (organization_id,module_id,plan_id,source,enabled,starts_at,ends_at,metadata,updated_at)
select latest.organization_id, 'inventory', 'pro', 'subscription', true,
       pg_catalog.now(),
       case when latest.status = 'past_due' then latest.grace_until else null end,
       jsonb_build_object('subscription_status',latest.status,'seed','alpha09'),
       pg_catalog.now()
from (
  select distinct on (s.organization_id)
    s.organization_id, s.status, s.grace_until, s.updated_at
  from public.subscriptions s
  where s.plan_id = 'pro'
    and s.status in ('active','trialing','past_due')
  order by s.organization_id, s.updated_at desc
) latest
on conflict (organization_id,module_id) do update
set plan_id = excluded.plan_id,
    source = excluded.source,
    enabled = excluded.enabled,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    metadata = excluded.metadata,
    updated_at = excluded.updated_at;

-- Existing Alpha pilots receive inventory through the same time-boxed pilot model.
insert into public.organization_entitlements
  (organization_id,module_id,source,enabled,starts_at,ends_at,metadata)
select pilot.org_id, 'inventory', 'pilot', true, pg_catalog.now(),
       '2027-06-30T23:59:59Z'::timestamptz,
       '{"grant":"alpha09-inventory-pilot","review_before":"2027-06-30"}'::jsonb
from (values
  ('958a6a34-8e21-4275-9074-db75da0de448'::uuid),
  ('9cab8354-02cc-4e8e-8663-260b200873db'::uuid),
  ('8ae5a6cf-1823-411c-9377-3d2c4c04057d'::uuid),
  ('14a01b56-2649-42e5-b34b-43bb3c69b3a9'::uuid)
) as pilot(org_id)
where exists (select 1 from public.organizations o where o.id = pilot.org_id)
  and not exists (
    select 1 from public.subscriptions s
    where s.organization_id = pilot.org_id
      and s.status in ('active','trialing','past_due')
  )
on conflict (organization_id,module_id) do update
set enabled = excluded.enabled,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    metadata = excluded.metadata,
    updated_at = pg_catalog.now();

insert into public.organization_modules(organization_id,module_id,enabled)
select pilot.org_id, 'inventory', true
from (values
  ('958a6a34-8e21-4275-9074-db75da0de448'::uuid),
  ('9cab8354-02cc-4e8e-8663-260b200873db'::uuid),
  ('8ae5a6cf-1823-411c-9377-3d2c4c04057d'::uuid),
  ('14a01b56-2649-42e5-b34b-43bb3c69b3a9'::uuid)
) as pilot(org_id)
where exists (
  select 1 from public.organization_entitlements e
  where e.organization_id = pilot.org_id
    and e.module_id = 'inventory'
    and e.enabled = true
    and (e.ends_at is null or e.ends_at > pg_catalog.now())
)
on conflict (organization_id,module_id) do update
set enabled = excluded.enabled,
    updated_at = pg_catalog.now();

comment on table public.ops_inventory_movements is
  'Append-only operational stock ledger. Inventory is derived from movement sums; it is not fiscal accounting.';
comment on view public.ops_inventory_procurement_gaps is
  'Accepted-estimate material demand minus task consumption, stock on hand and open supplier orders.';
