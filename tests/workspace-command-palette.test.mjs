import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("existing global record search remains tenant scoped and wildcard safe", () => {
  const source = read("components/WorkspaceSearch.tsx");
  assert.match(source, /\.eq\("organization_id", organizationId\)/);
  assert.match(source, /needle\.replace\(\/\[\\\\%_\]\/g/);
  assert.match(source, /enabledModules\.filter/);
  assert.match(source, /onOpenModule\(hit\.module, \{ recordId: hit\.id \}\)/);
});

test("command contract only exposes enabled modules and preserves create role gates", () => {
  const source = read("lib/workspace-command-palette.ts");
  assert.match(source, /const enabled = new Set\(enabledModules\)/);
  assert.match(source, /ORBYVEN_MODULES\.filter\(\(module\) => enabled\.has\(module\.id\)\)/);
  assert.match(source, /CREATE_ROLES = new Set<WorkspaceCommandRole>/);
  assert.match(source, /FINANCE_CREATE_ROLES = new Set<WorkspaceCommandRole>/);
  assert.match(source, /moduleId !== "expenses" \|\| FINANCE_CREATE_ROLES\.has\(role\)/);
  assert.match(source, /WORKSPACE_CREATE_MODULES\.includes\(moduleId\)/);
});

test("command palette is keyboard first and navigation-only", () => {
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

test("command palette remains isolated from coordinator-owned WorkspaceShell", () => {
  const shell = read("components/WorkspaceShell.tsx");
  assert.doesNotMatch(shell, /WorkspaceCommandPalette/);
  assert.match(shell, /<WorkspaceSearch/);
  assert.match(shell, /WORKSPACE_CREATE_MODULES/);
});
