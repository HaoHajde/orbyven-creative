import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const editor=fs.readFileSync(new URL("../public/thermal-planner/index.html",import.meta.url),"utf8");
const thermalModule=fs.readFileSync(new URL("../components/modules/ThermalSketchPanel.tsx",import.meta.url),"utf8");
const tasks=fs.readFileSync(new URL("../components/modules/TasksModule.tsx",import.meta.url),"utf8");
const migration=fs.readFileSync(new URL("../supabase/migrations/20260927202000_alpha065_thermal_sketches.sql",import.meta.url),"utf8");
test("Alpha 0.65 live canvas retains existing smart wall and pipe behavior",()=>{
  for(const token of ["wallIntervals(","wallExteriorSegments(","chooseElbow(","insertJunction(","routeDraft","renderGhost(","hydrateSmartState(","openings","components","routes","zones"])
    assert.ok(editor.includes(token),token);
});
test("Alpha 0.65 live canvas starts empty, contains no browser-only persistence and isolates bridge",()=>{
  assert.ok(editor.includes("let state=empty();"));
  assert.ok(editor.includes("kind:\"ready\""));
  assert.ok(editor.includes("kind:\"save\""));
  assert.ok(editor.includes("kind:\"load\""));
  assert.ok(!editor.includes("localStorage."));
  assert.ok(!editor.includes("Date fictive. Schița"));
  assert.ok(editor.includes("Schiță orientativă"));
  assert.ok(thermalModule.includes('sandbox="allow-scripts allow-downloads"'));
  assert.ok(!thermalModule.includes("allow-same-origin"));
});
test("Alpha 0.65 is only reachable from work task, tenant-scoped in DB",()=>{
  assert.ok(tasks.includes('selectedTask.kind === "work"'));
  assert.ok(tasks.includes('taskId={thermalTaskId}'));
  assert.ok(migration.includes("foreign key (organization_id,task_id)"));
  assert.ok(migration.includes("private.is_org_member(organization_id)"));
  assert.ok(migration.includes("private.is_billing_module_allowed(organization_id,'tasks')"));
  assert.ok(thermalModule.includes('.eq("revision",revision.current)'));
  assert.ok(thermalModule.includes('event.origin!=="null"'));
});
