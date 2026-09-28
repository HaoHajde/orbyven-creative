export type BillingWebhookRecord = {
  processed_at: string | null;
  processing_error: string | null;
  processing_started_at?: string;
};

export type BillingWebhookRecordState = "processed" | "retryable" | "pending" | "stalled";

/** Distinguish successful delivery from an event that is merely recorded. */
export function classifyBillingWebhookRecord(
  record: BillingWebhookRecord,
  now = Date.now(),
  stallAfterMs = 15 * 60_000
): BillingWebhookRecordState {
  if (record.processed_at) return "processed";
  if (record.processing_error !== null) return "retryable";
  if (record.processing_started_at &&
    new Date(record.processing_started_at).getTime() + stallAfterMs < now) return "stalled";
  return "pending";
}

export type BillingInvoiceState = {
  status: string;
  fiscal_status: string;
};

/** Never requeue fiscal issuance solely because Stripe redelivered an invoice event. */
export function reconcileInvoiceDelivery(
  eventType: string,
  existing: BillingInvoiceState | null
): { paid: boolean; fiscalStatus: string } {
  const paid = eventType === "invoice.paid" || existing?.status === "paid";
  const priorFiscalStatus = existing?.fiscal_status;
  const fiscalStatus =
    priorFiscalStatus && ["issued", "processing", "failed"].includes(priorFiscalStatus)
      ? priorFiscalStatus
      : paid ? "pending" : "skipped";

  return { paid, fiscalStatus };
}
