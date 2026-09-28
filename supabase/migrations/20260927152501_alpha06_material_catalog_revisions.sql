-- ORBYVEN Alpha 0.6: additive only. Existing workspace, commercial docs,
-- and billing_invoices are preserved. No tenant business data is copied.
create table if not exists public.ops_material_catalog (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 180),
  category text not null default 'general' check (char_length(trim(category)) between 1 and 80),
  unit text not null default 'buc' check (char_length(trim(unit)) between 1 and 30),
  unit_cost_cents bigint not null default 0 check (unit_cost_cents >= 0),
  vendor text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,id)
);
create index if not exists ops_material_catalog_org_name_idx
  on public.ops_material_catalog (organization_id, name);
create unique index if not exists ops_material_catalog_org_name_unit_unique
  on public.ops_material_catalog (organization_id, lower(trim(name)), lower(trim(unit)));
drop trigger if exists ops_material_catalog_updated_at on public.ops_material_catalog;
create trigger ops_material_catalog_updated_at
before update on public.ops_material_catalog for each row
execute function public.set_updated_at();

-- A recipe stores its own snapshot of unit price, while material_id points to
-- the current library entry for future drafts. Old devizes never reprice on
-- catalog edit. Do not remove referenced catalog records.
alter table public.ops_material_recipe_items
  add column if not exists material_id uuid;
alter table public.ops_material_recipe_items
  drop constraint if exists ops_material_recipe_items_catalog_fk;
alter table public.ops_material_recipe_items
  add constraint ops_material_recipe_items_catalog_fk
  foreign key (organization_id,material_id)
  references public.ops_material_catalog(organization_id,id) on delete restrict;
create index if not exists ops_material_recipe_items_material_idx
  on public.ops_material_recipe_items(organization_id,material_id)
  where material_id is not null;

alter table public.ops_material_recipes
  add column if not exists labor_cost_cents bigint not null default 0;
alter table public.ops_material_recipes
  drop constraint if exists ops_material_recipes_labor_cost_check;
alter table public.ops_material_recipes
  add constraint ops_material_recipes_labor_cost_check check (labor_cost_cents >= 0);

-- Profitability is a projection, not fiscal accounting: amounts represent
-- planned direct labor and extra operational costs in the estimate currency.
alter table public.sales_estimates
  add column if not exists planned_labor_cents bigint not null default 0;
alter table public.sales_estimates
  add column if not exists other_cost_cents bigint not null default 0;
alter table public.sales_estimates
  drop constraint if exists sales_estimates_planned_costs_positive;
alter table public.sales_estimates
  add constraint sales_estimates_planned_costs_positive
  check (planned_labor_cents >= 0 and other_cost_cents >= 0);

-- Every revision is a new estimate; accepted offers retain their old estimate.
alter table public.sales_estimates
  add column if not exists source_estimate_id uuid;
alter table public.sales_estimates
  drop constraint if exists sales_estimates_source_revision_fk;
alter table public.sales_estimates
  add constraint sales_estimates_source_revision_fk
  foreign key (organization_id,source_estimate_id)
  references public.sales_estimates(organization_id,id) on delete restrict;
alter table public.sales_estimates
  drop constraint if exists sales_estimates_not_own_source;
alter table public.sales_estimates
  add constraint sales_estimates_not_own_source
  check (source_estimate_id is null or source_estimate_id <> id);
create index if not exists sales_estimates_org_source_idx
  on public.sales_estimates (organization_id,source_estimate_id,created_at desc)
  where source_estimate_id is not null;

alter table public.ops_material_catalog enable row level security;
drop policy if exists ops_material_catalog_select_member on public.ops_material_catalog;
create policy ops_material_catalog_select_member
  on public.ops_material_catalog for select to authenticated
  using (private.is_org_member(organization_id));
drop policy if exists ops_material_catalog_insert_operator on public.ops_material_catalog;
create policy ops_material_catalog_insert_operator
  on public.ops_material_catalog for insert to authenticated
  with check (
    private.is_org_member(organization_id)
    and exists(select 1 from public.organization_members m
      where m.organization_id=ops_material_catalog.organization_id
      and m.user_id=(select auth.uid()) and m.access_status='active'
      and m.role in ('owner','admin','manager','member'))
  );
drop policy if exists ops_material_catalog_update_operator on public.ops_material_catalog;
create policy ops_material_catalog_update_operator
  on public.ops_material_catalog for update to authenticated
  using (
    private.is_org_member(organization_id)
    and exists(select 1 from public.organization_members m
      where m.organization_id=ops_material_catalog.organization_id
      and m.user_id=(select auth.uid()) and m.access_status='active'
      and m.role in ('owner','admin','manager','member'))
  )
  with check (
    private.is_org_member(organization_id)
    and exists(select 1 from public.organization_members m
      where m.organization_id=ops_material_catalog.organization_id
      and m.user_id=(select auth.uid()) and m.access_status='active'
      and m.role in ('owner','admin','manager','member'))
  );
drop policy if exists ops_material_catalog_delete_manager on public.ops_material_catalog;
create policy ops_material_catalog_delete_manager
  on public.ops_material_catalog for delete to authenticated
  using (
    private.is_org_member(organization_id)
    and exists(select 1 from public.organization_members m
      where m.organization_id=ops_material_catalog.organization_id
      and m.user_id=(select auth.uid()) and m.access_status='active'
      and m.role in ('owner','admin','manager'))
  );
-- Restrictive paid-module policy ANDs with the role policies above.
drop policy if exists billing_entitlement_guard on public.ops_material_catalog;
create policy billing_entitlement_guard
  on public.ops_material_catalog as restrictive for all to authenticated
  using (private.is_billing_module_allowed(organization_id,'estimates'))
  with check (private.is_billing_module_allowed(organization_id,'estimates'));
grant select,insert,update,delete on public.ops_material_catalog to authenticated;
revoke all on public.ops_material_catalog from anon;
