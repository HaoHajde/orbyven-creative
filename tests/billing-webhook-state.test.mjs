import assert from "node:assert/strict";
import test from "node:test";

import { classifyBillingWebhookRecord } from "../lib/billing/webhook-state.ts";

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
