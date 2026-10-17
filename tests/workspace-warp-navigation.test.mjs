import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

function loadPureModule(relativePath) {
  const source = read(relativePath);
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  new Function("exports", compiled.outputText)(exports);
  return exports;
}

test("Workspace warp uses sticky-header offset, retries and smooth viewport scrolling", () => {
  const source = read("lib/workspace-warp.ts");
  assert.match(source, /DEFAULT_OFFSET = 86/);
  assert.match(source, /DEFAULT_ATTEMPTS = 24/);
  assert.match(source, /target\.getBoundingClientRect\(\)\.top \+ window\.scrollY - offset/);
  assert.match(source, /window\.scrollTo/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /fallbackSelector/);
});

test("WorkspaceShell chooses exact navigation target before module fallback", () => {
  const source = read("components/WorkspaceShell.tsx");
  assert.match(source, /navigation\.create/);
  assert.match(source, /data-workspace-create-focus/);
  assert.match(source, /navigation\.recordId/);
  assert.match(source, /data-workspace-record-focus/);
  assert.match(source, /data-workspace-module-focus="true"/);
  assert.match(source, /scheduleWorkspaceWarp/);
});

test("Record focus retries async rendering and internal selection changes also warp", () => {
  const source = read("components/modules/useWorkspaceRecordFocus.ts");
  assert.match(source, /attempts: 32/);
  assert.match(source, /useWorkspaceSelectionWarp/);
  assert.match(source, /selectedRecordId === previousRecordId\.current/);
  assert.match(source, /data-workspace-record-focus/);
});

test("Create surfaces expose a common warp target across core modules", () => {
  for (const path of [
    "components/modules/LeadsModule.tsx",
    "components/modules/TasksModule.tsx",
    "components/modules/EstimatesModule.tsx",
    "components/modules/CalendarModule.tsx",
    "components/modules/DocumentsModule.tsx",
    "components/modules/ExpensesModule.tsx",
  ]) {
    assert.match(read(path), /data-workspace-create-focus/);
  }
});

test("Calendar and Documents receive record navigation intents", () => {
  const content = read("components/WorkspaceContent.tsx");
  assert.match(content, /<CalendarModule[\s\S]*initialRecordId=\{intent\?\.recordId\}/);
  assert.match(content, /<DocumentsModule[^>]*initialRecordId=\{intent\?\.recordId\}/);

  const calendar = read("components/modules/CalendarModule.tsx");
  const documents = read("components/modules/DocumentsModule.tsx");
  assert.match(calendar, /initialRecordId\?: string/);
  assert.match(calendar, /useWorkspaceRecordFocus\(initialRecordId, selectedId, loading\)/);
  assert.match(documents, /initialRecordId\?: string/);
  assert.match(documents, /useWorkspaceRecordFocus\(initialRecordId, focusedDocumentId, loading\)/);
});

test("Global record search remains tenant-scoped before command palette integration", () => {
  const source = read("components/WorkspaceSearch.tsx");
  assert.match(source, /\.eq\("organization_id", organizationId\)/);
  assert.match(source, /needle\.replace/);
  assert.match(source, /enabledModules\.filter/);
  assert.match(source, /onOpenModule\(hit\.module, \{ recordId: hit\.id \}\)/);
});

test("Command palette contract exposes enabled modules and preserves create role gates", () => {
  const source = read("lib/workspace-command-palette.ts");
  assert.match(source, /const enabled = new Set\(enabledModules\)/);
  assert.match(source, /ORBYVEN_MODULES\.filter\(\(module\) => enabled\.has\(module\.id\)\)/);
  assert.match(source, /CREATE_ROLES = new Set<WorkspaceCommandRole>/);
  assert.match(source, /FINANCE_CREATE_ROLES = new Set<WorkspaceCommandRole>/);
  assert.match(source, /moduleId !== "expenses" \|\| FINANCE_CREATE_ROLES\.has\(role\)/);
  assert.match(source, /WORKSPACE_CREATE_MODULES\.includes\(moduleId\)/);
});

