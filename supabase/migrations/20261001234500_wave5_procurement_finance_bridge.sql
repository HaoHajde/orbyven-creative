-- ORBYVEN Wave 5 — Procurement ↔ Finance bridge
-- Supplier spend is linked to Purchase Orders for cashflow/evidence tracking.
-- Task cost keeps inventory consumption as the material cost source, so PO-linked
-- finance expenses are excluded from the task operational-cost rollup.

alter table public.finance_expenses
  add column if not exists purchase_order_id uuid;

alter table public.ops_documents
  add column if not exists purchase_order_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'finance_expenses_purchase_order_fk'
      and conrelid = 'public.finance_expenses'::regclass
  ) then
    alter table public.finance_expenses
      add constraint finance_expenses_purchase_order_fk
      foreign key (organization_id, purchase_order_id)
      references public.ops_purchase_orders(organization_id, id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'ops_documents_purchase_order_fk'
      and conrelid = 'public.ops_documents'::regclass
  ) then
    alter table public.ops_documents
      add constraint ops_documents_purchase_order_fk
      foreign key (organization_id, purchase_order_id)
      references public.ops_purchase_orders(organization_id, id)
      on delete set null;
  end if;
end
$$;

create index if not exists finance_expenses_purchase_order_idx
  on public.finance_expenses(organization_id, purchase_order_id, occurred_on desc)
  where purchase_order_id is not null;

create index if not exists ops_documents_purchase_order_idx
  on public.ops_documents(organization_id, purchase_order_id, created_at desc)
  where purchase_order_id is not null;

create or replace function private.procurement_document_context_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  po_task_id uuid;
  task_client_id uuid;
begin
  if new.purchase_order_id is null then
    return new;
  end if;

  if not private.is_billing_module_allowed(new.organization_id, 'inventory') then
    raise exception 'inventory access denied' using errcode = '42501';
  end if;

  select po.task_id
    into po_task_id
  from public.ops_purchase_orders po
  where po.organization_id = new.organization_id
    and po.id = new.purchase_order_id
    and po.status <> 'cancelled';

  if not found then
    raise exception 'purchase_order_not_available';
  end if;

  if po_task_id is not null then
    if new.task_id is not null and new.task_id <> po_task_id then
      raise exception 'purchase_order_task_mismatch';
    end if;

    select t.client_id
      into task_client_id
    from public.ops_tasks t
    where t.organization_id = new.organization_id
      and t.id = po_task_id;

    if new.client_id is not null
       and task_client_id is not null
       and new.client_id <> task_client_id then
      raise exception 'purchase_order_client_mismatch';
    end if;

    new.task_id := po_task_id;
    new.client_id := coalesce(task_client_id, new.client_id);
  end if;

  return new;
end
$function$;

drop trigger if exists ops_documents_procurement_context_guard
  on public.ops_documents;
create trigger ops_documents_procurement_context_guard
before insert or update of purchase_order_id, task_id, client_id
on public.ops_documents
for each row execute function private.procurement_document_context_guard();

create or replace function private.finance_expense_procurement_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  po_task_id uuid;
  po_supplier_id uuid;
  po_supplier_name text;
  task_client_id uuid;
  document_po_id uuid;
begin
  if new.document_id is not null then
    select d.purchase_order_id
      into document_po_id
    from public.ops_documents d
    where d.organization_id = new.organization_id
      and d.id = new.document_id;

    if new.purchase_order_id is null and document_po_id is not null then
      new.purchase_order_id := document_po_id;
    elsif new.purchase_order_id is not null
       and document_po_id is not null
       and new.purchase_order_id <> document_po_id then
      raise exception 'expense_document_purchase_order_mismatch';
    end if;
  end if;

  if new.purchase_order_id is null then
    return new;
  end if;

  if not private.is_billing_module_allowed(new.organization_id, 'inventory') then
    raise exception 'inventory access denied' using errcode = '42501';
  end if;

  select po.task_id, po.supplier_id
    into po_task_id, po_supplier_id
  from public.ops_purchase_orders po
  where po.organization_id = new.organization_id
    and po.id = new.purchase_order_id
    and po.status in ('ordered','partially_received','received');

  if not found then
    raise exception 'purchase_order_not_finance_ready';
  end if;

  select s.name
    into po_supplier_name
  from public.ops_suppliers s
  where s.organization_id = new.organization_id
    and s.id = po_supplier_id;

  if po_task_id is not null then
    if new.task_id is not null and new.task_id <> po_task_id then
      raise exception 'purchase_order_task_mismatch';
    end if;

    select t.client_id
      into task_client_id
    from public.ops_tasks t
    where t.organization_id = new.organization_id
      and t.id = po_task_id;

    if new.client_id is not null
       and task_client_id is not null
       and new.client_id <> task_client_id then
      raise exception 'purchase_order_client_mismatch';
    end if;

    new.task_id := po_task_id;
    new.client_id := coalesce(task_client_id, new.client_id);
  end if;

  if po_supplier_name is not null then
    new.vendor := po_supplier_name;
  end if;

  return new;
