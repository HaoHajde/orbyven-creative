import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CLIENT_COOLING_DAYS,
  CLIENT_DORMANT_DAYS,
  evaluateClientLifecycle,
} from "../lib/automation/client-lifecycle.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

const lifecycleBase = {
  id: "client-1",
  name: "Client Demo",
  kind: "client",
  nextFollowUpAt: null,
  convertedAt: "2026-01-01T10:00:00.000Z",
  createdAt: "2026-01-01T10:00:00.000Z",
};

test("Client Lifecycle has explicit cooling and dormant thresholds", () => {
  assert.equal(CLIENT_COOLING_DAYS, 90);
  assert.equal(CLIENT_DORMANT_DAYS, 180);
});

test("Client Lifecycle keeps recent clients active and flags cooling/dormant clients", () => {
  const now = new Date("2026-10-01T10:00:00.000Z");

  const active = evaluateClientLifecycle({
    ...lifecycleBase,
    lastContactAt: "2026-09-15T10:00:00.000Z",
  }, now);
  const cooling = evaluateClientLifecycle({
    ...lifecycleBase,
    lastContactAt: "2026-06-15T10:00:00.000Z",
  }, now);
  const dormant = evaluateClientLifecycle({
    ...lifecycleBase,
    lastContactAt: "2026-02-01T10:00:00.000Z",
  }, now);

  assert.equal(active?.state, "active");
  assert.equal(active?.needsReactivation, false);
  assert.equal(cooling?.state, "cooling");
  assert.equal(cooling?.needsReactivation, true);
  assert.equal(dormant?.state, "dormant");
  assert.equal(dormant?.needsReactivation, true);
});

test("A scheduled or overdue client follow-up suppresses reactivation duplication", () => {
  const now = new Date("2026-10-01T10:00:00.000Z");

  const scheduled = evaluateClientLifecycle({
    ...lifecycleBase,
    lastContactAt: "2026-01-15T10:00:00.000Z",
    nextFollowUpAt: "2026-10-08T10:00:00.000Z",
  }, now);
  const overdue = evaluateClientLifecycle({
    ...lifecycleBase,
    lastContactAt: "2026-01-15T10:00:00.000Z",
    nextFollowUpAt: "2026-09-25T10:00:00.000Z",
  }, now);

  assert.equal(scheduled?.state, "scheduled");
  assert.equal(scheduled?.needsReactivation, false);
  assert.equal(overdue?.state, "overdue");
  assert.equal(overdue?.needsReactivation, false);
});

test("CRM exposes a guarded follow-up scheduler with history rollback", () => {
  const source = read("lib/modules/leads.ts");
  assert.match(source, /export async function scheduleCrmFollowUp/);
  assert.match(source, /select\("next_follow_up_at"\)/);
  assert.match(source, /next_follow_up_at: when\.toISOString\(\)/);
  assert.match(source, /createCrmLeadActivity/);
  assert.match(source, /previous\.next_follow_up_at/);
});

test("Operations client context carries retention follow-up state", () => {
  const source = read("lib/modules/tasks.ts");
  assert.ok(source.includes("next_follow_up_at?: string | null"));
  assert.match(source, /id,name,company,kind,next_follow_up_at/);
});

test("Recurring work clones completed operational context without copying assignee", () => {
  const service = read("lib/modules/tasks.ts");
  const ui = read("components/modules/TasksModule.tsx");
  assert.match(service, /export async function createRecurringWorkFromTask/);
  assert.match(service, /sourceTask\.status !== "done"/);
  assert.match(service, /priority: "normal"/);
  assert.match(service, /ops_task_checklist_items/);
  assert.match(service, /done: false/);
  const recurringHelper = service.match(/createRecurringWorkFromTask[\s\S]*?return created;/)?.[0] ?? "";
  assert.doesNotMatch(recurringHelper, /assignee:/);
  assert.match(ui, /RECURRING_WORK_WINDOWS = \[30, 90, 180, 365\]/);
  assert.match(ui, /Lucrare recurentă/);
  assert.match(ui, /createRecurringWorkFromTask/);
});

test("Completed work exposes ORBYVEN Aftercare with practical retention windows", () => {
  const source = read("components/modules/TasksModule.tsx");
  assert.match(source, /scheduleCrmFollowUp/);
  assert.match(source, /AFTERCARE_WINDOWS = \[7, 30, 90, 180\]/);
  assert.match(source, /ORBYVEN · AFTERCARE/);
  assert.match(source, /selectedTask\.status === "done"/);
  assert.match(source, /În \{days\} zile/);
});

test("Overview includes overdue client retention follow-ups in Next Best Action", () => {
  const data = read("lib/modules/overview.ts");
  const ui = read("components/modules/OverviewModule.tsx");
  assert.match(data, /not\("next_follow_up_at", "is", null\)/);
  assert.ok(data.includes('.or("kind.eq.client,stage.not.in.(won,lost)")'));
  assert.match(ui, /client_retention_follow_up/);
  assert.match(ui, /Revenirea post-vânzare este scadentă/);
  assert.match(ui, /lead\.kind === "client"/);
});

test("CRM metrics count both active lead and existing-client follow-ups", () => {
  const source = read("components/modules/LeadsModule.tsx");
  assert.match(source, /lead\.kind === "client" \|\| !\["won", "lost"\]\.includes\(lead\.stage\)/);
});

test("CRM renders Client Lifecycle and one-click reactivation", () => {
  const source = read("components/modules/LeadsModule.tsx");
  assert.match(source, /ORBYVEN · CLIENT LIFECYCLE/);
  assert.match(source, /Planifică revenire · 7 zile/);
  assert.match(source, /scheduleReactivation/);
  assert.match(source, /last_contact_at: created\.occurred_at/);
});

test("Overview and Activity Center share retention/reactivation semantics", () => {
  const overviewData = read("lib/modules/overview.ts");
  const overviewUi = read("components/modules/OverviewModule.tsx");
  const activity = read("lib/modules/activity.ts");
  assert.match(overviewData, /reactivationBefore/);
  assert.match(overviewData, /staleContactClients/);
  assert.match(overviewData, /neverContactedClients/);
  assert.match(overviewUi, /client_reactivation/);
  assert.match(activity, /client_retention_follow_up/);
  assert.match(activity, /client_reactivation/);
  assert.match(activity, /evaluateClientLifecycle/);
});

test("Next Best Action prioritizes and deduplicates lifecycle signals by client", () => {
  const source = read("lib/automation/next-best-action.ts");
  assert.match(source, /client_retention_follow_up: 12/);
  assert.match(source, /client_reactivation: 14/);
  assert.match(source, /"client_retention_follow_up", "client_reactivation"/);
});
