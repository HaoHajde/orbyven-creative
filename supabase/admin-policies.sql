-- Legacy instructions are intentionally fail-closed.
-- Internal staff members use the authenticated /api/admin/leads server endpoint.
-- Do not grant lead SELECT/UPDATE directly to every authenticated tenant.
drop policy if exists "Authenticated admins can read ORBITA leads" on public.leads;
drop policy if exists "Authenticated admins can update ORBITA lead status" on public.leads;
revoke select, update on public.leads from authenticated;
