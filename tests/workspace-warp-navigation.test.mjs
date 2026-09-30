import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("Workspace warp uses sticky-header offset, retries and smooth viewport scrolling", () => {
  const source = read("lib/workspace-warp.ts");
  assert.match(source, /DEFAULT_OFFSET = 86/);
  assert.match(source, /DEFAULT_ATTEMPTS = 24/);
  assert.match(source, /target\.getBoundingClientRect\(\)\.top \+ window\.scrollY - offset/);
  assert.match(source, /window\.scrollTo/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /fallbackSelector/);
});

test("ClientWorkspace chooses exact navigation target before module fallback", () => {
  const source = read("components/ClientWorkspace.tsx");
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
