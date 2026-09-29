-- Finance v2: only finance-authorized roles may enter invoice issuance/payment state.
create or replace function private.guard_commercial_invoice_finance_changes()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.document_type = 'invoice_draft' then
    if tg_op = 'INSERT' then
      if new.status in ('issued','paid')
         or new.issued_at is not null
         or new.paid_at is not null
         or new.due_on is not null
         or new.external_reference is not null then
        if not private.can_access_org_finances(new.organization_id) then
          raise exception 'finance role required for invoice issuance/payment fields'
            using errcode = '42501';
        end if;
      end if;
    elsif tg_op = 'UPDATE' then
      if (new.status is distinct from old.status and new.status in ('issued','paid'))
         or new.issued_at is distinct from old.issued_at
         or new.paid_at is distinct from old.paid_at
         or new.due_on is distinct from old.due_on
         or new.external_reference is distinct from old.external_reference then
        if not private.can_access_org_finances(new.organization_id) then
          raise exception 'finance role required for invoice issuance/payment fields'
            using errcode = '42501';
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function private.guard_commercial_invoice_finance_changes() from public, anon, authenticated;

drop trigger if exists sales_commercial_documents_finance_guard on public.sales_commercial_documents;
create trigger sales_commercial_documents_finance_guard
before insert or update on public.sales_commercial_documents
for each row execute function private.guard_commercial_invoice_finance_changes();
