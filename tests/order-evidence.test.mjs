import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateCheckoutPrice,parseVerifiedCheckoutOutcome,OrderEvidenceError }
  from "../lib/billing/order-evidence-guards.ts";
import { hashOrderOffer } from "../lib/billing/order-offer-hash.ts";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const migration=read("supabase/migrations/20260928165937_billing_order_evidence_alpha071.sql");
const route=read("app/api/billing/checkout/route.ts");
const stripe=read("lib/billing/stripe-rest.ts");
const webhook=read("app/api/billing/webhook/route.ts");
const sync=read("lib/billing/order-evidence-sync.ts");
const legalAPI=read("app/api/control-center/compliance/route.ts");
const legalUI=read("app/control-center/legal/page.tsx");
const price={
  id:"price_test",active:true,currency:"ron",unit_amount:39900,
  billing_scheme:"per_unit",livemode:false,tax_behavior:"inclusive",type:"recurring",
  recurring:{interval:"month",interval_count:1,usage_type:"licensed"},
};
const expected={priceId:"price_test",amountMinor:39900,live:false,taxLabel:"Preț final afișat"};
const complete={
  id:"cs_test",amount_total:39900,currency:"ron",payment_status:"paid",
  livemode:false,total_details:{amount_tax:0,amount_discount:0},
};

test("Stripe monthly plan must match the price, currency, interval, tax and mode shown",()=>{
  assert.equal(validateCheckoutPrice(price,expected),price);
  for(const field of [
    {currency:"eur"},{unit_amount:49900},{active:false},{livemode:true},
    {billing_scheme:"tiered"},{tax_behavior:"exclusive"},
    {recurring:{interval:"year",interval_count:1,usage_type:"licensed"}},
  ])assert.throws(()=>validateCheckoutPrice({...price,...field},expected),OrderEvidenceError);
  assert.throws(()=>validateCheckoutPrice(price,{...expected,taxLabel:"tratament TVA de configurat"}),OrderEvidenceError);
});

test("signed Stripe outcome rejects higher total, wrong mode, currency, ID or bad tax data",()=>{
  assert.equal(parseVerifiedCheckoutOutcome(complete,{id:"cs_test",offerAmountMinor:39900,live:false})
    .checkout_final_amount_minor,39900);
  for(const field of [
    {id:"cs_other"},{currency:"eur"},{livemode:true},{amount_total:49900},
    {total_details:{amount_tax:-100,amount_discount:0}},
    {payment_status:"unknown"},
  ])assert.throws(()=>parseVerifiedCheckoutOutcome({...complete,...field},{
    id:"cs_test",offerAmountMinor:39900,live:false,
  }),OrderEvidenceError);
});

test("Stripe buyer identity is snapshotted without retaining payment-card data",()=>{
  const done=parseVerifiedCheckoutOutcome({...complete,customer:"cus_123",customer_details:{
    name:"Pilot SRL",email:"pilot@example.com",tax_ids:[{value:"RO12345678"}],
    address:{city:"București",country:"RO",card_number:"never-copy"},
  }},{id:"cs_test",offerAmountMinor:39900,live:false});
  assert.equal(done.checkout_buyer_name,"Pilot SRL");
  assert.equal(done.checkout_buyer_tax_id,"RO12345678");
  assert.equal(done.checkout_billing_address.city,"București");
  assert.equal("card_number" in done.checkout_billing_address,false);
});

test("unpaid checkout status is recorded as provider status, never implied paid",()=>{
  assert.equal(parseVerifiedCheckoutOutcome({...complete,payment_status:"unpaid"},{
    id:"cs_test",offerAmountMinor:39900,live:false,
  }).checkout_payment_status,"unpaid");
});

test("accepted offer digest is stable across JSONB field order and changes on tampering",()=>{
  const one={plan:"start",nested:{z:1,a:2},modules:["crm","work"]};
  const two={modules:["crm","work"],nested:{a:2,z:1},plan:"start"};
  assert.equal(hashOrderOffer(one),hashOrderOffer(two));
  assert.notEqual(hashOrderOffer(one),hashOrderOffer({...two,plan:"pro"}));
  assert.match(hashOrderOffer(one),/^[0-9a-f]{64}$/);
});

test("billing evidence is server-only and cannot be edited after completion",()=>{
  assert.match(migration,/alter table public\.billing_order_evidence enable row level security/);
  assert.match(migration,/revoke all privileges on public\.billing_order_evidence from public,anon,authenticated/);
  assert.match(migration,/public\.billing_terms_acceptances t[\s\S]*?s\.organization_id = new\.organization_id/);
  assert.match(migration,/offer_snapshot is distinct from old\.offer_snapshot/);
  assert.match(migration,/old\.status = 'checkout_completed'/);
  assert.match(migration,/billing_order_evidence_guard/);
});

test("checkout saves accepted snapshot before creating the Stripe session",()=>{
  assert.ok(route.indexOf('from("billing_order_evidence")') < route.indexOf("await createStripeCheckoutSession"));
  assert.match(route,/requirePublishedStripePrice/);
  assert.match(route,/hashOrderOffer\(offer\)/);
  assert.match(route,/terms_acceptance_id:termsId/);
  assert.match(route,/subscription_acceptance_id:subscriptionId/);
  assert.match(stripe,/metadata\[order_evidence_id\]/);
  assert.match(stripe,/metadata\[price_id\]/);
  assert.match(stripe,/allow_promotion_codes", "false"/);
  assert.match(webhook,/syncStripeCheckoutCompleted\(client, event\.data\.object, verifiedMerchantKey, event\.id\)/);
  assert.match(sync,/stripe_checkout_session_id:sessionId/);
  assert.match(sync,/hashOrderOffer\(snapshot\)/);
});

test("internal dossier separates accepted offer from Stripe result",()=>{
  assert.match(legalAPI,/orderEvidence:ordersResult\.data/);
  assert.match(legalUI,/Oferte și comenzi păstrate ca dovadă/);
  assert.match(legalUI,/Finalizarea checkoutului nu dovedește/);
});
