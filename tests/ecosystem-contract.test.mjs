import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

// No browser, network, credentials or database. Execute isolated, pure TS logic.
function loadPureModule(relativePath) {
  const source = readFileSync(join(process.cwd(), relativePath), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  new Function("exports", compiled.outputText)(exports);
  return exports;
}
const graph = loadPureModule("lib/ecosystem/graph.ts");
const projections = loadPureModule("lib/ecosystem/projections.ts");
const revisions = loadPureModule("lib/ecosystem/revision.ts");
const financial = loadPureModule("lib/ecosystem/profitability.ts");
const calendarPlanning = loadPureModule("lib/modules/calendar-planning.ts");
const estimateWorkflow = loadPureModule("lib/modules/estimate-workflow.ts");

const estimate = {
  id: "estimate-1", organizationId: "tenant-A", clientId: "client-A",
  workId: "work-A", title: "Încălzire pardoseală", reference: "DEV-001",
  status: "accepted", currency: "RON", subtotalCents: 640000,
  discountCents: 0, totalCents: 640000, taxRate: 0, updatedAt: "2026-09-23T12:00:00Z",
  lines: [{ id: "line-A", description: "Montaj pardoseală", quantity: 80, unitPriceCents: 8000 }],
};
const recipe = {
  id: "recipe-A", organizationId: "tenant-A", name: "Încălzire/m²",
  ingredients: [
    { id: "ingredient-A", description: "Țeavă", quantityPerUnit: 5, unit: "m", unitCostCents: 450 },
    { id: "ingredient-B", description: "Placă", quantityPerUnit: 1, unit: "m²", unitCostCents: 600 },
  ],
};

test("prerequisites resolve in order without duplicates", () => {
  assert.deepEqual(graph.getEcosystemPrerequisites("efactura_submission"), [
    "crm", "work", "estimate", "client_offer", "invoice_draft",
    "fiscal_profile", "anaf_connection",
  ]);
  assert.deepEqual(graph.getEcosystemMissingDependencies("client_offer", new Set(["crm"])), ["work", "estimate"]);
  assert.equal(graph.isReadyForCustomerUse("client_offer"), true);
  assert.equal(graph.isReadyForCustomerUse("efactura_submission"), false);
  assert.equal(graph.isReadyForCustomerUse("thermal_plan"), true);
  assert.deepEqual(graph.getEcosystemPrerequisites("thermal_plan"), ["crm", "work"]);
  assert.equal(graph.isReadyForCustomerUse("estimate"), true);
});

test("material recipe expands only assigned line and keeps monetary cents", () => {
  const result = projections.expandMaterialRequirements(estimate, [{ estimateLineId: "line-A", recipe }]);
  assert.equal(result.ok, true);
  assert.equal(result.value.length, 2);
  assert.equal(result.value[0].quantity, 400);
  assert.equal(result.value[0].estimatedCostCents, 180000);
  assert.equal(result.value[1].estimatedCostCents, 48000);
  assert.equal(result.value[0].status, "planned");
});
test("cross-tenant recipes and duplicate assignments never project", () => {
  assert.equal(projections.expandMaterialRequirements(estimate, [
    { estimateLineId: "line-A", recipe: { ...recipe, organizationId: "tenant-B" } },
  ]).ok, false);
  assert.equal(projections.expandMaterialRequirements(estimate, [
    { estimateLineId: "line-A", recipe },
    { estimateLineId: "line-A", recipe },
  ]).ok, false);
});
test("offer snapshot is detached and does not confer fiscal issuance", () => {
  const offer = projections.buildClientOffer(estimate);
  assert.equal(offer.ok, true);
  assert.equal(offer.value.fiscalInvoice, false);
  assert.notEqual(offer.value.lines[0], estimate.lines[0]);
  assert.equal(projections.buildClientOffer({ ...estimate, clientId: null }).ok, false);
});
test("invoice draft requires explicit accepted offer and known VAT regime", () => {
  assert.equal(projections.buildInvoiceDraft(estimate, false).ok, false);
  assert.equal(projections.buildInvoiceDraft({ ...estimate, taxRate: null }, true).ok, false);
  assert.equal(projections.buildInvoiceDraft({ ...estimate, status: "sent" }, true).ok, false);
  const draft = projections.buildInvoiceDraft(estimate, true);
  assert.equal(draft.ok, true);
  assert.equal(draft.value.type, "invoice_draft");
  assert.equal(draft.value.fiscalInvoice, false);
});
test("ANAF stays blocked until all eight prerequisites are explicitly true", () => {
  const states = {
    legalEntityApproved: true, buyerDetailsApproved: true,
    vatCategoryApproved: true, invoiceNumberReserved: true,
    invoiceSnapshotLocked: true, anafAuthorizationActive: true,
    roleAuthorized: true, explicitUserConfirmation: false,
  };
  assert.equal(projections.getFiscalSubmissionBlockers(states).length, 1);
  assert.deepEqual(projections.getFiscalSubmissionBlockers({ ...states, explicitUserConfirmation: true }), []);
});


test("accepting a quote changes status, not the approved commercial snapshot", () => {
  const source = {
    reference: "DEV-001",title: "Încălzire pardoseală",client_id:"client-A",
    task_id:"work-A",currency:"RON",subtotal_cents:640000,discount_cents:0,
    total_cents:640000,tax_rate:0,
  };
  const line = { id:"line-A",description:"Montaj pardoseală",quantity:80,unit_price_cents:8000 };
  const offer = {
    title:source.title,client_id:source.client_id,task_id:source.task_id,
    currency:source.currency,subtotal_cents:source.subtotal_cents,
    discount_cents:source.discount_cents,total_cents:source.total_cents,tax_rate:source.tax_rate,
    snapshot:{source_reference:"DEV-001",lines:[{...line}]},
  };
  assert.equal(revisions.commercialSnapshotMatches(source,[line],offer),true);
  assert.equal(revisions.commercialSnapshotMatches({...source,total_cents:1},[line],offer),false);
  assert.equal(revisions.commercialSnapshotMatches(source,[{...line,quantity:81}],offer),false);
  assert.equal(revisions.commercialSnapshotMatches(source,[line],{...offer,snapshot:{}}),false);
});


test("Alpha 0.6 margin uses selling price without VAT and never double-counts expenses", () => {
  const data = financial.computeEstimateProfitability({
    subtotalCents: 1200000, discountCents: 0,
    materialLines:[{quantity:80,unit_cost_cents:6000}],
    plannedLaborCents:250000,otherCostCents:30000,
    recordedExpensesCents:[200000,35000],
  });
  assert.equal(data.netPrice,1200000);
  assert.equal(data.estimatedMaterialCost,480000);
  assert.equal(data.plannedMargin,440000);
  assert.equal(data.actualExpenses,235000);
  assert.equal(data.plannedTotal,760000);
  assert.equal(financial.computeEstimateProfitability({
    subtotalCents:0,discountCents:0,materialLines:[],
    plannedLaborCents:0,otherCostCents:0,recordedExpensesCents:[],
  }).plannedMarginPercent,null);
});
test("Alpha 0.6 keeps negative gross margin rather than pretending profit is positive",()=>{
  const data=financial.computeEstimateProfitability({
    subtotalCents:50000,discountCents:0,
    materialLines:[{quantity:2,unit_cost_cents:40000}],
    plannedLaborCents:20000,otherCostCents:10000,recordedExpensesCents:[],
  });
  assert.equal(data.plannedMargin,-60000);
});


test("Wave 2 calendar planning detects only relevant overlaps and proposes free slots", () => {
  const events = [
    {
      id: "a", title: "Lucrare A", status: "scheduled",
      start_at: "2026-09-30T07:00:00.000Z", end_at: "2026-09-30T09:00:00.000Z",
      assignee: "Andrei", task_id: "work-a",
    },
    {
      id: "b", title: "Alt coleg", status: "scheduled",
      start_at: "2026-09-30T07:30:00.000Z", end_at: "2026-09-30T08:30:00.000Z",
      assignee: "Mihai", task_id: "work-b",
    },
    {
      id: "c", title: "Anulat", status: "cancelled",
      start_at: "2026-09-30T07:00:00.000Z", end_at: "2026-09-30T10:00:00.000Z",
      assignee: "Andrei", task_id: "work-c",
    },
  ];
  const conflicts = calendarPlanning.findCalendarConflicts(events, {
    startAt: "2026-09-30T08:00:00.000Z",
    endAt: "2026-09-30T09:00:00.000Z",
    assignee: "andrei",
    taskId: "work-a",
  });
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].reason, "both");
  assert.equal(conflicts[0].event.id, "a");

  const slots = calendarPlanning.buildAvailabilitySuggestions(events, {
    dayStartAt: "2026-09-30T06:00:00.000Z",
    dayEndAt: "2026-09-30T12:00:00.000Z",
    durationMinutes: 60,
    assignee: "Andrei",
    stepMinutes: 30,
    limit: 2,
  });
  assert.deepEqual(slots, [
    { startAt: "2026-09-30T06:00:00.000Z", endAt: "2026-09-30T07:00:00.000Z" },
    { startAt: "2026-09-30T09:00:00.000Z", endAt: "2026-09-30T10:00:00.000Z" },
  ]);
});

