import { createBillingServiceClient, type BillingActor } from "@/lib/billing/supabase-server";
import type { IntelligenceMutationType } from "@/lib/ai/intelligence-types";

export type AiActionProposalRow = {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action_type: IntelligenceMutationType;
  payload: Record<string, unknown>;
  summary: string;
  status: "pending" | "executing" | "executed" | "rejected" | "expired" | "failed";
  expires_at: string;
  executed_at: string | null;
  result_type: string | null;
  result_id: string | null;
  failure_code: string | null;
  conversation_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AiProposalInsertRow = {
  id?: string;
  action_type: IntelligenceMutationType;
  payload: Record<string, unknown>;
  summary: string;
  conversation_id?: string | null;
  expires_at?: string | null;
};

type ProposalStateResponse = {
  state?: unknown;
  proposal?: unknown;
};

function asProposal(value: unknown): AiActionProposalRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== "string" ||
    typeof row.organization_id !== "string" ||
    typeof row.action_type !== "string" ||
    typeof row.summary !== "string" ||
    typeof row.status !== "string" ||
    typeof row.expires_at !== "string"
  ) {
    return null;
  }
  return row as unknown as AiActionProposalRow;
}

export async function insertAiActionProposals(
  actor: BillingActor,
  rows: AiProposalInsertRow[]
): Promise<Array<{ id: string; expires_at: string }>> {
  const client = createBillingServiceClient(actor);
  const { data, error } = await client.rpc("ai_action_proposals_insert", {
    p_organization_id: actor.organizationId,
    p_actor_id: actor.userId,
    p_rows: rows,
  });
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error("PROPOSAL_CREATE_FAILED");

  return data.map((item) => {
    if (!item || typeof item !== "object") throw new Error("PROPOSAL_CREATE_FAILED");
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.expires_at !== "string") {
      throw new Error("PROPOSAL_CREATE_FAILED");
    }
    return { id: row.id, expires_at: row.expires_at };
  });
}

export async function listAiActionProposals(
  actor: BillingActor,
  options: { conversationId?: string | null; limit?: number } = {}
): Promise<AiActionProposalRow[]> {
  const client = createBillingServiceClient(actor);
  const { data, error } = await client.rpc("ai_action_proposals_list", {
    p_organization_id: actor.organizationId,
    p_actor_id: actor.userId,
    p_conversation_id: options.conversationId ?? null,
    p_limit: options.limit ?? 128,
  });
  if (error) throw error;
  if (!Array.isArray(data)) return [];
  return data.map(asProposal).filter((row): row is AiActionProposalRow => Boolean(row));
}

export async function rejectAiActionProposal(
  actor: BillingActor,
  proposalId: string
): Promise<{ state: string; proposal: AiActionProposalRow | null }> {
  const client = createBillingServiceClient(actor);
  const { data, error } = await client.rpc("ai_action_proposal_reject", {
    p_organization_id: actor.organizationId,
    p_actor_id: actor.userId,
    p_proposal_id: proposalId,
  });
  if (error) throw error;
  const response = (data ?? {}) as ProposalStateResponse;
  return {
    state: typeof response.state === "string" ? response.state : "not_found",
    proposal: asProposal(response.proposal),
  };
}

export async function claimAiActionProposal(
  actor: BillingActor,
  proposalId: string
): Promise<{ state: string; proposal: AiActionProposalRow | null }> {
  const client = createBillingServiceClient(actor);
  const { data, error } = await client.rpc("ai_action_proposal_claim", {
    p_organization_id: actor.organizationId,
    p_actor_id: actor.userId,
    p_proposal_id: proposalId,
  });
  if (error) throw error;
  const response = (data ?? {}) as ProposalStateResponse;
  return {
    state: typeof response.state === "string" ? response.state : "not_found",
    proposal: asProposal(response.proposal),
  };
}

export async function finishAiActionProposal(
  actor: BillingActor,
  proposalId: string,
  input:
    | { success: true; resultType: string; resultId: string }
    | { success: false; failureCode: string }
): Promise<void> {
  const client = createBillingServiceClient(actor);
  const { data, error } = await client.rpc("ai_action_proposal_finish", {
    p_organization_id: actor.organizationId,
    p_actor_id: actor.userId,
    p_proposal_id: proposalId,
    p_success: input.success,
    p_result_type: input.success ? input.resultType : null,
    p_result_id: input.success ? input.resultId : null,
    p_failure_code: input.success ? null : input.failureCode,
  });
  if (error) throw error;
  if (data !== true) throw new Error("PROPOSAL_STATE_UPDATE_FAILED");
}

export async function supersedeAiActionProposals(
  actor: BillingActor,
  proposalIds: string[]
): Promise<number> {
  if (!proposalIds.length) return 0;
  const client = createBillingServiceClient(actor);
  const { data, error } = await client.rpc("ai_action_proposals_supersede", {
    p_organization_id: actor.organizationId,
    p_actor_id: actor.userId,
    p_proposal_ids: proposalIds,
  });
  if (error) throw error;
  return typeof data === "number" ? data : Number(data ?? 0);
}
