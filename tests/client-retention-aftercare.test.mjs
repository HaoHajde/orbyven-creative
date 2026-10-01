import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

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
  assert.match(source, /next_follow_up_at\\?: string \\| null/);
  assert.match(source, /id,name,company,kind,next_follow_up_at/);
});

test("Completed work exposes ORBYVEN Aftercare with practical retention windows", () => {
  const source = read("components/modules/TasksModule.tsx");
  assert.match(source, /scheduleCrmFollowUp/);
  assert.match(source, /AFTERCARE_WINDOWS = \[7, 30, 90, 180\]/);
  assert.match(source, /ORBYVEN · AFTERCARE/);
  assert.match(source, /selectedTask\.status === "done"/);
  assert.match(source, /Revenire în \{days\} zile/);
});

test("Overview includes overdue client retention follow-ups in Next Best Action", () => {
  const data = read("lib/modules/overview.ts");
  const ui = read("components/modules/OverviewModule.tsx");
  assert.match(data, /not\("next_follow_up_at", "is", null\)/);
  assert.match(data, /or\\("kind\\.eq\\.client,stage\\.not\\.in\\.\\(won,lost\\)"/);
  assert.match(ui, /client_retention_follow_up/);
  assert.match(ui, /Revenirea post-vânzare este scadentă/);
  assert.match(ui, /lead\.kind === "client"/);
});

test("CRM metrics count both active lead and existing-client follow-ups", () => {
  const source = read("components/modules/LeadsModule.tsx");
  assert.match(source, /lead\.kind === "client" \|\| !\["won", "lost"\]\.includes\(lead\.stage\)/);
});
