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


test("calendar and tasks synchronize only safe deterministic statuses", () => {
  const sync = read("lib/automation/status-sync.ts");
  assert.match(sync, /export async function syncTaskCalendarSchedule/);
  assert.match(sync, /\.eq\("status", "scheduled"\)/);
  assert.match(sync, /\.order\("start_at", \{ ascending: true \}\)/);
  assert.match(sync, /status: "in_progress"/);
  assert.match(sync, /\.eq\("status", "planned"\)/);
  assert.match(sync, /completeElapsedWorkEventsForTask/);
  assert.match(sync, /\.lte\("end_at", nowIso\)/);
  assert.match(sync, /futureScheduled/);

  const calendar = read("components/modules/CalendarModule.tsx");
  assert.match(calendar, /syncTaskAfterWorkScheduled/);
  assert.match(calendar, /syncTaskAfterWorkEventCompleted/);
  assert.match(calendar, /syncTaskCalendarSchedule/);
  assert.match(calendar, /Programarea a fost ștearsă/);

  const tasks = read("components/modules/TasksModule.tsx");
  assert.match(tasks, /completeElapsedWorkEventsForTask/);
  assert.match(tasks, /progress === 100/);
  assert.match(tasks, /programări de lucru viitoare sunt încă active/);
});

test("estimate status synchronizes the existing commercial offer", () => {
  const actions = read("lib/ecosystem/actions.ts");
  assert.match(actions, /export async function syncOfferStatusFromEstimate/);
  assert.match(actions, /if\(existing\.data\.status==="draft"\)await markOfferManually\(org,estimateId,"sent"\)/);
  assert.match(actions, /await markOfferManually\(org,estimateId,"accepted"\)/);

  const estimates = read("components/modules/EstimatesModule.tsx");
  assert.match(estimates, /syncOfferStatusFromEstimate/);
  assert.match(estimates, /status === "sent" \|\| status === "accepted"/);
  assert.match(estimates, /documentul comercial asociat necesită verificare manuală/);
});


test("completed calendar work continues into the linked work dossier", () => {
  const calendar = read("components/modules/CalendarModule.tsx");
  assert.match(calendar, /Intervenția este închisă/);
  assert.match(calendar, /Continuă lucrarea →/);
  assert.match(calendar, /selectedEvent\.status === "completed"/);
  assert.match(calendar, /recordId: selectedEvent\.task_id/);
});

test("work closeout is suggested only after deterministic readiness conditions", () => {
  const summary = read("components/modules/tasks/WorkFileSummary.tsx");
  assert.match(summary, /operationalCloseReady/);
  assert.match(summary, /task\.status === "in_progress"/);
  assert.match(summary, /context\.upcomingEventsCount === 0/);
  assert.match(summary, /checklist\.every\(\(item\) => item\.done\)/);
  assert.match(summary, /context\.documentsCount > 0/);
  assert.match(summary, /Finalizează lucrarea →/);

  const tasks = read("components/modules/TasksModule.tsx");
  assert.match(tasks, /onCompleteTask=\{\(\) => void changeStatus\(selectedTask, "done"\)\}/);
});


test("accepted estimates convert active leads into CRM clients without overwriting lost leads", () => {
  const sync = read("lib/automation/status-sync.ts");
  assert.match(sync, /export async function syncCrmAfterAcceptedEstimate/);
  assert.match(sync, /lead\.stage === "lost"/);
  assert.match(sync, /kind: "client"/);
  assert.match(sync, /stage: "won"/);
  assert.match(sync, /Convertit automat în client/);

  const estimates = read("components/modules/EstimatesModule.tsx");
  assert.match(estimates, /syncCrmAfterAcceptedEstimate/);
  assert.match(estimates, /status === "accepted" && next\.client_id/);
  assert.match(estimates, /Clientul este marcat «Pierdut» în CRM/);
});

