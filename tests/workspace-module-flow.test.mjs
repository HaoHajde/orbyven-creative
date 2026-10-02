import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("workspace module flow exposes the core cross-module business path", () => {
  const flow = read("lib/workspace-module-flow.ts");
  assert.match(flow, /leads:[\s\S]*next: \["tasks", "estimates", "calendar"\]/);
  assert.match(flow, /tasks:[\s\S]*next: \["calendar", "inventory", "documents", "expenses"\]/);
  assert.match(flow, /estimates:[\s\S]*next: \["tasks", "inventory", "expenses"\]/);
  assert.match(flow, /inventory:[\s\S]*next: \["tasks", "documents", "expenses"\]/);
  assert.match(flow, /expenses:[\s\S]*related: \["leads", "tasks", "estimates", "inventory", "documents"\]/);
});

test("module guide stays compact and hides advanced connections behind one control", () => {
  const guide = read("components/WorkspaceModuleGuide.tsx");
  assert.match(guide, /activeModule === "overview"/);
  assert.match(guide, /\+ \{flow\.createLabel\}/);
  assert.match(guide, /Continuă · \{nextModule\.shortName\}/);
  assert.match(guide, /<details className="relative">/);
  assert.match(guide, /flow\.related\.slice\(0, 6\)/);
  assert.doesNotMatch(guide, /grid-cols-[4-9]/);
});

test("workspace content mounts the guide once around the active module", () => {
  const content = read("components/WorkspaceContent.tsx");
  assert.match(content, /WorkspaceModuleGuide/);
  assert.match(content, /activeModule=\{activeModule\}/);
  assert.match(content, /enabledModules=\{enabledModules\}/);
  assert.match(content, /onOpenModule=\{onOpenModule\}/);
});

test("cross-module navigation preserves the business context instead of forcing reselection", () => {
  const flow = read("lib/workspace-module-flow.ts");
  assert.match(flow, /getWorkspaceTargetOptions/);
  assert.match(flow, /target === "tasks"[\s\S]*recordId: context\.taskId[\s\S]*clientId: context\.clientId[\s\S]*estimateId: context\.estimateId/);
  assert.match(flow, /target === "expenses"[\s\S]*purchaseOrderId: context\.purchaseOrderId/);
  assert.match(flow, /if \(extra\.create\) delete result\.recordId/);

  const guide = read("components/WorkspaceModuleGuide.tsx");
  assert.match(guide, /getWorkspaceTargetOptions\(moduleId, liveContext, extra\)/);
  assert.match(guide, /navigation\.module === activeModule/);
  assert.match(guide, /setLiveContext\(navigationContext\)/);
});

