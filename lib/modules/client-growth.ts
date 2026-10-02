import { orbyvenSupabase } from "@/lib/orbyven-supabase";

export type ClientGrowthFeedbackStatus = "idle" | "requested" | "received";
export type ClientGrowthReviewStatus = "idle" | "requested" | "completed" | "declined";
export type ClientGrowthReferralStatus = "idle" | "requested" | "received" | "declined";
export type ClientGrowthUpsellStatus = "idle" | "scheduled" | "offered" | "dismissed";

export type ClientGrowthState = {
  organization_id: string;
  client_id: string;
  feedback_task_id: string | null;
  feedback_status: ClientGrowthFeedbackStatus;
  feedback_score: number | null;
  feedback_note: string | null;
  feedback_requested_at: string | null;
  feedback_received_at: string | null;
  review_status: ClientGrowthReviewStatus;
  review_requested_at: string | null;
  review_completed_at: string | null;
  referral_status: ClientGrowthReferralStatus;
  referral_requested_at: string | null;
  referral_received_at: string | null;
  upsell_status: ClientGrowthUpsellStatus;
  upsell_next_at: string | null;
  upsell_hint: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};


export type ClientGrowthCompletedWork = {
  id: string;
  client_id: string;
  title: string;
  kind: "work" | "order";
  completed_at: string;
};

type GrowthPatch = Partial<Pick<
  ClientGrowthState,
  | "feedback_task_id"
  | "feedback_status"
  | "feedback_score"
  | "feedback_note"
  | "feedback_requested_at"
  | "feedback_received_at"
  | "review_status"
  | "review_requested_at"
  | "review_completed_at"
  | "referral_status"
  | "referral_requested_at"
  | "referral_received_at"
  | "upsell_status"
  | "upsell_next_at"
  | "upsell_hint"
>>;

const GROWTH_FIELDS =
  "organization_id,client_id,feedback_task_id,feedback_status,feedback_score,feedback_note,feedback_requested_at,feedback_received_at,review_status,review_requested_at,review_completed_at,referral_status,referral_requested_at,referral_received_at,upsell_status,upsell_next_at,upsell_hint,updated_by,created_at,updated_at";

function requireIds(organizationId: string, clientId?: string) {
  if (!organizationId.trim()) throw new Error("organization_id is required.");
  if (clientId !== undefined && !clientId.trim()) throw new Error("client_id is required.");
}

