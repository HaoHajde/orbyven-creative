import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");
const editor=read("public/thermal-planner/index.html");
const panel=read("components/modules/ThermalSketchPanel.tsx");
const thermalModule=read("components/modules/ThermalPlannerModule.tsx");
const tasks=read("components/modules/TasksModule.tsx");
const registry=read("lib/orbyven-modules.ts");
const workspace=read("components/WorkspaceContent.tsx");
const client=read("components/ClientWorkspace.tsx");
const baseMigration=read("supabase/migrations/20260927173520_alpha065_thermal_sketches.sql");
const moduleGuard=read("supabase/migrations/20260928140502_thermal_independent_module_guard.sql");
const pilotEntitlement=read("supabase/migrations/20260928142037_thermal_pilot_entitlement.sql");

test("Alpha 0.65 canvas retains smart wall, snap and pipe-network behavior",()=>{
  for(const token of ["wallIntervals(","wallExteriorSegments(","chooseElbow(","insertJunction(","routeDraft","renderGhost(","hydrateSmartState(","openings","components","routes","zones"])
    assert.ok(editor.includes(token),token);
});

test("thermal editor remains isolated and saves work-scoped state",()=>{
  assert.ok(editor.includes("let state=empty();"));
  assert.ok(editor.includes("kind:\"ready\""));
  assert.ok(editor.includes("kind:\"save\""));
  assert.ok(editor.includes('payload.kind!=="load"'));
  assert.ok(!editor.includes("localStorage."));
  assert.ok(panel.includes('sandbox="allow-scripts allow-downloads"'));
  assert.ok(!panel.includes("allow-same-origin"));
  assert.ok(panel.includes('.eq("revision",revision.current)'));
  assert.ok(panel.includes('event.origin!=="null"'));
  assert.ok(baseMigration.includes("foreign key (organization_id,task_id)"));
});

test("thermal planner is an independent optional workspace module, not a Tasks action",()=>{
  assert.ok(registry.includes('| "thermal"'));
  assert.ok(registry.includes('id: "thermal"'));
  assert.ok(registry.includes('category: "specialized"'));
  assert.ok(workspace.includes('activeModule === "thermal"'));
  assert.ok(workspace.includes('import("@/components/modules/ThermalPlannerModule")'));
  assert.ok(uiContract.includes('{ label: "SPECIALIZATE", ids: ["thermal"] }'));
  assert.match(client, /WORKSPACE_UI_CONTRACT\.navigationGroups/);
  assert.ok(thermalModule.includes('listWorkTasks(organizationId)'));
  assert.ok(thermalModule.includes('task.kind==="work"'));
  assert.ok(!tasks.includes("ThermalSketchPanel"));
  assert.ok(!tasks.includes("Planșă termică 0.65"));
});

test("removing the module blocks its data but preserves sketches",()=>{
  assert.ok(moduleGuard.includes("as restrictive"));
  assert.ok(moduleGuard.includes("public.organization_modules"));
  assert.ok(moduleGuard.includes("om.module_id = 'thermal'"));
  assert.ok(moduleGuard.includes("om.enabled = true"));
  assert.ok(!moduleGuard.match(/delete\s+from\s+public\.thermal_sketches/i));
  assert.ok(baseMigration.includes("private.is_org_member(organization_id)"));
  assert.ok(baseMigration.includes("private.is_billing_module_allowed(organization_id,'tasks')"));
});

test("pilot organizations can add thermal without auto-enabling it",()=>{
  assert.ok(pilotEntitlement.includes("'thermal'"));
  assert.ok(pilotEntitlement.includes("where e.module_id='tasks'"));
  assert.ok(pilotEntitlement.includes("on conflict (organization_id,module_id)"));
  assert.ok(!pilotEntitlement.includes("organization_modules"));
});
