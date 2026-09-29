-- ORBYVEN Alpha 0.7.2 — Finanțe v2 + operational receivables foundation.
-- Applied to production first; this file mirrors exact production migration history.

alter table public.sales_commercial_documents
  add column if not exists due_on date,
  add column if not exists external_reference text;

comment on column public.sales_commercial_documents.due_on
is 'Operational due date tracked by ORBYVEN. This does not issue a fiscal invoice.';
comment on column public.sales_commercial_documents.external_reference
is 'Optional external invoice/reference entered after issuance outside ORBYVEN; ORBYVEN does not mint a fiscal number here.';

create index if not exists sales_commercial_documents_org_due_idx
  on public.sales_commercial_documents(organization_id, due_on, status)
  where document_type = 'invoice_draft' and due_on is not null;

create table if not exists public.finance_income_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  occurred_on date not null default current_date,
  source_type text not null default 'manual' check (source_type in ('invoice','manual')),
  commercial_document_id uuid,
  client_id uuid,
  task_id uuid,
  estimate_id uuid,
  description text not null check (char_length(trim(description)) > 0),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'RON',
  payment_method text check (payment_method is null or payment_method in ('cash','card','bank','other')),
  reference text,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint finance_income_entries_document_fk foreign key (organization_id, commercial_document_id)
    references public.sales_commercial_documents(organization_id, id) on delete set null,
  constraint finance_income_entries_client_fk foreign key (organization_id, client_id)
    references public.crm_leads(organization_id, id) on delete restrict,
  constraint finance_income_entries_task_fk foreign key (organization_id, task_id)
    references public.ops_tasks(organization_id, id) on delete set null,
  constraint finance_income_entries_estimate_fk foreign key (organization_id, estimate_id)
    references public.sales_estimates(organization_id, id) on delete set null,
  constraint finance_income_entries_invoice_source_check check (
    source_type <> 'invoice' or commercial_document_id is not null
  )
);

create index if not exists finance_income_entries_org_date_idx
  on public.finance_income_entries(organization_id, occurred_on desc, created_at desc);
create index if not exists finance_income_entries_org_document_idx
  on public.finance_income_entries(organization_id, commercial_document_id)
  where commercial_document_id is not null;
create index if not exists finance_income_entries_org_task_idx
  on public.finance_income_entries(organization_id, task_id)
  where task_id is not null;

drop trigger if exists finance_income_entries_set_updated_at on public.finance_income_entries;
create trigger finance_income_entries_set_updated_at
before update on public.finance_income_entries
for each row execute function public.set_updated_at();

alter table public.finance_income_entries enable row level security;

drop policy if exists finance_income_entries_select_member on public.finance_income_entries;
create policy finance_income_entries_select_member
on public.finance_income_entries for select to authenticated
using (private.is_org_member(organization_id));

drop policy if exists finance_income_entries_insert_operator on public.finance_income_entries;
create policy finance_income_entries_insert_operator
on public.finance_income_entries for insert to authenticated
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = finance_income_entries.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
);

drop policy if exists finance_income_entries_update_operator on public.finance_income_entries;
create policy finance_income_entries_update_operator
on public.finance_income_entries for update to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = finance_income_entries.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
)
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = finance_income_entries.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
);

drop policy if exists finance_income_entries_delete_manager on public.finance_income_entries;
create policy finance_income_entries_delete_manager
on public.finance_income_entries for delete to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = finance_income_entries.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
);

drop policy if exists finance_income_entries_confidential_access on public.finance_income_entries;
create policy finance_income_entries_confidential_access
on public.finance_income_entries as restrictive for all to authenticated
using (private.can_access_org_finances(organization_id))
with check (private.can_access_org_finances(organization_id));

drop policy if exists finance_income_entries_billing_entitlement_guard on public.finance_income_entries;
create policy finance_income_entries_billing_entitlement_guard
on public.finance_income_entries as restrictive for all to authenticated
using (private.is_billing_module_allowed(organization_id, 'expenses'))
with check (private.is_billing_module_allowed(organization_id, 'expenses'));

grant select, insert, update, delete on public.finance_income_entries to authenticated;
revoke all on public.finance_income_entries from anon;

comment on table public.finance_income_entries
is 'Operational cash-in register. Links receipts to invoice drafts or records manual income; not a fiscal ledger or accounting substitute.';
