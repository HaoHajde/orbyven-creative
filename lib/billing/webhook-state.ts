export type BillingWebhookRecord = {
  processed_at: string | null;
  processing_error: string | null;
};

export type BillingWebhookRecordState = "processed" | "retryable" | "pending";

/** Distinguish successful delivery from an event that is merely recorded. */
export function classifyBillingWebhookRecord(
  record: BillingWebhookRecord
): BillingWebhookRecordState {
  if (record.processed_at) return "processed";
  if (record.processing_error !== null) return "retryable";
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
