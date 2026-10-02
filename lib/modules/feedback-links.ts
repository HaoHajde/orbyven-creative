import { orbyvenSupabase } from "@/lib/orbyven-supabase";

export type ClientFeedbackLink = {
  public_token: string;
  expires_at: string;
  submitted: boolean;
};

export type PublicFeedbackContext = {
  organization_name: string;
  task_title: string;
  available: boolean;
  submitted: boolean;
};

export async function createOrRefreshClientFeedbackLink(
  organizationId: string,
  taskId: string,
  clientId: string
): Promise<ClientFeedbackLink> {
  if (!organizationId.trim()) throw new Error("organization_id is required.");
  if (!taskId.trim()) throw new Error("task_id is required.");
  if (!clientId.trim()) throw new Error("client_id is required.");

  const { data, error } = await orbyvenSupabase.rpc(
    "create_or_refresh_client_feedback_link",
    {
      p_organization_id: organizationId,
      p_task_id: taskId,
      p_client_id: clientId,
    }
  );

  if (error) throw error;
  const row = (data ?? [])[0] as ClientFeedbackLink | undefined;
  if (!row) throw new Error("Feedback link was not returned.");
  return row;
}

export async function loadPublicFeedbackContext(
  token: string
): Promise<PublicFeedbackContext | null> {
  if (!token.trim()) return null;
  const { data, error } = await orbyvenSupabase.rpc(
    "get_public_client_feedback_context",
    { p_token: token }
  );

  if (error) throw error;
  return ((data ?? [])[0] as PublicFeedbackContext | undefined) ?? null;
}

export async function submitPublicClientFeedback(
  token: string,
  score: number,
  note?: string
): Promise<void> {
  if (!token.trim()) throw new Error("Feedback token is required.");
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error("Feedback score must be between 1 and 5.");
  }

  const cleanNote = note?.trim() || null;
  if (cleanNote && cleanNote.length > 1200) {
    throw new Error("Feedback note is too long.");
  }

  const { error } = await orbyvenSupabase.rpc(
    "submit_public_client_feedback",
    {
      p_token: token,
      p_score: score,
      p_note: cleanNote,
    }
  );

  if (error) throw error;
}
