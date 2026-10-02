import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { readAllPages } from "../lib/modules/paged-read.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const overview = read("lib/modules/overview.ts");
const dashboard = read("components/modules/OverviewModule.tsx");
const search = read("components/WorkspaceSearch.tsx");
const workspace = read("components/WorkspaceShell.tsx");
const tasksData = read("lib/modules/tasks.ts");
const tasksUi = read("components/modules/TasksModule.tsx");
const estimatesData = read("lib/modules/estimates.ts");
const estimatesUi = read("components/modules/EstimatesModule.tsx");
const documentsData = read("lib/modules/documents.ts");
const documentsUi = read("components/modules/DocumentsModule.tsx");
const expensesData = read("lib/modules/expenses.ts");
const expensesUi = read("components/modules/ExpensesModule.tsx");

test("exact totals page through 1,000+ records, including the final partial page", async () => {
  const dataset = Array.from({ length: 1203 }, (_, id) => ({ id, amount_cents: id }));
  const windows = [];
  const result = await readAllPages((from, to) => {
    windows.push([from, to]);
    return Promise.resolve({ data: dataset.slice(from, to + 1), error: null });
  });
  assert.deepEqual(windows, [[0, 499], [500, 999], [1000, 1499]]);
  assert.equal(result.length, 1203);
  assert.equal(result.reduce((sum, row) => sum + row.amount_cents, 0), 1203 * 1202 / 2);
});

test("exact page boundaries and empty datasets terminate; invalid pages fail closed", async () => {
  const dataset = Array.from({ length: 1000 }, (_, id) => ({ id }));
  const ranges = [];
  assert.equal((await readAllPages((from, to) => {
    ranges.push([from, to]);
    return Promise.resolve({ data: dataset.slice(from, to + 1), error: null });
  })).length, 1000);
  assert.deepEqual(ranges, [[0, 499], [500, 999], [1000, 1499]]);
  assert.deepEqual(await readAllPages(() => Promise.resolve({ data: [], error: null })), []);
  await assert.rejects(readAllPages(() => Promise.resolve({ data: null, error: { message: "offline" } })), (error) => error.message === "offline");
  await assert.rejects(readAllPages(() => Promise.resolve({ data: null, error: null })), /unavailable/);
  await assert.rejects(readAllPages(() => Promise.resolve({ data: [], error: null }), 0), /Invalid/);
});

