import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyBillingWebhookRecord,
  reconcileInvoiceDelivery,
} from "../lib/billing/webhook-state.ts";

test("completed webhook is safe to acknowledge as duplicate", () => {
  assert.equal(
    classifyBillingWebhookRecord({
      processed_at: "2026-09-23T12:00:00Z",
      processing_error: null,
    }),
    "processed"
  );
});

test("failed webhook must be reprocessed, never acknowledged as complete", () => {
  assert.equal(
    classifyBillingWebhookRecord({
      processed_at: null,
      processing_error: "Temporary database failure",
    }),
    "retryable"
  );
});

test("unprocessed webhook without an error is still in-flight or stalled", () => {
  assert.equal(
    classifyBillingWebhookRecord({ processed_at: null, processing_error: null }),
    "pending"
  );
});

test("processed_at takes precedence over stale error text", () => {
  assert.equal(
    classifyBillingWebhookRecord({
      processed_at: "2026-09-23T12:00:00Z",
      processing_error: "old failure",
    }),
    "processed"
  );
});

test("new paid invoice is queued for fiscal issuance", () => {
  assert.deepEqual(reconcileInvoiceDelivery("invoice.paid", null), {
    paid: true,
    fiscalStatus: "pending",
  });
});

test("repeated paid invoice cannot requeue an already issued fiscal document", () => {
  assert.deepEqual(
    reconcileInvoiceDelivery("invoice.paid", {
      status: "paid",
      fiscal_status: "issued",
    }),
    { paid: true, fiscalStatus: "issued" }
  );
});

test("out-of-order payment failure cannot downgrade a paid invoice", () => {
  assert.deepEqual(
    reconcileInvoiceDelivery("invoice.payment_failed", {
      status: "paid",
      fiscal_status: "issued",
    }),
    { paid: true, fiscalStatus: "issued" }
  );
});

test("a failed fiscal issuance requires explicit recovery, not Stripe redelivery", () => {
  assert.deepEqual(
    reconcileInvoiceDelivery("invoice.paid", {
      status: "paid",
      fiscal_status: "failed",
    }),
    { paid: true, fiscalStatus: "failed" }
  );
});