test("task lifecycle panels live outside the main tasks module", () => {
  const tasks = read("components/modules/TasksModule.tsx");
  const lifecycle = read("components/modules/tasks/TaskLifecyclePanels.tsx");
  assert.match(tasks, /TaskLifecyclePanels/);
  assert.match(tasks, /<AftercarePanel/);
  assert.match(tasks, /<PostServiceGrowthPanel/);
  assert.doesNotMatch(tasks, /function PostServiceGrowthPanel\(/);
  assert.doesNotMatch(tasks, /function AftercarePanel\(/);
  assert.match(lifecycle, /export function PostServiceGrowthPanel/);
  assert.match(lifecycle, /export function AftercarePanel/);
});


test("estimate creation advances active CRM leads to proposal without reopening terminal leads", () => {
  const sync = read("lib/automation/status-sync.ts");
  assert.match(sync, /export async function syncCrmAfterEstimateCreated/);
  assert.match(sync, /lead\.stage === "won" \|\| lead\.stage === "lost"/);
  assert.match(sync, /update\(\{ stage: "proposal" \}\)/);
  assert.match(sync, /Stadiu mutat automat în Propunere/);

  const estimates = read("components/modules/EstimatesModule.tsx");
  assert.match(estimates, /syncCrmAfterEstimateCreated/);
  assert.match(estimates, /CRM-ul a mutat cererea automat în stadiul Propunere/);
  assert.match(estimates, /Cererea este marcată «Pierdut» în CRM/);
});


test("inventory becomes the single procurement status source when enabled", () => {
  const workflow = read("components/modules/CommercialWorkflowPanel.tsx");
  assert.match(workflow, /inventoryOwnsProcurement=inventoryEnabled&&Boolean\(estimate\.task_id\)/);
  assert.match(workflow, /Gestionat în Stoc & achiziții/);
  assert.match(workflow, /!inventoryOwnsProcurement&&row\.status!=="bought"/);
  assert.match(workflow, /Deschide Stoc & achiziții →/);

  const estimates = read("components/modules/EstimatesModule.tsx");
  assert.match(estimates, /inventoryEnabled=\{enabledModules\.includes\("inventory"\)\}/);
  assert.match(estimates, /onOpenInventory=\{selected\.task_id/);
});


test("new estimates cannot target closed work while historical revisions keep context", () => {
  const estimatesData = read("lib/modules/estimates.ts");
  assert.match(estimatesData, /!input\.sourceEstimateId && \["done", "cancelled"\]\.includes\(task\.status\)/);
  assert.match(estimatesData, /Lucrarea este închisă/);
  assert.match(estimatesData, /Devizul acceptat nu poate porni o lucrare deja finalizată sau anulată/);

  const estimates = read("components/modules/EstimatesModule.tsx");
  assert.match(estimates, /tasks\.filter\(\(task\) => revisionSource \|\| !\["done","cancelled"\]\.includes\(task\.status\)\)/);
});


test("client lifecycle drives the CRM primary action", () => {
  const leads = read("components/modules/LeadsModule.tsx");
  assert.match(leads, /selectedLifecycle\?\.state === "overdue"/);
  assert.match(leads, /Follow-up ajuns la termen/);
  assert.match(leads, /selectedLifecycle\?\.needsReactivation/);
  assert.match(leads, /Planifică revenire →/);
  assert.match(leads, /data-client-follow-up="true"/);
  assert.match(leads, /Alte acțiuni/);
});

test("sending an estimate refreshes CRM contact recency", () => {
  const sync = read("lib/automation/status-sync.ts");
  assert.match(sync, /export async function syncCrmAfterEstimateSent/);
  assert.match(sync, /last_contact_at: now/);
  assert.match(sync, /Devizul.*a fost marcat trimis/);
  assert.match(sync, /lead\.stage === "lost"/);

  const estimates = read("components/modules/EstimatesModule.tsx");
  assert.match(estimates, /syncCrmAfterEstimateSent/);
  assert.match(estimates, /status === "sent" && next\.client_id/);
  assert.match(estimates, /ultima interacțiune pentru oferta trimisă/);
});


test("task calendar sync warnings are actionable and status-sync keeps a stable result shape", () => {
  const tasks = read("components/modules/TasksModule.tsx");
  assert.match(tasks, /syncCalendarReview/);
  assert.match(tasks, /Deschide Calendar →/);
  assert.match(tasks, /onOpenModule\("calendar"\)/);

  const sync = read("lib/automation/status-sync.ts");
  assert.match(sync, /scheduleUpdated: false as const/);
  assert.match(sync, /nextScheduledAt: null/);
});


test("purchase order receipt status stays database-owned and completed receipt hands off to evidence", () => {
  const migration = read("supabase/migrations/20260930071344_alpha09_inventory_procurement_core.sql");
  assert.match(migration, /when has_items and all_received then 'received'/);
  assert.match(migration, /when has_any_received then 'partially_received'/);
  assert.match(migration, /create trigger ops_inventory_movements_after_insert/);

  const inventory = read("components/modules/InventoryModule.tsx");
  assert.match(inventory, /procurementHandoff/);
  assert.match(inventory, /completesOrder/);
  assert.match(inventory, /Recepția este completă/);
  assert.match(inventory, /\+ Dovadă furnizor →/);
  assert.match(inventory, /purchaseOrderId: procurementHandoff\.purchaseOrderId/);
  assert.match(inventory, /Înregistrează costul →/);
});


test("lead next action follows CRM pipeline instead of forcing premature conversion", () => {
  const leads = read("components/modules/LeadsModule.tsx");
  assert.match(leads, /selectedLead\.stage === "won"/);
  assert.match(leads, /Transformă în client →/);
  assert.match(leads, /selectedLead\.stage === "lost"/);
  assert.match(leads, /Cererea este închisă ca pierdută/);
  assert.match(leads, /selectedLead\.stage === "proposal" && enabledModules\.includes\("estimates"\)/);
  assert.match(leads, /Deschide oferta →/);
  assert.match(leads, /Pregătește oferta/);

  const estimates = read("components/modules/EstimatesModule.tsx");
  assert.match(estimates, /clientEstimate = !taskEstimate && initialClientId/);
  assert.match(estimates, /item\.client_id === initialClientId/);
});


test("closing work releases inventory reservations atomically at the database layer", () => {
  const migration = read("supabase/migrations/20261002093000_wave6_inventory_reservation_cleanup.sql");
  assert.match(migration, /security definer/);
  assert.match(migration, /new\.status in \('done', 'cancelled'\)/);
  assert.match(migration, /delete from public\.ops_inventory_reservations/);
  assert.match(migration, /r\.task_id = new\.id/);
  assert.match(migration, /after update of status on public\.ops_tasks/);

  const reservations = read("supabase/migrations/20261001232500_wave4_inventory_reservations.sql");
  assert.match(reservations, /ops_inventory_reservations_task_fk[\s\S]*on delete cascade/);
});


test("cancelling work atomically cancels internal work calendar without auto-cancelling supplier orders", () => {
  const calendarClose = read("supabase/migrations/20261002094500_wave6_task_calendar_close_sync.sql");
  assert.match(calendarClose, /new\.scheduled_at := null/);
  assert.match(calendarClose, /new\.status = 'cancelled'/);
  assert.match(calendarClose, /update public\.calendar_events/);
  assert.match(calendarClose, /e\.event_type = 'work'/);
  assert.match(calendarClose, /e\.status = 'scheduled'/);
  assert.doesNotMatch(calendarClose, /ops_purchase_orders/);

  const readiness = read("lib/automation/work-readiness.ts");
  assert.match(readiness, /openPurchaseOrdersCount/);
  assert.match(readiness, /comenzi furnizor sunt încă deschise pentru o operațiune închisă/);
});

test("inventory focuses open purchase orders for incoming work context", () => {
  const inventory = read("components/modules/InventoryModule.tsx");
  assert.match(inventory, /purchaseOrderTaskScope/);
  assert.match(inventory, /visiblePurchaseOrders/);
  assert.match(inventory, /order\.task_id === purchaseOrderTaskScope/);
  assert.match(inventory, /data-inventory-procurement-scope="true"/);
  assert.match(inventory, /Toate comenzile/);
});


test("received procurement stock is reserved automatically for its linked work", () => {
  const inventory = read("components/modules/InventoryModule.tsx");
  assert.match(inventory, /await receivePurchaseOrderItem\(organizationId, item, remaining\)/);
  assert.match(inventory, /await reserveAvailableInventoryForTask\([\s\S]*order\.task_id,[\s\S]*item\.material_id/);
  assert.match(inventory, /Recepția a intrat în stoc și disponibilul a fost rezervat automat pentru lucrare/);
  assert.match(inventory, /if \(ok && order\)/);
  assert.match(inventory, /planTaskId === order\.task_id/);
});


test("completed work reactivation cannot leave a 100 percent in-progress state", () => {
  const tasks = read("components/modules/TasksModule.tsx");
  assert.match(tasks, /task\.status === "done"/);
  assert.match(tasks, /Reactivează lucrarea/);
  assert.match(tasks, /onClick=\{\(\) => onProgress\(0\)\}/);
  assert.match(tasks, /revine la „De făcut” și resetează progresul/);
});


test("rejected and expired estimates update CRM activity without forcing lost", () => {
  const sync = read("lib/automation/status-sync.ts");
  assert.match(sync, /syncCrmAfterEstimateClosedWithoutAcceptance/);
  assert.match(sync, /status: "rejected" \| "expired"/);
  assert.match(sync, /update\(\{ last_contact_at: now \}\)/);
  assert.match(sync, /Stadiul CRM a fost păstrat pentru decizie manuală/);
  assert.doesNotMatch(sync, /syncCrmAfterEstimateClosedWithoutAcceptance[\s\S]{0,2400}stage: "lost"/);

  const estimates = read("components/modules/EstimatesModule.tsx");
  assert.match(estimates, /status === "rejected" \|\| status === "expired"/);
  assert.match(estimates, /syncCrmAfterEstimateClosedWithoutAcceptance/);
  assert.match(estimates, /fără să schimbe automat stadiul clientului/);
});


test("calendar readiness ignores inactive team resources", () => {
  const calendar = read("components/modules/CalendarModule.tsx");
  assert.match(calendar, /activeResourceIdsByEvent/);
  assert.match(calendar, /ids\.filter\(\(id\) => resourceById\.get\(id\)\?\.active\)/);
  assert.match(calendar, /resourceCount=\{activeResourceIdsByEvent\.get\(calendarEvent\.id\)\?\.length \?\? 0\}/);
  assert.match(calendar, /activeResourceIdsByEvent\.get\(selectedEvent\.id\)\?\.length/);
  assert.match(calendar, /const baseline = activeResourceIdsByEvent\.get\(selectedEvent\.id\) \?\? \[\]/);
});


test("team and resources surface the future-booking deactivation guard clearly", () => {
  const resources = read("lib/modules/resources.ts");
  assert.match(resources, /resource_has_future_bookings/);
  assert.match(resources, /Realocă sau anulează acele programări din Calendar înainte de dezactivare/);

  const teamData = read("lib/modules/team.ts");
  assert.match(teamData, /Membrul este alocat în programări viitoare/);

  const team = read("components/modules/TeamModule.tsx");
  assert.match(team, /resourceError instanceof Error \? resourceError\.message/);
});


test("fully paid invoices are logged in CRM without blocking finance", () => {
  const sync = read("lib/automation/status-sync.ts");
  assert.match(sync, /syncCrmAfterInvoicePaid/);
  assert.match(sync, /Factura" \+ label \+ " a fost achitată integral/);

  const financeData = read("lib/modules/expenses.ts");
  assert.match(financeData, /const becamePaid = invoice\.status !== "paid" && nextStatus === "paid"/);
  assert.match(financeData, /if \(paymentSync\.becamePaid && invoice\.client_id\)/);
  assert.match(financeData, /await syncCrmAfterInvoicePaid/);
  assert.match(financeData, /CRM invoice payment sync failed/);
});


test("work dossier carries minimal financial closeout context", () => {
  const tasksData = read("lib/modules/tasks.ts");
  assert.match(tasksData, /financeDraftInvoicesCount: number \| null/);
  assert.match(tasksData, /financeOpenInvoicesCount: number \| null/);
  assert.match(tasksData, /financeOverdueInvoicesCount: number \| null/);
  assert.match(tasksData, /financeOutstandingCents: number \| null/);
  assert.match(tasksData, /sales_commercial_documents/);
  assert.match(tasksData, /finance_income_entries/);

  const readiness = read("lib/automation/work-readiness.ts");
  assert.match(readiness, /key: "financial"/);
  assert.match(readiness, /label: "Închidere financiară"/);
  assert.match(readiness, /facturi au scadența depășită/);
  assert.match(readiness, /Mai sunt de încasat/);

  const summary = read("components/modules/tasks/WorkFileSummary.tsx");
  assert.match(summary, /attention\.key === "financial"/);
  assert.match(summary, /label: "Închide financiar"/);
});


test("completed work synchronizes calendar cleanup and CRM activity conservatively", () => {
  const sync = read("lib/automation/status-sync.ts");
  assert.match(sync, /export async function syncCrmAfterWorkCompleted/);
  assert.match(sync, /last_contact_at: now/);
  assert.match(sync, /Lucrarea „\$\{title\}” a fost finalizată/);

  const tasks = read("components/modules/TasksModule.tsx");
  assert.match(tasks, /const syncCompletedWork = async/);
  assert.match(tasks, /completeElapsedWorkEventsForTask/);
  assert.match(tasks, /syncCrmAfterWorkCompleted/);
  assert.match(tasks, /await syncCompletedWork\(updated, "status"\)/);
  assert.match(tasks, /await syncCompletedWork\(updated, "progress"\)/);
});


test("post-service and aftercare expose one primary action before advanced options", () => {
  const panels = read("components/modules/tasks/TaskLifecyclePanels.tsx");
  assert.match(panels, /ModuleNextAction/);
  assert.match(panels, /primaryPostServiceAction/);
  assert.match(panels, /data-post-service-options="true"/);
  assert.match(panels, /Opțiuni post-service/);
  assert.match(panels, /data-aftercare-options="true"/);
  assert.match(panels, /Revenire sau lucrare recurentă/);
});


test("missing expense evidence upload keeps full context and auto-attaches", () => {
  const navigation = read("lib/workspace-navigation.ts");
  assert.match(navigation, /expenseId\?: string/);
  assert.match(navigation, /documentCategory\?:/);

  const finance = read("components/modules/ExpensesModule.tsx");
  assert.match(finance, /expenseId: expense\.id/);
  assert.match(finance, /documentCategory: "receipt"/);
  assert.match(finance, /clientId: expense\.client_id/);
  assert.match(finance, /estimateId: expense\.estimate_id/);

  const documents = read("components/modules/DocumentsModule.tsx");
  assert.match(documents, /initialExpenseId\?: string/);
  assert.match(documents, /initialCategory\?: DocumentCategory/);
  assert.match(documents, /attachExpenseDocument\(organizationId, initialExpenseId, created\.id\)/);
  assert.match(documents, /initialClientId \?\? ""/);
  assert.match(documents, /initialEstimateId \?\? ""/);
});


test("documents confirm successful automatic evidence handoff", () => {
  const documents = read("components/modules/DocumentsModule.tsx");
  assert.match(documents, /expenseEvidenceAttached/);
  assert.match(documents, /Dovada este atașată cheltuielii/);
  assert.match(documents, /Documentul și contextul financiar au fost sincronizate automat/);
  assert.match(documents, /Înapoi la Finanțe →/);
});


test("calendar keeps resource allocation open only while it needs attention", () => {
  const calendar = read("components/modules/CalendarModule.tsx");
  assert.match(calendar, /selectedEventNeedsResources/);
  assert.match(calendar, /open=\{selectedEventNeedsResources \|\| undefined\}/);
  assert.match(calendar, /Resurse alocate · \$\{selectedEventResourceCount\}/);
  assert.match(calendar, /data-calendar-resource-panel="true"/);
});


test("completed work shows operational dossier before aftercare panels", () => {
  const tasks = read("components/modules/TasksModule.tsx");
  const dossier = tasks.indexOf("<WorkFileSummary");
  const aftercare = tasks.indexOf("<AftercarePanel");
  const postService = tasks.indexOf("<PostServiceGrowthPanel");
  assert.ok(dossier >= 0 && aftercare >= 0 && postService >= 0);
  assert.ok(dossier < aftercare);
  assert.ok(dossier < postService);
});
