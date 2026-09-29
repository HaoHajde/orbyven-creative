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

test("Finance service links income to invoice, work and customer and blocks overpayment", () => {
  const service = read("lib/modules/expenses.ts");
  assert.match(service, /export async function createIncome/);
  assert.match(service, /export async function markInvoiceIssuedExternally/);
  assert.match(service, /commercial_document_id/);
  assert.match(service, /Încasarea depășește suma rămasă de primit/);
  assert.match(service, /syncInvoicePaidStatus/);
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
