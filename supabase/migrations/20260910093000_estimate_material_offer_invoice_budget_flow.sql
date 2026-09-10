-- ORBYVEN estimate -> materials -> offer -> invoice draft -> budget workflow.
-- Additive, tenant-scoped, RLS-protected. Fiscal invoice issuance remains a provider integration boundary.

create unique index if not exists sales_estimate_items_org_id_unique
  on public.sales_estimate_items(organization_id, id);

alter table public.finance_expenses
  add column if not exists estimate_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'finance_expenses_estimate_fk'
  ) then
    alter table public.finance_expenses
      add constraint finance_expenses_estimate_fk
      foreign key (organization_id, estimate_id)
      references public.sales_estimates(organization_id, id)
      on delete set null;
  end if;
end $$;

create index if not exists finance_expenses_org_estimate_idx
  on public.finance_expenses(organization_id, estimate_id)
  where estimate_id is not null;

create table if not exists public.ops_material_recipes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, name)
);

create table if not exists public.ops_material_recipe_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipe_id uuid not null,
  description text not null check (char_length(trim(description)) > 0),
  quantity_per_unit numeric(12,3) not null default 1 check (quantity_per_unit > 0),
  unit text not null default 'buc',
  unit_cost_cents bigint not null default 0 check (unit_cost_cents >= 0),
  vendor text,
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ops_material_recipe_items_recipe_fk
    foreign key (organization_id, recipe_id)
    references public.ops_material_recipes(organization_id, id)
    on delete cascade
);

create table if not exists public.sales_material_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  estimate_id uuid not null,
  source_recipe_id uuid,
  source_estimate_item_id uuid,
  description text not null check (char_length(trim(description)) > 0),
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit text not null default 'buc',
  unit_cost_cents bigint not null default 0 check (unit_cost_cents >= 0),
  vendor text,
  status text not null default 'planned'
    check (status in ('planned','ordered','bought')),
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint sales_material_requirements_estimate_fk
    foreign key (organization_id, estimate_id)
    references public.sales_estimates(organization_id, id)
    on delete cascade,
  constraint sales_material_requirements_recipe_fk
    foreign key (organization_id, source_recipe_id)
    references public.ops_material_recipes(organization_id, id)
    on delete set null,
  constraint sales_material_requirements_estimate_item_fk
    foreign key (organization_id, source_estimate_item_id)
    references public.sales_estimate_items(organization_id, id)
    on delete set null
);

create table if not exists public.sales_commercial_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  estimate_id uuid not null,
  client_id uuid,
  task_id uuid,
  document_type text not null check (document_type in ('offer','invoice_draft')),
  reference text not null,
  status text not null default 'draft'
    check (status in ('draft','sent','accepted','issued','paid','cancelled')),
  title text not null,
  currency text not null default 'RON',
  subtotal_cents bigint not null default 0 check (subtotal_cents >= 0),
  discount_cents bigint not null default 0 check (discount_cents >= 0),
  tax_rate numeric(5,2) check (tax_rate is null or (tax_rate >= 0 and tax_rate <= 100)),
  total_cents bigint not null default 0 check (total_cents >= 0),
  snapshot jsonb not null default '{}'::jsonb,
  generated_from_updated_at timestamptz,
  issued_at timestamptz,
  paid_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, reference),
  unique (organization_id, estimate_id, document_type),
  constraint sales_commercial_documents_estimate_fk
    foreign key (organization_id, estimate_id)
    references public.sales_estimates(organization_id, id)
    on delete cascade,
  constraint sales_commercial_documents_client_fk
    foreign key (organization_id, client_id)
    references public.crm_leads(organization_id, id)
    on delete restrict,
  constraint sales_commercial_documents_task_fk
    foreign key (organization_id, task_id)
    references public.ops_tasks(organization_id, id)
    on delete set null
);

create table if not exists public.finance_budget_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  estimate_id uuid not null,
  client_id uuid,
  task_id uuid,
  source_type text not null check (source_type in ('materials','invoice')),
  direction text not null check (direction in ('income','expense')),
  status text not null default 'planned'
    check (status in ('planned','committed','actual')),
  description text not null check (char_length(trim(description)) > 0),
  amount_cents bigint not null default 0 check (amount_cents >= 0),
  currency text not null default 'RON',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, estimate_id, source_type),
  constraint finance_budget_entries_estimate_fk
    foreign key (organization_id, estimate_id)
    references public.sales_estimates(organization_id, id)
    on delete cascade,
  constraint finance_budget_entries_client_fk
    foreign key (organization_id, client_id)
    references public.crm_leads(organization_id, id)
    on delete restrict,
  constraint finance_budget_entries_task_fk
    foreign key (organization_id, task_id)
    references public.ops_tasks(organization_id, id)
    on delete set null
);

create index if not exists ops_material_recipes_org_name_idx
  on public.ops_material_recipes(organization_id, name);
