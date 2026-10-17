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

test("reusable template keys normalize predictably and task payloads exclude contextual state", () => {
  const templates = loadPureModule("lib/workspace-reusable-templates.ts");
  assert.equal(templates.normalizeWorkspaceReusableTemplateKey("Revizie / Montaj Premium"), "revizie_montaj_premium");
  assert.equal(templates.normalizeWorkspaceReusableTemplateKey("123"), "template_123");

  const taskPayload = {
    title: "Montaj centrală",
    kind: "work",
    priority: "high",
    description: "Checklist-ul operațional se completează în lucrare.",
    location: "București",
    estimatedMinutes: 240,
  };
  assert.deepEqual(templates.validateWorkspaceReusableTemplatePayload("ops_tasks", taskPayload), { valid: true });
  for (const forbidden of ["clientId", "taskId", "status", "assignee", "scheduledAt", "dueAt", "organizationId"]) {
    assert.equal(
      templates.validateWorkspaceReusableTemplatePayload("ops_tasks", { ...taskPayload, [forbidden]: "unsafe" }).valid,
      false,
      `${forbidden} must remain contextual rather than templated`,
    );
  }
});

test("calendar templates keep relative duration and reject absolute or linked scheduling context", () => {
  const templates = loadPureModule("lib/workspace-reusable-templates.ts");
  const calendarPayload = {
    title: "Revizie periodică",
    eventType: "appointment",
    allDay: false,
    durationMinutes: 90,
    location: "La client",
    notes: "Confirmă accesul înainte de plecare.",
    reminderMinutes: 60,
  };
  assert.deepEqual(templates.validateWorkspaceReusableTemplatePayload("calendar_events", calendarPayload), { valid: true });
  for (const forbidden of ["startAt", "endAt", "clientId", "taskId", "assignee", "resourceIds", "status"]) {
    assert.equal(
      templates.validateWorkspaceReusableTemplatePayload("calendar_events", { ...calendarPayload, [forbidden]: "unsafe" }).valid,
      false,
    );
  }
});

test("estimate templates deep-copy reusable commercial lines without revision or customer links", () => {
  const templates = loadPureModule("lib/workspace-reusable-templates.ts");
  const estimatePayload = {
    title: "Încălzire în pardoseală",
    currency: "RON",
    discountLei: 0,
    taxRate: 21,
    plannedLaborLei: 1500,
    otherCostLei: 250,
    items: [
      { description: "Montaj / m²", quantity: 80, unitPriceLei: 75 },
      { description: "Probă instalație", quantity: 1, unitPriceLei: 350 },
    ],
  };
  assert.deepEqual(templates.validateWorkspaceReusableTemplatePayload("sales_estimates", estimatePayload), { valid: true });
  for (const forbidden of ["clientId", "taskId", "status", "sourceEstimateId", "validUntil", "organizationId"]) {
    assert.equal(
      templates.validateWorkspaceReusableTemplatePayload("sales_estimates", { ...estimatePayload, [forbidden]: "unsafe" }).valid,
      false,
    );
  }

  const prefill = templates.materializeWorkspaceReusableTemplatePrefill("sales_estimates", estimatePayload);
  assert.deepEqual(prefill, estimatePayload);
  assert.notEqual(prefill, estimatePayload);
  assert.notEqual(prefill.items, estimatePayload.items);
  assert.notEqual(prefill.items[0], estimatePayload.items[0]);
});

test("template library mutations are confirmation-only and the pure contract has no persistence authority", () => {
  const templates = loadPureModule("lib/workspace-reusable-templates.ts");
  assert.throws(
    () => templates.requireWorkspaceReusableTemplateMutationConfirmation(false),
    /WORKSPACE_TEMPLATE_CONFIRMATION_REQUIRED/,
  );
  assert.doesNotThrow(() => templates.requireWorkspaceReusableTemplateMutationConfirmation(true));

  const source = read("lib/workspace-reusable-templates.ts");
  assert.doesNotMatch(source, /orbyvenSupabase/);
  assert.doesNotMatch(source, /\.(insert|update|delete|upsert)\s*\(/);
  assert.doesNotMatch(source, /createWorkTask|createCalendarEvent|createEstimate/);
});

test("template persistence is tenant-scoped, fail-closed, viewer read-only and Data API explicit", () => {
  const migration = read("supabase/migrations/20261017160500_reusable_create_templates.sql");
  assert.match(migration, /entity_type in \('ops_tasks', 'calendar_events', 'sales_estimates'\)/);
  assert.match(migration, /private\.is_valid_workspace_reusable_template_payload\(entity_type, payload\)/);
  assert.match(migration, /jsonb_object_keys\(template_payload\)/);
  assert.match(migration, /jsonb_array_elements\(template_payload -> 'items'\)/);
  assert.match(migration, /pg_column_size\(template_payload\) > 32768/);
  assert.match(migration, /m\.role in \('owner', 'admin', 'manager', 'member'\)/);
  assert.doesNotMatch(migration, /m\.role in \([^\n]*'viewer'/);
  assert.match(migration, /alter table public\.workspace_reusable_templates enable row level security/);
  assert.match(migration, /private\.is_org_member\(organization_id\)/);
  assert.match(migration, /revoke all on table public\.workspace_reusable_templates from anon/);
  assert.match(migration, /grant select, insert, update, delete[\s\S]*to authenticated, service_role/);

  for (const contextual of ["clientId", "taskId", "status", "assignee", "startAt", "endAt", "sourceEstimateId", "organizationId"]) {
    assert.doesNotMatch(migration, new RegExp(`'${contextual}'`));
  }
});
