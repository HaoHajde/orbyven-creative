-- Alpha 0.65 pilot entitlement: make thermal available to the same pilot organizations
-- that already have Tasks access. This does NOT enable the module in the workspace.
insert into public.organization_entitlements (
  organization_id,module_id,plan_id,source,enabled,starts_at,ends_at,metadata,updated_at
)
select
  e.organization_id,
  'thermal',
  e.plan_id,
  e.source,
  true,
  e.starts_at,
  e.ends_at,
  coalesce(e.metadata,'{}'::jsonb) || '{"derived_from":"tasks","checkpoint":"alpha-0.65"}'::jsonb,
  now()
from public.organization_entitlements e
where e.module_id='tasks' and e.enabled=true
on conflict (organization_id,module_id) do update
set plan_id=excluded.plan_id,
    source=excluded.source,
    enabled=true,
    starts_at=excluded.starts_at,
    ends_at=excluded.ends_at,
    metadata=public.organization_entitlements.metadata || excluded.metadata,
    updated_at=now();