test("active records publish live context for beginner-friendly cross-module continuity", () => {
  const hook = read("components/modules/useWorkspaceLiveContext.ts");
  assert.match(hook, /WORKSPACE_LIVE_CONTEXT_EVENT/);
  assert.match(hook, /clientId: context\.clientId/);
  assert.match(hook, /taskId: context\.taskId/);
  assert.match(hook, /estimateId: context\.estimateId/);
  assert.match(hook, /purchaseOrderId: context\.purchaseOrderId/);

  for (const path of [
    "components/modules/LeadsModule.tsx",
    "components/modules/TasksModule.tsx",
    "components/modules/EstimatesModule.tsx",
    "components/modules/CalendarModule.tsx",
    "components/modules/DocumentsModule.tsx",
    "components/modules/InventoryModule.tsx",
    "components/modules/ExpensesModule.tsx",
    "components/modules/ThermalPlannerModule.tsx",
  ]) {
    assert.match(read(path), /useWorkspaceLiveContext/);
  }

  const guide = read("components/WorkspaceModuleGuide.tsx");
  assert.match(guide, /window\.addEventListener\(WORKSPACE_LIVE_CONTEXT_EVENT/);
  assert.match(guide, /getWorkspaceTargetOptions\(moduleId, liveContext, extra\)/);
});

test("shared module kit is visually compact without shrinking body readability", () => {
  const kit = read("components/modules/ModuleKit.tsx");
  assert.match(kit, /sm:text-\[36px\]/);
  assert.match(kit, /text-\[13px\] leading-5/);
  assert.match(kit, /rounded-\[14px\][\s\S]*p-3\.5/);
  assert.doesNotMatch(kit, /sm:text-\[44px\]/);
});

test("operational modules keep task and procurement context alive across navigation", () => {
  const documents = read("components/modules/DocumentsModule.tsx");
  assert.match(documents, /taskId: taskId \|\| scopeTaskId \|\| undefined/);
  assert.match(documents, /purchaseOrderId: purchaseOrderId \|\| undefined/);

  const inventory = read("components/modules/InventoryModule.tsx");
  assert.match(inventory, /taskId: planTaskId \|\| purchaseTaskId \|\| movementTaskId \|\| undefined/);

  const finance = read("components/modules/ExpensesModule.tsx");
  assert.match(finance, /taskId: scopeTaskId \|\| expenseForm\.taskId \|\| incomeForm\.taskId \|\| undefined/);
  assert.match(finance, /purchaseOrderId: expenseForm\.purchaseOrderId \|\| initialPurchaseOrderId/);

  const thermal = read("components/modules/ThermalPlannerModule.tsx");
  assert.match(thermal, /taskId:selected\?\.id/);
  assert.match(thermal, /clientId:selected\?\.client_id\?\?undefined/);
});


test("progressive disclosure keeps the default module surfaces focused", () => {
  const kit = read("components/modules/ModuleKit.tsx");
  assert.match(kit, /export function ModuleProgressiveMetrics/);
  assert.match(kit, /Mai multe informații/);
  assert.match(kit, /export function ModuleAdvancedFields/);
  assert.match(kit, /Mai multe detalii/);
  assert.match(kit, /export function ModuleNextAction/);

  for (const path of [
    "components/modules/LeadsModule.tsx",
    "components/modules/TasksModule.tsx",
    "components/modules/CalendarModule.tsx",
    "components/modules/EstimatesModule.tsx",
    "components/modules/ExpensesModule.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /ModuleProgressiveMetrics/);
    assert.match(source, /ModuleAdvancedFields/);
    assert.doesNotMatch(source, /<\/ModuleAdvancedFields>\/div>/);
  }

  assert.match(read("components/modules/InventoryModule.tsx"), /ModuleProgressiveMetrics/);
});

test("core modules expose one contextual next action while secondary actions stay collapsible", () => {
  const leads = read("components/modules/LeadsModule.tsx");
  const tasks = read("components/modules/TasksModule.tsx");
  const estimates = read("components/modules/EstimatesModule.tsx");
  const calendar = read("components/modules/CalendarModule.tsx");

  for (const source of [leads, tasks, estimates, calendar]) {
    assert.match(source, /ModuleNextAction/);
  }

  assert.match(leads, /Transformă cererea în client/);
  assert.match(tasks, /acceptedEstimatesCount/);
  assert.match(tasks, /inventoryUnreadyLines/);
  assert.match(tasks, /upcomingEventsCount/);
  assert.match(estimates, /Pornește lucrarea din oferta acceptată/);
  assert.match(calendar, /Alocă resurse înainte de execuție/);
  assert.match(calendar, /data-calendar-resource-panel="true"/);
  assert.match(tasks, /Alte acțiuni/);
  assert.match(leads, /Alte acțiuni/);
});


test("documents and team use progressive disclosure for beginner-friendly defaults", () => {
  const documents = read("components/modules/DocumentsModule.tsx");
  assert.match(documents, /ModuleProgressiveMetrics/);
  assert.match(documents, /ModuleAdvancedFields/);
  assert.match(documents, /Dosarul acestei lucrări este gol/);
  assert.match(documents, /Leagă documentul de context/);

  const team = read("components/modules/TeamModule.tsx");
  assert.match(team, /ModuleProgressiveMetrics/);
  assert.match(team, /ModuleAdvancedFields/);
  assert.match(team, /Acces și detalii/);
  assert.match(team, /Detalii resursă/);
});

test("work dossier and inventory surface one operational action before secondary detail", () => {
  const dossier = read("components/modules/tasks/WorkFileSummary.tsx");
  assert.match(dossier, /ModuleNextAction/);
  assert.match(dossier, /Dosar complet · \{cards\.length\} legături/);
  assert.match(dossier, /attention\.key === "materials"/);
  assert.match(dossier, /attention\.key === "schedule"/);

  const inventory = read("components/modules/InventoryModule.tsx");
  assert.match(inventory, /firstTaskShortage/);
  assert.match(inventory, /Cumpără materialele lipsă/);
  assert.match(inventory, /Rezervă stocul disponibil/);
  assert.match(inventory, /Vezi calculele materialelor/);
  assert.match(inventory, /Alte acțiuni/);
});

test("finance prioritizes overdue collection and missing evidence", () => {
  const finance = read("components/modules/ExpensesModule.tsx");
  assert.match(finance, /ModuleNextAction/);
  assert.match(finance, /metrics\.overdue > 0/);
  assert.match(finance, /metrics\.missingEvidence > 0/);
  assert.match(finance, /Rezolvă dovezile/);
});
