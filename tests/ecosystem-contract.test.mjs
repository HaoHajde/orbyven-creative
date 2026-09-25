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
