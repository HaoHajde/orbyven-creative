import { createBillingServiceClient, type BillingActor } from "@/lib/billing/supabase-server";

export type AiEditorQuotaClaim = {
  requestId: string;
  remainingToday: number;
};

export type AiEditorQuotaFailure =
  | "AI_QUOTA_DAY"
  | "AI_QUOTA_MINUTE"
  | "AI_ACCESS_REVOKED"
  | "AI_QUOTA_UNAVAILABLE";

function quotaError(reason: AiEditorQuotaFailure) {
  return new Error(reason);
}

/**
 * Claim first; only then contact OpenAI.
 * The database RPC serializes concurrent requests on one organization/day row.
 * No in-memory counters: deploys and parallel Vercel instances share the same cap.
 */
export async function claimAiEditorQuota(
  actor: BillingActor
): Promise<AiEditorQuotaClaim> {
  const client = createBillingServiceClient();
  const { data, error } = await client.rpc("ai_editor_claim", {
    p_organization_id: actor.organizationId,
    p_actor_id: actor.userId,
  });

  if (error) {
    // A missing migration must fail CLOSED, never fall back to unmetered AI.
    console.error("ORBYVEN AI claim failure:", error.code);
    throw quotaError("AI_QUOTA_UNAVAILABLE");
  }

  const claim = data as {
    allowed?: boolean;
    reason?: string;
    requestId?: string;
    remainingToday?: number;
  } | null;

  if (!claim?.allowed) {
    if (claim?.reason === "DAILY_LIMIT") throw quotaError("AI_QUOTA_DAY");
    if (claim?.reason === "MINUTE_LIMIT") throw quotaError("AI_QUOTA_MINUTE");
    if (claim?.reason === "ACCESS_REVOKED") throw quotaError("AI_ACCESS_REVOKED");
    throw quotaError("AI_QUOTA_UNAVAILABLE");
  }
  if (
    typeof claim.requestId !== "string" ||
    !/^[a-f0-9-]{36}$/i.test(claim.requestId) ||
    !Number.isSafeInteger(claim.remainingToday) ||
    (claim.remainingToday ?? -1) < 0
  ) {
    throw quotaError("AI_QUOTA_UNAVAILABLE");
  }

  return {
    requestId: claim.requestId,
    remainingToday: claim.remainingToday as number,
  };
}

/** Best effort status update. A consumed claim is never refunded automatically. */
export async function finishAiEditorQuota(
  requestId: string,
  successful: boolean,
  tokens: { inputTokens: number; outputTokens: number } = {
    inputTokens: 0,
    outputTokens: 0,
  }
): Promise<void> {
  const client = createBillingServiceClient();
  const { error } = await client.rpc("ai_editor_finish", {
    p_request_id: requestId,
    p_success: successful,
    p_input_tokens: tokens.inputTokens,
    p_output_tokens: tokens.outputTokens,
  });
  if (error) console.error("ORBYVEN AI finalize failure:", error.code);
}
