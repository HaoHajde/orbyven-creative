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
