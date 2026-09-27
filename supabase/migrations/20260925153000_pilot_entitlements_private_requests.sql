-- Gate business modules by explicitly-issued entitlements; no subscription ≠ free access.
-- These four existing Alpha organizations receive a time-limited, non-commercial
-- pilot grant. No future self-service bootstrap automatically receives access.
insert into public.organization_entitlements
  (organization_id,module_id,source,enabled,starts_at,ends_at,metadata)
select pilot.org_id, modules.module_id, 'pilot', true, pg_catalog.now(),
       '2027-06-30T23:59:59Z'::timestamptz,
       '{"grant":"explicit-existing-alpha-pilot","review_before":"2027-06-30"}'::jsonb
from (values
  ('958a6a34-8e21-4275-9074-db75da0de448'::uuid),
  ('9cab8354-02cc-4e8e-8663-260b200873db'::uuid),
  ('8ae5a6cf-1823-411c-9377-3d2c4c04057d'::uuid),
  ('14a01b56-2649-42e5-b34b-43bb3c69b3a9'::uuid)
) as pilot(org_id)
cross join (values
  ('leads'),('tasks'),('calendar'),('estimates'),('documents'),('expenses'),('team')
) as modules(module_id)
where exists (select 1 from public.organizations o where o.id = pilot.org_id)
  and not exists (
    select 1 from public.subscriptions s where s.organization_id = pilot.org_id
  )
on conflict (organization_id,module_id) do nothing;

-- Security definer reads server-owned entitlement snapshots, including timed pilots.
-- A newly bootstrapped no-subscription tenant has no paid/pilot grants.
create or replace function private.is_billing_module_allowed(
  target_org uuid, target_module text
)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select private.is_org_member(target_org)
    and private.has_module_entitlement(target_org, target_module);
$function$;
revoke all on function private.is_billing_module_allowed(uuid,text) from public, anon;
grant execute on function private.is_billing_module_allowed(uuid,text) to authenticated;

