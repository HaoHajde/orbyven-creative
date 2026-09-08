-- ORBYVEN portable business modules: estimates, documents, expenses, team.
-- Tenant scoped, RLS protected, and linked to existing CRM / work modules.

create table if not exists public.sales_estimates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reference text not null default ('DEV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  status text not null default 'draft' check (status in ('draft','sent','accepted','rejected','expired')),
  title text not null check (char_length(trim(title)) > 0),
  client_id uuid,
  task_id uuid,
  currency text not null default 'RON',
  subtotal_cents bigint not null default 0 check (subtotal_cents >= 0),
  discount_cents bigint not null default 0 check (discount_cents >= 0),
  tax_rate numeric(5,2) check (tax_rate is null or (tax_rate >= 0 and tax_rate <= 100)),
  total_cents bigint not null default 0 check (total_cents >= 0),
  valid_until date,
  notes text,
  sent_at timestamptz,
  accepted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, reference),
  constraint sales_estimates_client_fk foreign key (organization_id, client_id)
    references public.crm_leads(organization_id, id) on delete restrict,
  constraint sales_estimates_task_fk foreign key (organization_id, task_id)
    references public.ops_tasks(organization_id, id) on delete set null
);

create table if not exists public.sales_estimate_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  estimate_id uuid not null,
  description text not null check (char_length(trim(description)) > 0),
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit_price_cents bigint not null default 0 check (unit_price_cents >= 0),
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_estimate_items_estimate_fk foreign key (organization_id, estimate_id)
    references public.sales_estimates(organization_id, id) on delete cascade
);

create table if not exists public.ops_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  category text not null default 'general' check (category in ('general','estimate','contract','invoice','photo','receipt','other')),
  storage_path text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  client_id uuid,
  task_id uuid,
  estimate_id uuid,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, storage_path),
  constraint ops_documents_client_fk foreign key (organization_id, client_id)
    references public.crm_leads(organization_id, id) on delete restrict,
  constraint ops_documents_task_fk foreign key (organization_id, task_id)
    references public.ops_tasks(organization_id, id) on delete set null,
  constraint ops_documents_estimate_fk foreign key (organization_id, estimate_id)
    references public.sales_estimates(organization_id, id) on delete set null
);

create table if not exists public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  occurred_on date not null default current_date,
  category text not null default 'other',
  vendor text,
  description text not null check (char_length(trim(description)) > 0),
  amount_cents bigint not null check (amount_cents >= 0),
  currency text not null default 'RON',
  payment_method text check (payment_method is null or payment_method in ('cash','card','bank','other')),
  client_id uuid,
  task_id uuid,
  document_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint finance_expenses_client_fk foreign key (organization_id, client_id)
    references public.crm_leads(organization_id, id) on delete restrict,
  constraint finance_expenses_task_fk foreign key (organization_id, task_id)
    references public.ops_tasks(organization_id, id) on delete set null,
  constraint finance_expenses_document_fk foreign key (organization_id, document_id)
    references public.ops_documents(organization_id, id) on delete set null
);

create table if not exists public.people_team_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  linked_user_id uuid,
  display_name text not null check (char_length(trim(display_name)) > 0),
  job_title text,
  email text,
  phone text,
  status text not null default 'active' check (status in ('active','inactive')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint people_team_members_linked_user_fk foreign key (organization_id, linked_user_id)
    references public.organization_members(organization_id, user_id) on delete set null
);

create index if not exists sales_estimates_org_status_idx on public.sales_estimates(organization_id, status, updated_at desc);
create index if not exists sales_estimates_org_client_idx on public.sales_estimates(organization_id, client_id) where client_id is not null;
create index if not exists sales_estimates_org_task_idx on public.sales_estimates(organization_id, task_id) where task_id is not null;
create index if not exists sales_estimate_items_org_estimate_idx on public.sales_estimate_items(organization_id, estimate_id, position, created_at);
create index if not exists ops_documents_org_created_idx on public.ops_documents(organization_id, created_at desc);
create index if not exists ops_documents_org_client_idx on public.ops_documents(organization_id, client_id) where client_id is not null;
create index if not exists ops_documents_org_task_idx on public.ops_documents(organization_id, task_id) where task_id is not null;
create index if not exists finance_expenses_org_date_idx on public.finance_expenses(organization_id, occurred_on desc, created_at desc);
create index if not exists finance_expenses_org_task_idx on public.finance_expenses(organization_id, task_id) where task_id is not null;
create index if not exists people_team_members_org_status_idx on public.people_team_members(organization_id, status, display_name);

