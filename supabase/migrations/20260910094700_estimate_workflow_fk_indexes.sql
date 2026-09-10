create index if not exists ops_material_recipes_created_by_idx
  on public.ops_material_recipes(created_by) where created_by is not null;
create index if not exists ops_material_recipe_items_created_by_idx
  on public.ops_material_recipe_items(created_by) where created_by is not null;
create index if not exists sales_material_requirements_org_recipe_idx
  on public.sales_material_requirements(organization_id, source_recipe_id)
  where source_recipe_id is not null;
create index if not exists sales_material_requirements_org_item_idx
  on public.sales_material_requirements(organization_id, source_estimate_item_id)
  where source_estimate_item_id is not null;
create index if not exists sales_material_requirements_created_by_idx
  on public.sales_material_requirements(created_by) where created_by is not null;
create index if not exists sales_commercial_documents_org_client_idx
  on public.sales_commercial_documents(organization_id, client_id)
  where client_id is not null;
create index if not exists sales_commercial_documents_org_task_idx
  on public.sales_commercial_documents(organization_id, task_id)
  where task_id is not null;
create index if not exists sales_commercial_documents_created_by_idx
  on public.sales_commercial_documents(created_by) where created_by is not null;
create index if not exists finance_budget_entries_org_client_idx
  on public.finance_budget_entries(organization_id, client_id)
  where client_id is not null;
create index if not exists finance_budget_entries_org_task_idx
  on public.finance_budget_entries(organization_id, task_id)
  where task_id is not null;
create index if not exists finance_budget_entries_created_by_idx
  on public.finance_budget_entries(created_by) where created_by is not null;
