import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("Finance keeps the stable entitlement id while presenting the expanded module", () => {
  const registry = read("lib/orbyven-modules.ts");
  assert.match(registry, /id:\s*"expenses"[\s\S]*name:\s*"Finanțe"/);
  assert.match(registry, /features:\s*\["Cheltuieli",\s*"Încasări",\s*"Scadențe & cashflow"\]/);
});

test("Finance v2 has tenant-scoped income, finance-only RLS and indexed relations", () => {
  const migration = read("supabase/migrations/20260929113044_finance_v2_activity_notifications.sql");
  const indexes = read("supabase/migrations/20260929113103_finance_v2_fk_indexes.sql");
  assert.match(migration, /create table if not exists public\.finance_income_entries/);
  assert.match(migration, /alter table public\.finance_income_entries enable row level security/);
  assert.match(migration, /private\.can_access_org_finances\(organization_id\)/);
  assert.match(migration, /private\.is_billing_module_allowed\(organization_id, 'expenses'\)/);
  assert.match(migration, /not a fiscal ledger or accounting substitute/);
  assert.match(indexes, /finance_income_entries_org_client_idx/);
  assert.match(indexes, /finance_income_entries_org_estimate_idx/);
  assert.match(indexes, /finance_income_entries_created_by_idx/);
});

test("Invoice issuance and payment state require finance authorization", () => {
  const first = read("supabase/migrations/20260929113720_finance_v2_invoice_role_guard.sql");
  const hardening = read("supabase/migrations/20260929113838_finance_v2_invoice_role_guard_hardening.sql");
  assert.match(first, /sales_commercial_documents_finance_guard/);
  assert.match(hardening, /old\.status in \('issued','paid'\)/);
  assert.match(hardening, /private\.can_access_org_finances\(new\.organization_id\)/);
});


test("Finance roles retain invoice tracking when Estimates is disabled", () => {
  const bridge = read("supabase/migrations/20260929114300_finance_v2_commercial_document_entitlement_bridge.sql");
  assert.match(bridge, /is_billing_module_allowed\(organization_id, 'estimates'\)/);
  assert.match(bridge, /is_billing_module_allowed\(organization_id, 'expenses'\)/);
  assert.match(bridge, /can_access_org_finances\(organization_id\)/);
});

test("Finance service links income to invoice, work and customer and blocks overpayment", () => {
  const service = read("lib/modules/expenses.ts");
  assert.match(service, /export async function createIncome/);
  assert.match(service, /export async function markInvoiceIssuedExternally/);
  assert.match(service, /commercial_document_id/);
  assert.match(service, /Încasarea depășește suma rămasă de primit/);
  assert.match(service, /syncInvoicePaidStatus/);
});

test("Procurement finance bridge tracks supplier cashflow without double-counting task material cost", () => {
  const migration = read("supabase/migrations/20261001234500_wave5_procurement_finance_bridge.sql");
  const finance = read("lib/modules/expenses.ts");
  const tasks = read("lib/modules/tasks.ts");
  const ui = read("components/modules/ExpensesModule.tsx");

  assert.match(migration, /add column if not exists purchase_order_id uuid/);
  assert.match(migration, /finance_expenses_procurement_guard/);
  assert.match(migration, /ops_purchase_order_finance_status/);
  assert.match(migration, /received_without_recorded_expense_cents/);
  assert.match(migration, /security_invoker = true/);
  assert.match(finance, /purchaseOrderId/);
  assert.match(finance, /ops_purchase_order_finance_status/);
  assert.match(finance, /linkedCurrency = \(order\.currency \|\| linkedCurrency\)/);
  assert.match(tasks, /\.is\("purchase_order_id", null\)/);
  assert.match(ui, /Achiziții furnizor/);
  assert.match(ui, /Costul de achiziție intră în cashflow/);
  assert.match(ui, /\+ Cost furnizor/);
});

test("Supplier evidence can inherit Purchase Order context safely", () => {
  const migration = read("supabase/migrations/20261001234500_wave5_procurement_finance_bridge.sql");
  const documents = read("lib/modules/documents.ts");
  const ui = read("components/modules/DocumentsModule.tsx");
  assert.match(migration, /procurement_document_context_guard/);
  assert.match(migration, /purchase_order_task_mismatch/);
  assert.match(documents, /purchaseOrderId/);
  assert.match(documents, /Comanda furnizor nu există în această firmă/);
  assert.match(ui, /Comandă furnizor/);
  assert.match(ui, /PO:/);
});

test("Activity center turns procurement reconciliation gaps into PO-scoped next actions", () => {
  const activity = read("lib/modules/activity.ts");
  const center = read("components/WorkspaceActivityCenter.tsx");
  const financeUi = read("components/modules/ExpensesModule.tsx");
  const nextBest = read("lib/automation/next-best-action.ts");

  assert.match(activity, /ops_purchase_order_finance_status/);
  assert.match(activity, /procurement_cost_missing/);
  assert.match(activity, /procurement_evidence_missing/);
  assert.match(activity, /procurement_cost_variance/);
  assert.match(activity, /purchaseOrderId/);
  assert.match(center, /purchaseOrderId: item\.purchaseOrderId/);
  assert.match(financeUi, /initialPurchaseOrderId \? "procurement" : "overview"/);
  assert.match(nextBest, /procurement_cost_missing/);
  assert.match(nextBest, /purchase-order:/);
});

test("Activity center aggregates the operational sources without a duplicate notifications table", () => {
  const activity = read("lib/modules/activity.ts");
  for (const source of [
    "crm_leads",
    "ops_tasks",
    "calendar_events",
    "sales_estimates",
    "sales_commercial_documents",
    "finance_income_entries",
  ]) {
    assert.match(activity, new RegExp(source));
  }
  assert.doesNotMatch(activity, /from\("notifications"\)/);
});

test("Finance UI clearly separates operational tracking from fiscal issuance", () => {
  const ui = read("components/modules/ExpensesModule.tsx");
  assert.match(ui, /title="Finanțe"/);
  assert.match(ui, /\+ Încasare/);
  assert.match(ui, /Facturi & scadențe/);
  assert.match(ui, /nu emite facturi fiscale/i);
  assert.match(ui, /Confirmă emiterea externă/);
});
