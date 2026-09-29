-- Finance v2: keep existing commercial documents visible to finance roles even when Estimates is disabled.
drop policy if exists billing_entitlement_guard on public.sales_commercial_documents;
create policy billing_entitlement_guard
on public.sales_commercial_documents
as restrictive
for all
to authenticated
using (
  private.is_billing_module_allowed(organization_id, 'estimates')
  or (
    private.is_billing_module_allowed(organization_id, 'expenses')
    and private.can_access_org_finances(organization_id)
  )
)
with check (
  private.is_billing_module_allowed(organization_id, 'estimates')
  or (
    private.is_billing_module_allowed(organization_id, 'expenses')
    and private.can_access_org_finances(organization_id)
  )
);