create index if not exists ops_material_recipe_items_org_recipe_idx
  on public.ops_material_recipe_items(organization_id, recipe_id, position);
create index if not exists sales_material_requirements_org_estimate_idx
  on public.sales_material_requirements(organization_id, estimate_id, position, created_at);
create index if not exists sales_commercial_documents_org_estimate_idx
  on public.sales_commercial_documents(organization_id, estimate_id, document_type);
create index if not exists finance_budget_entries_org_estimate_idx
  on public.finance_budget_entries(organization_id, estimate_id, source_type);
create index if not exists finance_budget_entries_org_status_idx
  on public.finance_budget_entries(organization_id, status, direction, updated_at desc);

drop trigger if exists ops_material_recipes_set_updated_at on public.ops_material_recipes;
create trigger ops_material_recipes_set_updated_at
before update on public.ops_material_recipes
for each row execute function public.set_updated_at();

drop trigger if exists ops_material_recipe_items_set_updated_at on public.ops_material_recipe_items;
create trigger ops_material_recipe_items_set_updated_at
before update on public.ops_material_recipe_items
for each row execute function public.set_updated_at();

drop trigger if exists sales_material_requirements_set_updated_at on public.sales_material_requirements;
create trigger sales_material_requirements_set_updated_at
before update on public.sales_material_requirements
for each row execute function public.set_updated_at();

drop trigger if exists sales_commercial_documents_set_updated_at on public.sales_commercial_documents;
create trigger sales_commercial_documents_set_updated_at
before update on public.sales_commercial_documents
for each row execute function public.set_updated_at();

drop trigger if exists finance_budget_entries_set_updated_at on public.finance_budget_entries;
create trigger finance_budget_entries_set_updated_at
before update on public.finance_budget_entries
for each row execute function public.set_updated_at();

alter table public.ops_material_recipes enable row level security;
alter table public.ops_material_recipe_items enable row level security;
alter table public.sales_material_requirements enable row level security;
alter table public.sales_commercial_documents enable row level security;
alter table public.finance_budget_entries enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'ops_material_recipes',
    'ops_material_recipe_items',
    'sales_material_requirements',
    'sales_commercial_documents',
    'finance_budget_entries'
  ] loop
    execute format('drop policy if exists %I on public.%I', tbl || '_select_member', tbl);
    execute format(
      'create policy %I on public.%I for select to authenticated using (private.is_org_member(organization_id))',
      tbl || '_select_member', tbl
    );

    execute format('drop policy if exists %I on public.%I', tbl || '_insert_operator', tbl);
    execute format($p$
      create policy %I on public.%I for insert to authenticated with check (
        private.is_org_member(organization_id) and exists (
          select 1 from public.organization_members m
          where m.organization_id = %I.organization_id
            and m.user_id = (select auth.uid())
            and m.access_status = 'active'
            and m.role in ('owner','admin','manager','member')
        )
      )
    $p$, tbl || '_insert_operator', tbl, tbl);

    execute format('drop policy if exists %I on public.%I', tbl || '_update_operator', tbl);
    execute format($p$
      create policy %I on public.%I for update to authenticated using (
        private.is_org_member(organization_id) and exists (
          select 1 from public.organization_members m
          where m.organization_id = %I.organization_id
            and m.user_id = (select auth.uid())
            and m.access_status = 'active'
            and m.role in ('owner','admin','manager','member')
        )
      ) with check (
        private.is_org_member(organization_id) and exists (
          select 1 from public.organization_members m
          where m.organization_id = %I.organization_id
            and m.user_id = (select auth.uid())
            and m.access_status = 'active'
            and m.role in ('owner','admin','manager','member')
        )
      )
    $p$, tbl || '_update_operator', tbl, tbl, tbl);

    execute format('drop policy if exists %I on public.%I', tbl || '_delete_manager', tbl);
    execute format($p$
      create policy %I on public.%I for delete to authenticated using (
        private.is_org_member(organization_id) and exists (
          select 1 from public.organization_members m
          where m.organization_id = %I.organization_id
            and m.user_id = (select auth.uid())
            and m.access_status = 'active'
            and m.role in ('owner','admin','manager')
        )
      )
    $p$, tbl || '_delete_manager', tbl, tbl);
  end loop;
end $$;

grant select, insert, update, delete on public.ops_material_recipes to authenticated;
grant select, insert, update, delete on public.ops_material_recipe_items to authenticated;
grant select, insert, update, delete on public.sales_material_requirements to authenticated;
grant select, insert, update, delete on public.sales_commercial_documents to authenticated;
grant select, insert, update, delete on public.finance_budget_entries to authenticated;

revoke all on public.ops_material_recipes from anon;
revoke all on public.ops_material_recipe_items from anon;
revoke all on public.sales_material_requirements from anon;
revoke all on public.sales_commercial_documents from anon;
revoke all on public.finance_budget_entries from anon;