test("Command palette is keyboard-first and navigation-only", () => {
  const source = read("components/WorkspaceCommandPalette.tsx");
  assert.match(source, /event\.ctrlKey \|\| event\.metaKey/);
  assert.match(source, /event\.key\.toLowerCase\(\) === "k"/);
  assert.match(source, /event\.key === "ArrowDown"/);
  assert.match(source, /event\.key === "ArrowUp"/);
  assert.match(source, /event\.key === "Enter"/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /item\.kind === "create" \? \{ create: true \} : undefined/);
  assert.doesNotMatch(source, /orbyvenSupabase/);
  assert.doesNotMatch(source, /\.(insert|update|delete|upsert)\s*\(/);
});

test("Command palette stays isolated from coordinator-owned WorkspaceShell", () => {
  const shell = read("components/WorkspaceShell.tsx");
  assert.doesNotMatch(shell, /WorkspaceCommandPalette/);
  assert.match(shell, /<WorkspaceSearch/);
  assert.match(shell, /WORKSPACE_CREATE_MODULES/);
});

test("custom field contract normalizes keys and validates configurable choices", () => {
  const customFields = loadPureModule("lib/workspace-custom-fields.ts");
  assert.equal(customFields.normalizeWorkspaceCustomFieldKey("Serie Șasiu / Client"), "serie_sasiu_client");
  assert.equal(customFields.normalizeWorkspaceCustomFieldKey("123"), "field_123");

  const definition = {
    entityType: "crm_leads",
    fieldKey: "prioritate_client",
    label: "Prioritate client",
    fieldType: "select",
    config: {
      options: [
        { value: "normal", label: "Normal" },
        { value: "vip", label: "VIP" },
      ],
    },
    required: true,
    active: true,
    sortOrder: 0,
  };

  assert.deepEqual(customFields.validateWorkspaceCustomFieldDefinition(definition), { valid: true });
  assert.deepEqual(customFields.validateWorkspaceCustomFieldValue(definition, "vip"), { valid: true });
  assert.equal(customFields.validateWorkspaceCustomFieldValue(definition, "unknown").valid, false);
  assert.equal(customFields.validateWorkspaceCustomFieldValue(definition, null).valid, false);
});

test("custom field multi-select rejects duplicate or undeclared values", () => {
  const customFields = loadPureModule("lib/workspace-custom-fields.ts");
  const definition = {
    fieldType: "multi_select",
    required: false,
    config: {
      options: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
    },
  };

  assert.deepEqual(customFields.validateWorkspaceCustomFieldValue(definition, ["a", "b"]), { valid: true });
  assert.equal(customFields.validateWorkspaceCustomFieldValue(definition, ["a", "a"]).valid, false);
  assert.equal(customFields.validateWorkspaceCustomFieldValue(definition, ["a", "c"]).valid, false);
});

test("custom field mutations retain explicit confirmation contract", () => {
  const customFields = loadPureModule("lib/workspace-custom-fields.ts");
  assert.throws(
    () => customFields.requireWorkspaceCustomFieldMutationConfirmation(false),
    /CUSTOM_FIELD_CONFIRMATION_REQUIRED/,
  );
  assert.doesNotThrow(() => customFields.requireWorkspaceCustomFieldMutationConfirmation(true));
});

test("custom field persistence is tenant scoped, RLS protected and Data API explicit", () => {
  const migration = read("supabase/migrations/20261017144800_universal_custom_fields.sql");
  assert.match(migration, /organization_id uuid not null references public\.organizations\(id\) on delete cascade/);
  assert.match(migration, /foreign key \(organization_id, definition_id, entity_type\)/);
  assert.match(migration, /alter table public\.workspace_custom_field_definitions enable row level security/);
  assert.match(migration, /alter table public\.workspace_custom_field_values enable row level security/);
  assert.match(migration, /private\.is_org_member\(organization_id\)/);
  assert.match(migration, /private\.is_org_admin\(organization_id\)/);
  assert.match(migration, /m\.role in \('owner', 'admin', 'manager', 'member'\)/);
  assert.doesNotMatch(migration, /m\.role in \([^\n]*'viewer'/);
  assert.match(migration, /revoke all on table public\.workspace_custom_field_definitions from anon/);
  assert.match(migration, /grant select, insert, update, delete[\s\S]*to authenticated, service_role/);
});

test("workspace tags normalize beginner-friendly names into stable keys", () => {
  const tags = loadPureModule("lib/workspace-tags.ts");
  assert.equal(tags.normalizeWorkspaceTagKey("Client VIP / Urgent"), "client_vip_urgent");
  assert.equal(tags.normalizeWorkspaceTagKey("123"), "tag_123");
  assert.deepEqual(tags.validateWorkspaceTag({
    tagKey: "client_vip",
    name: "Client VIP",
    color: "#A855F7",
    active: true,
    sortOrder: 0,
  }), { valid: true });
  assert.equal(tags.validateWorkspaceTag({
    tagKey: "client_vip",
    name: "Client VIP",
    color: "purple",
    active: true,
    sortOrder: 0,
  }).valid, false);
});

test("workspace tag assignments stay generic and confirmation-only", () => {
  const tags = loadPureModule("lib/workspace-tags.ts");
  assert.deepEqual(tags.validateWorkspaceTagAssignment({ entityType: "crm_leads", entityId: "record-1" }), { valid: true });
  assert.equal(tags.validateWorkspaceTagAssignment({ entityType: "CRM Leads", entityId: "record-1" }).valid, false);
  assert.throws(() => tags.requireWorkspaceTagMutationConfirmation(false), /WORKSPACE_TAG_CONFIRMATION_REQUIRED/);
  assert.doesNotThrow(() => tags.requireWorkspaceTagMutationConfirmation(true));
});

test("workspace tag persistence is tenant scoped, viewer read-only and Data API explicit", () => {
  const migration = read("supabase/migrations/20261017145400_universal_tags.sql");
  assert.match(migration, /foreign key \(organization_id, tag_id\)/);
  assert.match(migration, /alter table public\.workspace_tags enable row level security/);
  assert.match(migration, /alter table public\.workspace_tag_assignments enable row level security/);
  assert.match(migration, /private\.is_org_member\(organization_id\)/);
  assert.match(migration, /private\.is_org_admin\(organization_id\)/);
  assert.match(migration, /m\.role in \('owner', 'admin', 'manager', 'member'\)/);
  assert.doesNotMatch(migration, /m\.role in \([^\n]*'viewer'/);
  assert.match(migration, /revoke all on table public\.workspace_tags from anon/);
  assert.match(migration, /grant select, insert, update, delete[\s\S]*to authenticated, service_role/);
  assert.match(migration, /grant select, insert, delete[\s\S]*to authenticated, service_role/);
});

test("status presentation registry preserves canonical protected workflow keys", () => {
  const statusPresentation = loadPureModule("lib/workspace-status-presentations.ts");
  assert.deepEqual(
    statusPresentation.getWorkspaceSystemStatuses("crm_leads").map((item) => item.statusKey),
    ["new", "contacted", "qualified", "proposal", "won", "lost"],
  );
  assert.deepEqual(
    statusPresentation.getWorkspaceSystemStatuses("ops_tasks").map((item) => item.statusKey),
    ["planned", "in_progress", "blocked", "done", "cancelled"],
  );
  assert.deepEqual(
    statusPresentation.getWorkspaceSystemStatuses("calendar_events").map((item) => item.statusKey),
    ["scheduled", "completed", "cancelled"],
  );
  assert.deepEqual(
    statusPresentation.getWorkspaceSystemStatuses("sales_estimates").map((item) => item.statusKey),
    ["draft", "sent", "accepted", "rejected", "expired"],
  );
  assert.equal(statusPresentation.getWorkspaceSystemStatus("sales_estimates", "accepted").protected, true);
  assert.equal(statusPresentation.getWorkspaceSystemStatus("sales_estimates", "accepted").defaultLabel, "Acceptată");
});

test("status presentation overrides cannot invent workflow statuses or mutate canonical keys", () => {
  const statusPresentation = loadPureModule("lib/workspace-status-presentations.ts");
  const valid = {
    entityType: "ops_tasks",
    statusKey: "blocked",
    displayLabel: "Necesită atenție",
    color: "#A855F7",
    sortOrder: 9,
  };
  assert.deepEqual(statusPresentation.validateWorkspaceStatusPresentation(valid), { valid: true });
  assert.equal(statusPresentation.validateWorkspaceStatusPresentation({ ...valid, statusKey: "waiting_approval" }).valid, false);

  const resolved = statusPresentation.resolveWorkspaceStatusPresentation("ops_tasks", "blocked", valid);
  assert.equal(resolved.statusKey, "blocked");
  assert.equal(resolved.displayLabel, "Necesită atenție");
  assert.equal(resolved.color, "#A855F7");
  assert.equal(resolved.protected, true);
  assert.equal(resolved.source, "override");

  const fallback = statusPresentation.resolveWorkspaceStatusPresentation("ops_tasks", "blocked", null);
  assert.equal(fallback.statusKey, "blocked");
  assert.equal(fallback.displayLabel, "Blocat");
  assert.equal(fallback.protected, true);
  assert.equal(fallback.source, "system");
  assert.throws(
    () => statusPresentation.resolveWorkspaceStatusPresentation("ops_tasks", "waiting_approval", null),
    /WORKSPACE_STATUS_SYSTEM_KEY_REQUIRED/,
  );
});

test("status presentation mutations remain confirmation-only and transition-neutral", () => {
  const statusPresentation = loadPureModule("lib/workspace-status-presentations.ts");
  assert.throws(
    () => statusPresentation.requireWorkspaceStatusPresentationMutationConfirmation(false),
    /WORKSPACE_STATUS_PRESENTATION_CONFIRMATION_REQUIRED/,
  );
  assert.doesNotThrow(() => statusPresentation.requireWorkspaceStatusPresentationMutationConfirmation(true));

  const source = read("lib/workspace-status-presentations.ts");
  assert.doesNotMatch(source, /orbyvenSupabase/);
  assert.doesNotMatch(source, /generic_status/);
  assert.doesNotMatch(source, /setEstimateStatus|setWorkTaskStatus|setCalendarEventStatus|updateCrmLead/);
});

test("status presentation persistence is closed to system keys and admin-configured only", () => {
  const migration = read("supabase/migrations/20261017153200_status_presentation_metadata.sql");
  assert.match(migration, /entity_type = 'crm_leads'[\s\S]*status_key in \('new', 'contacted', 'qualified', 'proposal', 'won', 'lost'\)/);
  assert.match(migration, /entity_type = 'ops_tasks'[\s\S]*status_key in \('planned', 'in_progress', 'blocked', 'done', 'cancelled'\)/);
  assert.match(migration, /entity_type = 'calendar_events'[\s\S]*status_key in \('scheduled', 'completed', 'cancelled'\)/);
  assert.match(migration, /entity_type = 'sales_estimates'[\s\S]*status_key in \('draft', 'sent', 'accepted', 'rejected', 'expired'\)/);
  assert.match(migration, /unique \(organization_id, entity_type, status_key\)/);
  assert.match(migration, /alter table public\.workspace_status_presentations enable row level security/);
  assert.match(migration, /using \(private\.is_org_member\(organization_id\)\)/);
  assert.match(migration, /with check \(private\.is_org_admin\(organization_id\)\)/);
  assert.match(migration, /using \(private\.is_org_admin\(organization_id\)\)/);
  assert.match(migration, /revoke all on table public\.workspace_status_presentations from anon/);
  assert.match(migration, /grant select, insert, update, delete[\s\S]*to authenticated, service_role/);
  assert.doesNotMatch(migration, /generic_status/);
  assert.doesNotMatch(migration, /\bactive\s+boolean\b/);
});