test("Overview uses exact SQL counts, selected small records and bounded current-month finance reads", () => {
  assert.match(overview, /count: "exact", head: true/);
  assert.match(overview, /ATTENTION_LIMIT = 16/);
  assert.match(overview, /\.limit\(ATTENTION_LIMIT \+ 1\)/);
  assert.match(overview, /\.limit\(4\)/);
  assert.match(overview, /readAllPages<\{ created_at: string \}>/);
  assert.match(overview, /readAllPages<\{ amount_cents: number \}>/);
  assert.match(overview, /\.gte\("occurred_on", monthStart\)\.lt\("occurred_on", nextMonthStart\)/);
  assert.match(overview, /canAccessFinances\s*\? readAllPages/);
  assert.match(dashboard, /loadOverviewSnapshot\([\s\S]{0,180}enabledModules\.includes\("team"\)/);
  assert.match(overview, /includeTeam\s*\? countRows/);
  assert.match(overview, /eq\("status", "inactive"\)[\s\S]{0,120}limit\(120\)/);
  assert.match(dashboard, /snapshot\?\.taskStages\.planned/);
  assert.match(dashboard, /snapshot\.activeLeadsCount/);
  assert.match(dashboard, /snapshot\.monthExpensesCents/);
  assert.match(dashboard, /snapshot\.monthIncomeCents/);
  assert.match(dashboard, /snapshot\.attentionHasMore/);
  assert.match(dashboard, /canAccessFinances && <SnapshotRow label="Încasări luna aceasta"/);
  assert.match(dashboard, /canAccessFinances && <SnapshotRow label="Cashflow luna aceasta"/);
  assert.match(overview, /eq\("status", "blocked"\)/);
  assert.match(overview, /scheduledNearTasks/);
  assert.match(overview, /dueNearTasks/);
  assert.match(dashboard, /todayQueue/);
  assert.match(dashboard, /buildBusinessAutomationSignals/);
  assert.match(dashboard, /operation_blocked/);
  assert.match(overview, /7 \* DAY_MS/);
  assert.match(overview, /\.lte\("start_at", eventsUntil\)/);
});

test("work dossier reads contextual data without bypassing finance or pagination boundaries", () => {
  assert.match(tasksData, /export async function loadWorkTaskContext/);
  assert.match(tasksData, /options\.canAccessFinances\s*\? readAllPages/);
  assert.match(tasksData, /\.from\("ops_documents"\)/);
  assert.match(tasksData, /\.from\("calendar_events"\)/);
  assert.match(tasksData, /options\.includeThermal/);
  assert.match(tasksUi, /DOSAR OPERAȚIONAL/);
  assert.match(tasksUi, /realOperationalCostCents/);
  assert.match(tasksData, /inventoryConsumedCents/);
  assert.match(tasksUi, /thermalSketch/);
  assert.match(tasksUi, /evaluateWorkReadiness/);
  assert.match(tasksUi, /ORBYVEN · WORK READINESS/);
});

test("accepted estimate handoff is organization-scoped and rolls back incomplete work creation", () => {
  assert.match(estimatesData, /export async function attachAcceptedEstimateToTask/);
  assert.match(estimatesData, /estimate\.status !== "accepted"/);
  assert.match(estimatesData, /Statusul final nu se rescrie/);
  assert.match(estimatesUi, /Pornește lucrarea/);
  assert.match(tasksUi, /attachAcceptedEstimateToTask/);
  assert.match(tasksUi, /deleteWorkTask\(organizationId, created\.id\)/);
});

test("documents inherit and validate client/work/estimate context", () => {
  assert.match(documentsData, /select\("id,reference,title,client_id,task_id"\)/);
  assert.match(documentsData, /Lucrarea aleasă nu corespunde devizului/);
  assert.match(documentsData, /Clientul ales nu corespunde lucrării/);
  assert.match(documentsUi, /selectEstimateContext/);
  assert.match(documentsUi, /selectTaskContext/);
  assert.match(documentsUi, /Contextul este sincronizat automat/);
});

test("finance surfaces missing evidence and rejects mismatched receipt context", () => {
  assert.match(expensesData, /Clientul cheltuielii nu corespunde documentului justificativ/);
  assert.match(expensesData, /Lucrarea cheltuielii nu corespunde documentului justificativ/);
  assert.match(expensesData, /estimate_id: linkedEstimateId/);
  assert.match(expensesUi, /missingEvidence/);
  assert.match(expensesUi, /Doar fără document/);
  assert.match(expensesUi, /Toate au document/);
});

test("workspace search is a single responsive control and stale responses cannot leak", () => {
  assert.equal((workspace.match(/<WorkspaceSearch /g) ?? []).length, 1);
  assert.match(workspace, /flex-wrap items-center/);
  assert.match(search, /\+\+requestId\.current;\s*const next = event\.target\.value/);
  assert.match(search, /setHits\(\[\]\);\s*setError\(".*?"\)/);
  assert.match(search, /visibleHits = hits\.filter\(\(hit\) => searchModules\.includes\(hit\.module\)\)/);
  assert.match(search, /visibleHits\[0\] && open && !loading/);
  assert.match(search, /\.eq\("organization_id", organizationId\)/);
});

test("performance audit is manual and never triggers a second Vercel deployment", () => {
  const workflow = read(".github/workflows/performance-audit.yml");
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s+push:/m);
  assert.match(workflow, /lighthouse/);
  assert.match(read("vercel.json"), /"main": true/);
});
