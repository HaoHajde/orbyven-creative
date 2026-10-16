import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/20261015095343_private_trigger_execute_hardening.sql", import.meta.url),
  "utf8",
);

const triggerFunctions = [
  "calendar_event_resource_time_guard",
  "calendar_resource_assignment_guard",
  "finance_expense_procurement_guard",
  "inventory_catalog_settings_guard",
  "inventory_movement_after_insert",
  "inventory_movement_guard",
  "inventory_reservation_outflow_guard",
  "limit_legacy_lead_email",
  "limit_public_project_request_email",
  "procurement_document_context_guard",
  "purchase_order_status_guard",
  "require_verified_mfa_for_platform_staff",
  "resource_state_guard",
  "resource_unavailability_guard",
  "sync_team_member_resource",
];

test("private SECURITY DEFINER trigger handlers are not directly executable", () => {
  for (const functionName of triggerFunctions) {
    assert.match(
      migration,
      new RegExp(
        `revoke execute on function private\\.${functionName}\\(\\) from public, anon, authenticated, service_role;`,
        "i",
      ),
      functionName,
    );
  }
});

test("trigger execute hardening is transactional", () => {
  assert.match(migration, /^begin;/i);
  assert.match(migration, /commit;\s*$/i);
});
