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
  assert.match(guide, /getWorkspaceTargetOptions\(moduleId, effectiveContext, extra\)/);
  assert.match(guide, /navigation\.module === activeModule/);
  assert.match(guide, /liveState\.module === activeModule/);
  assert.doesNotMatch(guide, /setLiveContext\(navigationContext\)/);
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
  assert.match(guide, /getWorkspaceTargetOptions\(moduleId, effectiveContext, extra\)/);
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


test("overview promotes the ranked next best action above secondary dashboard detail", () => {
  const overview = read("components/modules/OverviewModule.tsx");
  assert.match(overview, /ModuleNextAction/);
  assert.match(overview, /priorityAttention = computed\?\.attention\[0\]/);
  assert.match(overview, /taskId: priorityAttention\.taskId/);
  assert.match(overview, /clientId: priorityAttention\.clientId/);
  assert.match(overview, /Nu există o acțiune urgentă/);
});

test("team resource engine stays available without dominating the default screen", () => {
  const team = read("components/modules/TeamModule.tsx");
  assert.match(team, /<details className="group mt-5/);
  assert.match(team, /Resurse operaționale · \{activeResourceCount\} active/);
  assert.match(team, /Resource Engine/);
});


test("purchase orders expose one status-driven primary action", () => {
  const inventory = read("components/modules/InventoryModule.tsx");
  assert.match(inventory, /order\.status === "draft"/);
  assert.match(inventory, /Marchează comandată →/);
  assert.match(inventory, /order\.status === "received" && enabledModules\.includes\("documents"\)/);
  assert.match(inventory, /<summary className=\{button \+ " flex cursor-pointer list-none items-center \[&::-webkit-details-marker\]:hidden"\}>Alte acțiuni<\/summary>/);
});


test("receipt evidence flows directly from documents into finance context", () => {
  const navigation = read("lib/workspace-navigation.ts");
  assert.match(navigation, /documentId\?: string/);

  const flow = read("lib/workspace-module-flow.ts");
  assert.match(flow, /"purchaseOrderId" \| "documentId"/);
  assert.match(flow, /target === "documents"[\s\S]*recordId: context\.documentId/);
  assert.match(flow, /target === "expenses"[\s\S]*documentId: context\.documentId/);

  const documents = read("components/modules/DocumentsModule.tsx");
  assert.match(documents, /document\.category === "receipt"/);
  assert.match(documents, /Înregistrează cheltuiala →/);
  assert.match(documents, /documentId: document\.id/);

  const finance = read("components/modules/ExpensesModule.tsx");
  assert.match(finance, /initialDocumentId\?: string/);
  assert.match(finance, /documentId: initialDocumentId \?\? ""/);
  assert.match(finance, /contexts\.documents\.find\(\(item\) => item\.id === initialDocumentId\)/);
  assert.match(finance, /description: current\.description \|\| document\.name/);

  const expenseData = read("lib/modules/expenses.ts");
  assert.match(expenseData, /client_id: string \| null/);
  assert.match(expenseData, /select\("id,name,client_id,task_id,estimate_id,purchase_order_id"\)/);
});


test("accepted estimates wait for material readiness before calendar", () => {
  const estimates = read("components/modules/EstimatesModule.tsx");
  assert.match(estimates, /loadInventoryTaskMaterialPlan/);
  assert.match(estimates, /taskMaterialPlanTaskId !== selected\.task_id/);
  assert.match(estimates, /Rezolvă materialele lipsă/);
  assert.match(estimates, /Rezervă materialele disponibile/);
  assert.match(estimates, /Pregătește materialele →/);
  assert.match(estimates, /enabledModules\.includes\("calendar"\) && !materialBlocksScheduling/);
  assert.match(estimates, /prefillTitle: selected\.title/);

  const navigation = read("lib/workspace-navigation.ts");
  assert.match(navigation, /prefillTitle\?: string/);

  const tasks = read("components/modules/TasksModule.tsx");
  assert.match(tasks, /initialTitle\?: string/);
  assert.match(tasks, /title: initialTitle\?\.trim\(\) \|\| ""/);
});

test("calendar routes scheduled work through its dossier before completion", () => {
  const calendar = read("components/modules/CalendarModule.tsx");
  assert.match(calendar, /selectedEventCanComplete/);
  assert.match(calendar, /Continuă în dosarul lucrării/);
  assert.match(calendar, /Deschide lucrarea →/);
  assert.match(calendar, /event\.status !== "completed" && canComplete/);
  assert.match(calendar, /Ora de început a trecut/);
});


test("calendar escalates missing scheduler resources to team", () => {
  const calendar = read("components/modules/CalendarModule.tsx");
  assert.match(calendar, /activeResources\.length === 0 && enabledModules\.includes\("team"\)/);
  assert.match(calendar, /Adaugă resurse înainte de execuție/);
  assert.match(calendar, /Deschide Echipă →/);
});

test("completed work without evidence is not treated as fully ready", () => {
  const readiness = read("lib/automation/work-readiness.ts");
  assert.match(readiness, /completedWithoutEvidence/);
  assert.match(readiness, /operation\.status === "done"/);
  assert.match(readiness, /dosarul nu are încă nicio dovadă sau document/);
});

test("inventory continues ready work into calendar", () => {
  const inventory = read("components/modules/InventoryModule.tsx");
  assert.match(inventory, /Materialele sunt pregătite/);
  assert.match(inventory, /Programează execuția →/);
  assert.match(inventory, /Nu există necesar material confirmat/);
  assert.match(inventory, /taskId: planTaskId/);
  assert.match(inventory, /clientId: taskById\.get\(planTaskId\)\?\.client_id/);
});


test("work dossier routes checklist attention locally and finance after completion", () => {
  const summary = read("components/modules/tasks/WorkFileSummary.tsx");
  assert.match(summary, /attention\.key === "checklist"/);
  assert.match(summary, /data-task-checklist="true"/);
  assert.match(summary, /Închide financiar/);
  assert.match(summary, /task\.status === "done"/);
  assert.match(summary, /module: "expenses"/);

  const tasks = read("components/modules/TasksModule.tsx");
  assert.match(tasks, /TaskChecklistPanel/);

  const checklistPanel = read("components/modules/tasks/TaskChecklistPanel.tsx");
  assert.match(checklistPanel, /data-task-checklist="true"/);
});


test("untracked materials remain visible without blocking automated readiness", () => {
  const inventoryData = read("lib/modules/inventory.ts");
  assert.match(inventoryData, /untrackedLines: plan\.filter/);
  assert.match(inventoryData, /item\.stock_tracked &&[\s\S]*item\.reserved_quantity < item\.outstanding_quantity/);

  const taskData = read("lib/modules/tasks.ts");
  assert.match(taskData, /inventoryUntrackedLines: number \| null/);
  assert.match(taskData, /inventoryUntrackedLines: inventoryResult\?\.untrackedLines \?\? null/);

  const readiness = read("lib/automation/work-readiness.ts");
  assert.match(readiness, /const untrackedLines = context\.inventoryUntrackedLines \?\? 0/);
  assert.match(readiness, /verificarea lor rămâne manuală/);
  assert.match(readiness, /state: untrackedLines > 0 \? "info" : "good"/);

  const estimates = read("components/modules/EstimatesModule.tsx");
  assert.match(estimates, /untracked: active\.filter\(\(item\) => !item\.stock_tracked\)/);
  assert.match(estimates, /ORBYVEN nu le blochează automat/);

  const inventory = read("components/modules/InventoryModule.tsx");
  assert.match(inventory, /Stocul urmărit nu are blocaje/);
  assert.match(inventory, /stoc tracking oprit/);
});


test("inventory shortages remain blockers for roles without procurement rights", () => {
  const inventory = read("components/modules/InventoryModule.tsx");
  assert.match(inventory, /taskPlanSummary\.shortages > 0 \? \(/);
  assert.match(inventory, /Există materiale lipsă/);
  assert.match(inventory, /Owner, Admin sau Manager/);
  assert.match(inventory, /canProcure && firstTaskShortage/);
});


test("finance closeout distinguishes draft invoice, collection and missing commercial document", () => {
  const finance = read("components/modules/ExpensesModule.tsx");
  assert.match(finance, /draftInvoices/);
  assert.match(finance, /openInvoices/);
  assert.match(finance, /factură\/facturi sunt încă în ciornă/);
  assert.match(finance, /Încasarea lucrării este încă deschisă/);
  assert.match(finance, /Nu există încă un document comercial pentru această lucrare/);
  assert.match(finance, /onOpenModule\("estimates", \{ taskId: scopeTaskId \}\)/);
  assert.match(finance, /Închiderea financiară este în regulă/);

  const estimates = read("components/modules/EstimatesModule.tsx");
  assert.match(estimates, /nextEstimates\.find\(\(item\) => item\.task_id === initialTaskId\)/);
});


test("tasks keeps the checklist outside the main module ownership budget", () => {
  const tasks = read("components/modules/TasksModule.tsx");
  const checklist = read("components/modules/tasks/TaskChecklistPanel.tsx");
  assert.match(tasks, /import TaskChecklistPanel/);
  assert.match(tasks, /<TaskChecklistPanel/);
  assert.match(checklist, /WorkTaskChecklistItem/);
});


test("finance can resolve missing evidence on an existing expense", () => {
  const expenseData = read("lib/modules/expenses.ts");
  assert.match(expenseData, /export async function attachExpenseDocument/);
  assert.match(expenseData, /Documentul este deja folosit ca dovadă pentru altă cheltuială/);
  assert.match(expenseData, /Documentul aparține altui deviz/);
  assert.match(expenseData, /update\(\{ document_id: documentId \}\)/);

  const finance = read("components/modules/ExpensesModule.tsx");
  assert.match(finance, /attachExpenseDocument/);
  assert.match(finance, /Atașează dovadă/);
  assert.match(finance, /compatibleEvidenceDocuments/);
  assert.match(finance, /item\.document_id === document\.id/);
  assert.match(finance, /\+ Încarcă dovadă/);
});