end
$function$;

drop trigger if exists finance_expenses_procurement_guard
  on public.finance_expenses;
create trigger finance_expenses_procurement_guard
before insert or update of purchase_order_id, document_id, task_id, client_id, vendor
on public.finance_expenses
for each row execute function private.finance_expense_procurement_guard();

create or replace view public.ops_purchase_order_finance_status
with (security_invoker = true)
as
with ordered as (
  select
    i.organization_id,
    i.purchase_order_id,
    sum(i.ordered_quantity * i.unit_cost_cents)::bigint as ordered_cents
  from public.ops_purchase_order_items i
  group by i.organization_id, i.purchase_order_id
),
received as (
  select
    p.organization_id,
    p.purchase_order_id,
    sum(p.received_quantity * p.unit_cost_cents)::bigint as received_cents
  from public.ops_purchase_order_item_progress p
  group by p.organization_id, p.purchase_order_id
),
recorded as (
  select
    e.organization_id,
    e.purchase_order_id,
    sum(e.amount_cents)::bigint as recorded_expense_cents,
    count(*)::integer as expense_count
  from public.finance_expenses e
  where e.purchase_order_id is not null
  group by e.organization_id, e.purchase_order_id
),
evidence as (
  select
    d.organization_id,
    d.purchase_order_id,
    count(*)::integer as document_count
  from public.ops_documents d
  where d.purchase_order_id is not null
  group by d.organization_id, d.purchase_order_id
)
select
  po.organization_id,
  po.id as purchase_order_id,
  po.reference,
  po.supplier_id,
  s.name as supplier_name,
  po.task_id,
  t.client_id,
  po.status,
  po.currency,
  po.ordered_on,
  po.expected_on,
  coalesce(o.ordered_cents, 0::bigint) as ordered_cents,
  coalesce(r.received_cents, 0::bigint) as received_cents,
  coalesce(x.recorded_expense_cents, 0::bigint) as recorded_expense_cents,
  coalesce(x.expense_count, 0) as expense_count,
  coalesce(e.document_count, 0) as document_count,
  (
    coalesce(x.recorded_expense_cents, 0::bigint)
    - coalesce(o.ordered_cents, 0::bigint)
  ) as variance_to_order_cents,
  greatest(
    0::bigint,
    coalesce(r.received_cents, 0::bigint)
      - coalesce(x.recorded_expense_cents, 0::bigint)
  ) as received_without_recorded_expense_cents
from public.ops_purchase_orders po
join public.ops_suppliers s
  on s.organization_id = po.organization_id
 and s.id = po.supplier_id
left join public.ops_tasks t
  on t.organization_id = po.organization_id
 and t.id = po.task_id
left join ordered o
  on o.organization_id = po.organization_id
 and o.purchase_order_id = po.id
left join received r
  on r.organization_id = po.organization_id
 and r.purchase_order_id = po.id
left join recorded x
  on x.organization_id = po.organization_id
 and x.purchase_order_id = po.id
left join evidence e
  on e.organization_id = po.organization_id
 and e.purchase_order_id = po.id;

grant select on public.ops_purchase_order_finance_status to authenticated;
revoke all on public.ops_purchase_order_finance_status from anon;

comment on column public.finance_expenses.purchase_order_id is
  'Optional procurement cashflow/evidence link. PO-linked expenses are not material cost in the task dossier; stock consumption is.';
comment on column public.ops_documents.purchase_order_id is
  'Optional supplier-procurement evidence link.';
comment on view public.ops_purchase_order_finance_status is
  'Operational PO bridge: ordered, received and finance-recorded values plus supporting-document count. Not a fiscal ledger.';
