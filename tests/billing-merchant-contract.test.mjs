import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (name) => readFileSync(new URL("../" + name, import.meta.url), "utf8");

test("merchant-scoped Stripe customers are private to the server", () => {
  const sql = source("supabase/migrations/20260928165941_billing_merchant_routing_webhook_recovery_alpha071.sql");
  assert.match(sql, /primary key \(organization_id, merchant_key\)/);
  assert.match(sql, /billing_merchant_customers enable row level security/);
  assert.match(sql, /revoke all on public\.billing_merchant_customers from anon, authenticated/);
});

test("checkout never reuses an unscoped old PFA Stripe Customer ID", () => {
  const checkout = source("app/api/billing/checkout/route.ts");
  assert.match(checkout, /\.from\("billing_merchant_customers"\)/);
  assert.match(checkout, /\.eq\("merchant_key", commercialIdentity\.entityKey\)/);
});

test("old PFA webhook is verified against an independent signing secret", () => {
  const routing = source("lib/billing/merchant-routing.ts");
  assert.match(routing, /stripeArchiveWebhookSecret/);
  assert.match(routing, /archiveKey !== commercialIdentity\.entityKey/);
  const route = source("app/api/billing/webhook/route.ts");
  assert.match(route, /verifiedWebhookMerchant\(payload, signature\)/);
  assert.match(route, /processing_token", leaseToken/);
});

test("fiscal issuer is merchant-scoped and issued invoice is saved before SPV", () => {
  const fiscal = source("lib/billing/fiscal.ts");
  assert.match(fiscal, /\.from\("billing_merchant_customers"\)/);
  assert.match(fiscal, /\.eq\("merchant_key", legalConfig\.entityKey\)/);
  assert.ok(fiscal.indexOf('fiscal_status: "issued"') <
    fiscal.indexOf("const spv = await sendOblioEinvoice("));
});
