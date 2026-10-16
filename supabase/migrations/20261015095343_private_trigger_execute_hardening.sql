begin;

-- Trigger handlers are invoked by PostgreSQL through their triggers and should
-- not be callable as ordinary SECURITY DEFINER routines. Removing EXECUTE from
-- client/runtime roles narrows the privileged-function surface without changing
-- trigger behavior.
revoke execute on function private.calendar_event_resource_time_guard() from public, anon, authenticated, service_role;
revoke execute on function private.calendar_resource_assignment_guard() from public, anon, authenticated, service_role;
revoke execute on function private.finance_expense_procurement_guard() from public, anon, authenticated, service_role;
revoke execute on function private.inventory_catalog_settings_guard() from public, anon, authenticated, service_role;
revoke execute on function private.inventory_movement_after_insert() from public, anon, authenticated, service_role;
revoke execute on function private.inventory_movement_guard() from public, anon, authenticated, service_role;
revoke execute on function private.inventory_reservation_outflow_guard() from public, anon, authenticated, service_role;
revoke execute on function private.limit_legacy_lead_email() from public, anon, authenticated, service_role;
revoke execute on function private.limit_public_project_request_email() from public, anon, authenticated, service_role;
revoke execute on function private.procurement_document_context_guard() from public, anon, authenticated, service_role;
revoke execute on function private.purchase_order_status_guard() from public, anon, authenticated, service_role;
revoke execute on function private.require_verified_mfa_for_platform_staff() from public, anon, authenticated, service_role;
revoke execute on function private.resource_state_guard() from public, anon, authenticated, service_role;
revoke execute on function private.resource_unavailability_guard() from public, anon, authenticated, service_role;
revoke execute on function private.sync_team_member_resource() from public, anon, authenticated, service_role;

commit;
