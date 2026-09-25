-- Enforce paid-module access in Postgres, not only in NEXT_PUBLIC client flags.
-- Existing alpha/demo organizations have no subscriptions and remain available.
-- Once billing inserts any subscription for an organization, module data is
-- tenant-visible/writable only while its server-managed entitlement is valid.
create or replace function private.is_billing_module_allowed(
  target_org uuid, target_module text
)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select private.is_org_member(target_org)
    and (
      not exists (
        select 1 from public.subscriptions s
        where s.organization_id = target_org
      )
      or private.has_module_entitlement(target_org, target_module)
    );
$function$;
revoke all on function private.is_billing_module_allowed(uuid,text) from public, anon;
grant execute on function private.is_billing_module_allowed(uuid,text) to authenticated;

-- Restrictive policies are combined with existing role-specific tenant policies
-- through AND. Never substitute a permissive entitlement policy for tenant RLS.
do $function$
declare
  mapping record;
begin
  for mapping in
    select * from (values
      ('crm_leads','leads'),
      ('crm_lead_activities','leads'),
      ('ops_tasks','tasks'),
      ('ops_task_checklist_items','tasks'),
      ('calendar_events','calendar'),
      ('sales_estimates','estimates'),
      ('sales_estimate_items','estimates'),
      ('sales_material_requirements','estimates'),
      ('sales_commercial_documents','estimates'),
      ('ops_material_recipes','estimates'),
      ('ops_material_recipe_items','estimates'),
      ('ops_documents','documents'),
      ('finance_expenses','expenses'),
      ('finance_budget_entries','expenses'),
      ('people_team_members','team')
    ) as x(table_name,module_id)
  loop
    if to_regclass(format('public.%I',mapping.table_name)) is null then
      raise exception 'Missing billed module table %', mapping.table_name;
    end if;
    execute format('drop policy if exists billing_entitlement_guard on public.%I', mapping.table_name);
    execute format(
      'create policy billing_entitlement_guard on public.%I as restrictive for all to authenticated using (private.is_billing_module_allowed(organization_id, %L)) with check (private.is_billing_module_allowed(organization_id, %L))',
      mapping.table_name, mapping.module_id, mapping.module_id
    );
  end loop;
end;
$function$;

drop policy if exists billing_module_insert_guard on public.organization_modules;
create policy billing_module_insert_guard on public.organization_modules
as restrictive for insert to authenticated
with check (private.is_billing_module_allowed(organization_id,module_id));
drop policy if exists billing_module_update_guard on public.organization_modules;
create policy billing_module_update_guard on public.organization_modules
as restrictive for update to authenticated
using (private.is_billing_module_allowed(organization_id,module_id))
with check (private.is_billing_module_allowed(organization_id,module_id));
