-- Scheduler/resources RLS cleanup.
-- Preserve the existing read policy and manager write boundary while removing
-- an overlapping permissive SELECT path caused by a FOR ALL policy.

drop policy if exists ops_resource_unavailability_manage_manager
  on public.ops_resource_unavailability;

drop policy if exists ops_resource_unavailability_insert_manager
  on public.ops_resource_unavailability;
create policy ops_resource_unavailability_insert_manager
on public.ops_resource_unavailability
for insert to authenticated
with check (
  private.is_billing_module_allowed(organization_id, 'team')
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = ops_resource_unavailability.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
);

drop policy if exists ops_resource_unavailability_update_manager
  on public.ops_resource_unavailability;
create policy ops_resource_unavailability_update_manager
on public.ops_resource_unavailability
for update to authenticated
using (
  private.is_billing_module_allowed(organization_id, 'team')
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = ops_resource_unavailability.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
)
with check (
  private.is_billing_module_allowed(organization_id, 'team')
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = ops_resource_unavailability.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
);

drop policy if exists ops_resource_unavailability_delete_manager
  on public.ops_resource_unavailability;
create policy ops_resource_unavailability_delete_manager
on public.ops_resource_unavailability
for delete to authenticated
using (
  private.is_billing_module_allowed(organization_id, 'team')
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = ops_resource_unavailability.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
);

comment on table public.ops_resource_unavailability is
  'Resource unavailability windows. SELECT is tenant/module scoped; mutations are restricted to owner/admin/manager with Team entitlement.';
