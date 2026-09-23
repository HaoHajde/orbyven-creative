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