test("Wave 2 estimate workflow surfaces the next business action without silently mutating status", () => {
  const base = {
    client_id: "client-a", task_id: "work-a", valid_until: "2026-10-05", sent_at: null,
  };
  assert.equal(estimateWorkflow.evaluateEstimateWorkflow({ ...base, status: "draft" }, "2026-09-30").nextAction, "send");
  const waiting = estimateWorkflow.evaluateEstimateWorkflow({
    ...base, status: "sent", sent_at: "2026-09-28T10:00:00Z",
  }, "2026-09-30");
  assert.equal(waiting.nextAction, "await_response");
  assert.equal(waiting.daysSinceSent, 2);
  const overdue = estimateWorkflow.evaluateEstimateWorkflow({
    ...base, status: "sent", valid_until: "2026-09-29", sent_at: "2026-09-20T10:00:00Z",
  }, "2026-09-30");
  assert.equal(overdue.overdue, true);
  assert.equal(overdue.nextAction, "review_expired");
  assert.equal(estimateWorkflow.evaluateEstimateWorkflow({ ...base, status: "accepted" }, "2026-09-30").nextAction, "schedule_work");
  assert.equal(estimateWorkflow.evaluateEstimateWorkflow({ ...base, status: "rejected" }, "2026-09-30").nextAction, "revise");
});
