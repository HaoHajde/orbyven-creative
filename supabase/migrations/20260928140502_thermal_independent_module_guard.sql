-- Alpha 0.65 modularization: hiding the thermal module also blocks its data plane.
-- Existing sketches remain stored and become visible again if the module is re-enabled.
drop policy if exists thermal_workspace_module_guard on public.thermal_sketches;
create policy thermal_workspace_module_guard
  on public.thermal_sketches
  as restrictive
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.organization_modules om
      where om.organization_id = thermal_sketches.organization_id
        and om.module_id = 'thermal'
        and om.enabled = true
    )
  )
  with check (
    exists (
      select 1
      from public.organization_modules om
      where om.organization_id = thermal_sketches.organization_id
        and om.module_id = 'thermal'
        and om.enabled = true
    )
  );