function cleanOptional(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function loadLatestCompletedClientWork(
  organizationId: string,
  clientId: string
): Promise<ClientGrowthCompletedWork | null> {
  requireIds(organizationId, clientId);
  const { data, error } = await orbyvenSupabase
    .from("ops_tasks")
    .select("id,client_id,title,kind,completed_at")
    .eq("organization_id", organizationId)
    .eq("client_id", clientId)
    .in("kind", ["work", "order"])
    .eq("status", "done")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return ((data ?? [])[0] as ClientGrowthCompletedWork | undefined) ?? null;
}

export async function listLatestCompletedClientWorks(
  organizationId: string,
  limit = 160
): Promise<ClientGrowthCompletedWork[]> {
  requireIds(organizationId);
  const safeLimit = Math.min(500, Math.max(1, Math.round(limit)));
  const { data, error } = await orbyvenSupabase
    .from("ops_tasks")
    .select("id,client_id,title,kind,completed_at")
    .eq("organization_id", organizationId)
    .in("kind", ["work", "order"])
    .eq("status", "done")
    .not("client_id", "is", null)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw error;

  const latestByClient = new Map<string, ClientGrowthCompletedWork>();
  for (const row of (data ?? []) as ClientGrowthCompletedWork[]) {
    if (!latestByClient.has(row.client_id)) latestByClient.set(row.client_id, row);
  }
  return [...latestByClient.values()];
}

export async function listClientGrowthStates(
  organizationId: string,
  limit = 200
): Promise<ClientGrowthState[]> {
  requireIds(organizationId);
  const safeLimit = Math.min(500, Math.max(1, Math.round(limit)));
  const { data, error } = await orbyvenSupabase
    .from("crm_client_growth")
    .select(GROWTH_FIELDS)
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw error;
  return (data ?? []) as ClientGrowthState[];
}

export async function loadClientGrowthState(
  organizationId: string,
  clientId: string
): Promise<ClientGrowthState | null> {
  requireIds(organizationId, clientId);
  const { data, error } = await orbyvenSupabase
    .from("crm_client_growth")
    .select(GROWTH_FIELDS)
    .eq("organization_id", organizationId)
    .eq("client_id", clientId)
    .limit(1);

  if (error) throw error;
  return ((data ?? [])[0] as ClientGrowthState | undefined) ?? null;
}

async function saveClientGrowthPatch(
  organizationId: string,
  clientId: string,
  patch: GrowthPatch
): Promise<ClientGrowthState> {
  requireIds(organizationId, clientId);
  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const updatedBy = authData.user?.id ?? null;

  const { data: updatedRows, error: updateError } = await orbyvenSupabase
    .from("crm_client_growth")
    .update({ ...patch, updated_by: updatedBy })
    .eq("organization_id", organizationId)
    .eq("client_id", clientId)
    .select(GROWTH_FIELDS);

  if (updateError) throw updateError;
  if (updatedRows?.length) return updatedRows[0] as ClientGrowthState;

  const { data, error } = await orbyvenSupabase
    .from("crm_client_growth")
    .insert({
      organization_id: organizationId,
      client_id: clientId,
      ...patch,
      updated_by: updatedBy,
    })
    .select(GROWTH_FIELDS)
    .single();

  if (error) throw error;
  return data as ClientGrowthState;
}

export async function markClientFeedbackRequested(
  organizationId: string,
  clientId: string,
  taskId: string
) {
  if (!taskId.trim()) throw new Error("task_id is required.");
  const now = new Date().toISOString();
  return saveClientGrowthPatch(organizationId, clientId, {
    feedback_task_id: taskId,
    feedback_status: "requested",
    feedback_score: null,
    feedback_note: null,
    feedback_requested_at: now,
    feedback_received_at: null,
  });
}

export async function recordClientFeedback(
  organizationId: string,
  clientId: string,
  taskId: string,
  score: number,
  note?: string
) {
  if (!taskId.trim()) throw new Error("task_id is required.");
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error("Feedback score must be an integer from 1 to 5.");
  }
  return saveClientGrowthPatch(organizationId, clientId, {
    feedback_task_id: taskId,
    feedback_status: "received",
    feedback_score: score,
    feedback_note: cleanOptional(note),
    feedback_received_at: new Date().toISOString(),
  });
}

export async function setClientReviewStatus(
  organizationId: string,
  clientId: string,
  status: ClientGrowthReviewStatus
) {
  const now = new Date().toISOString();
  return saveClientGrowthPatch(organizationId, clientId, {
    review_status: status,
    review_requested_at: status === "requested" ? now : undefined,
    review_completed_at: status === "completed" ? now : null,
  });
}

export async function setClientReferralStatus(
  organizationId: string,
  clientId: string,
  status: ClientGrowthReferralStatus
) {
  const now = new Date().toISOString();
  return saveClientGrowthPatch(organizationId, clientId, {
    referral_status: status,
    referral_requested_at: status === "requested" ? now : undefined,
    referral_received_at: status === "received" ? now : null,
  });
}

export async function scheduleClientUpsell(
  organizationId: string,
  clientId: string,
  whenIso: string,
  hint?: string
) {
  const when = new Date(whenIso);
  if (!Number.isFinite(when.getTime())) throw new Error("Invalid upsell date.");
  return saveClientGrowthPatch(organizationId, clientId, {
    upsell_status: "scheduled",
    upsell_next_at: when.toISOString(),
    upsell_hint: cleanOptional(hint),
  });
}

export async function setClientUpsellStatus(
  organizationId: string,
  clientId: string,
  status: ClientGrowthUpsellStatus,
  hint?: string
) {
  return saveClientGrowthPatch(organizationId, clientId, {
    upsell_status: status,
    upsell_next_at: status === "scheduled" ? undefined : null,
    upsell_hint: hint === undefined ? undefined : cleanOptional(hint),
  });
}