drop trigger if exists sales_estimates_set_updated_at on public.sales_estimates;
create trigger sales_estimates_set_updated_at before update on public.sales_estimates
for each row execute function public.set_updated_at();
drop trigger if exists sales_estimate_items_set_updated_at on public.sales_estimate_items;
create trigger sales_estimate_items_set_updated_at before update on public.sales_estimate_items
for each row execute function public.set_updated_at();
drop trigger if exists ops_documents_set_updated_at on public.ops_documents;
create trigger ops_documents_set_updated_at before update on public.ops_documents
for each row execute function public.set_updated_at();
drop trigger if exists finance_expenses_set_updated_at on public.finance_expenses;
create trigger finance_expenses_set_updated_at before update on public.finance_expenses
for each row execute function public.set_updated_at();
drop trigger if exists people_team_members_set_updated_at on public.people_team_members;
create trigger people_team_members_set_updated_at before update on public.people_team_members
for each row execute function public.set_updated_at();

alter table public.sales_estimates enable row level security;
alter table public.sales_estimate_items enable row level security;
alter table public.ops_documents enable row level security;
alter table public.finance_expenses enable row level security;
alter table public.people_team_members enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['sales_estimates','sales_estimate_items','ops_documents','finance_expenses','people_team_members'] loop
    execute format('drop policy if exists %I on public.%I', tbl || '_select_member', tbl);
    execute format('create policy %I on public.%I for select to authenticated using (private.is_org_member(organization_id))', tbl || '_select_member', tbl);

    execute format('drop policy if exists %I on public.%I', tbl || '_insert_operator', tbl);
    execute format($p$create policy %I on public.%I for insert to authenticated with check (
      private.is_org_member(organization_id) and exists (
        select 1 from public.organization_members m
        where m.organization_id = %I.organization_id
          and m.user_id = (select auth.uid())
          and m.access_status = 'active'
          and m.role in ('owner','admin','manager','member')
      )
    )$p$, tbl || '_insert_operator', tbl, tbl);

    execute format('drop policy if exists %I on public.%I', tbl || '_update_operator', tbl);
    execute format($p$create policy %I on public.%I for update to authenticated using (
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
    )$p$, tbl || '_update_operator', tbl, tbl, tbl);

    execute format('drop policy if exists %I on public.%I', tbl || '_delete_manager', tbl);
    execute format($p$create policy %I on public.%I for delete to authenticated using (
      private.is_org_member(organization_id) and exists (
        select 1 from public.organization_members m
        where m.organization_id = %I.organization_id
          and m.user_id = (select auth.uid())
          and m.access_status = 'active'
          and m.role in ('owner','admin','manager')
      )
    )$p$, tbl || '_delete_manager', tbl, tbl);
  end loop;
end $$;

grant select, insert, update, delete on public.sales_estimates to authenticated;
grant select, insert, update, delete on public.sales_estimate_items to authenticated;
grant select, insert, update, delete on public.ops_documents to authenticated;
grant select, insert, update, delete on public.finance_expenses to authenticated;
grant select, insert, update, delete on public.people_team_members to authenticated;
revoke all on public.sales_estimates from anon;
revoke all on public.sales_estimate_items from anon;
revoke all on public.ops_documents from anon;
revoke all on public.finance_expenses from anon;
revoke all on public.people_team_members from anon;

insert into storage.buckets (id, name, public, file_size_limit)
values ('orbyven-documents', 'orbyven-documents', false, 20971520)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists "orbyven_documents_storage_select" on storage.objects;
create policy "orbyven_documents_storage_select"
on storage.objects for select to authenticated
using (
  bucket_id = 'orbyven-documents'
  and exists (
    select 1 from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id::text = (storage.foldername(name))[1]
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and o.lifecycle_status = 'active'
  )
);

drop policy if exists "orbyven_documents_storage_insert" on storage.objects;
create policy "orbyven_documents_storage_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'orbyven-documents'
  and exists (
    select 1 from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id::text = (storage.foldername(name))[1]
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
      and o.lifecycle_status = 'active'
  )
);

drop policy if exists "orbyven_documents_storage_update" on storage.objects;
create policy "orbyven_documents_storage_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'orbyven-documents'
  and exists (
    select 1 from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id::text = (storage.foldername(name))[1]
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
      and o.lifecycle_status = 'active'
  )
)
with check (
  bucket_id = 'orbyven-documents'
  and exists (
    select 1 from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id::text = (storage.foldername(name))[1]
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
      and o.lifecycle_status = 'active'
  )
);

drop policy if exists "orbyven_documents_storage_delete" on storage.objects;
create policy "orbyven_documents_storage_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'orbyven-documents'
  and exists (
    select 1 from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id::text = (storage.foldername(name))[1]
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
      and o.lifecycle_status = 'active'
  )
);