import { createBillingServiceClient, type BillingActor } from "@/lib/billing/supabase-server";
import type { IntelligenceResponse, IntelligenceSpecialist } from "@/lib/ai/intelligence-types";

export type IntelligenceConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type IntelligenceConversationMessage = {
  id: string;
  role: "user" | "assistant";
  specialist: IntelligenceSpecialist | null;
  content: string;
  facts: Array<{ label: string; value: string }>;
  createdAt: string;
};

function cleanTitle(prompt: string) {
  const compact = prompt.trim().replace(/\s+/g, " ");
  return compact.slice(0, 120) || "Conversație ORBYVEN";
}

function safeFacts(value: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.label !== "string" || typeof row.value !== "string") return [];
    const label = row.label.trim().slice(0, 80);
    const factValue = row.value.trim().slice(0, 240);
    return label && factValue ? [{ label, value: factValue }] : [];
  });
}

export async function ensureConversation(
  actor: BillingActor,
  conversationId: string | null,
  firstPrompt: string
): Promise<{ id: string; title: string }> {
  const client = createBillingServiceClient(actor);

  if (conversationId) {
    const { data, error } = await client
      .from("ai_conversations")
      .select("id,title")
      .eq("id", conversationId)
      .eq("organization_id", actor.organizationId)
      .eq("actor_id", actor.userId)
      .eq("status", "active")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("CONVERSATION_NOT_FOUND");
    return data;
  }

  const { data, error } = await client
    .from("ai_conversations")
    .insert({
      organization_id: actor.organizationId,
      actor_id: actor.userId,
      title: cleanTitle(firstPrompt),
      status: "active",
    })
    .select("id,title")
    .single();

  if (error || !data) throw error || new Error("CONVERSATION_CREATE_FAILED");
  return data;
}

async function touchConversation(actor: BillingActor, conversationId: string, timestamp: string) {
  const client = createBillingServiceClient(actor);
  const { error } = await client
    .from("ai_conversations")
    .update({ updated_at: timestamp })
    .eq("id", conversationId)
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .eq("status", "active");

  if (error) throw error;
}

export async function appendUserConversationMessage(
  actor: BillingActor,
  conversationId: string,
  prompt: string
) {
  const content = prompt.trim().slice(0, 1200);
  if (content.length < 2) throw new Error("INVALID_CONVERSATION_MESSAGE");

  const client = createBillingServiceClient(actor);
  const timestamp = new Date().toISOString();
  const { error } = await client
    .from("ai_conversation_messages")
    .insert({
      conversation_id: conversationId,
      organization_id: actor.organizationId,
      actor_id: actor.userId,
      role: "user",
      specialist: null,
      content,
      facts: [],
      created_at: timestamp,
    });

  if (error) throw error;
  await touchConversation(actor, conversationId, timestamp);
}

export async function appendAssistantConversationMessage(
  actor: BillingActor,
  conversationId: string,
  input: {
    specialist: IntelligenceSpecialist;
    content: string;
    facts?: Array<{ label: string; value: string }>;
  }
) {
  const content = input.content.trim().slice(0, 6000);
  if (!content) throw new Error("INVALID_CONVERSATION_MESSAGE");

  const client = createBillingServiceClient(actor);
  const timestamp = new Date().toISOString();
  const { error } = await client
    .from("ai_conversation_messages")
    .insert({
      conversation_id: conversationId,
      organization_id: actor.organizationId,
      actor_id: actor.userId,
      role: "assistant",
      specialist: input.specialist,
      content,
      facts: safeFacts(input.facts ?? []),
      created_at: timestamp,
    });

  if (error) throw error;
  await touchConversation(actor, conversationId, timestamp);
}

export async function persistAssistantResponse(
  actor: BillingActor,
  conversationId: string,
  response: IntelligenceResponse
) {
  const focusFacts = response.focus
    ? [
        ...(response.focus.reason
          ? [{ label: "Focus · Motiv", value: response.focus.reason }]
          : []),
        { label: "Focus · De ce", value: response.focus.why },
        { label: "Focus · Risc", value: response.focus.consequence },
        { label: "Focus · Pas", value: response.focus.nextStep },
      ]
    : [];
  const decisionFacts = response.decision
    ? [
        { label: "Decision · Context", value: response.decision.subject },
        { label: "Decision · Handoff", value: response.decision.handoffAvailable ? "yes" : "no" },
        ...response.decision.options.slice(0, 3).map((option, index) => ({
          label: `Decision · ${index + 1}`,
          value: [option.label, option.impact, option.tradeoff, option.whenToUse].join("¦"),
        })),
      ]
    : [];

  const outcomeFacts = response.outcome
    ? [
        { label: "Outcome · Plan", value: response.outcome.planId },
        { label: "Outcome · Status", value: response.outcome.status },
        ...(response.outcome.previousFocus
          ? [{ label: "Outcome · Previous", value: response.outcome.previousFocus }]
          : []),
        ...(response.outcome.currentFocus
          ? [{ label: "Outcome · Current", value: response.outcome.currentFocus }]
          : []),
        { label: "Outcome · Summary", value: response.outcome.summary },
      ]
    : [];

  const baseFacts = response.decision
    ? response.facts.slice(0, 4)
    : response.outcome
      ? response.facts.slice(0, 3)
      : response.facts;

  await appendAssistantConversationMessage(actor, conversationId, {
    specialist: response.specialist,
    content: response.answer,
    facts: [...baseFacts, ...focusFacts, ...decisionFacts, ...outcomeFacts].slice(0, 12),
  });
}


export async function loadRecentConversationContext(
  actor: BillingActor,
  conversationId: string,
  limit = 8
): Promise<IntelligenceConversationMessage[]> {
  const client = createBillingServiceClient(actor);
  const safeLimit = Math.min(12, Math.max(2, Math.round(limit)));
  const { data, error } = await client
    .from("ai_conversation_messages")
    .select("id,role,specialist,content,facts,created_at")
    .eq("conversation_id", conversationId)
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(safeLimit);

  if (error) throw error;
  return (data ?? []).reverse().map((row) => ({
    id: row.id,
    role: row.role as "user" | "assistant",
    specialist: (row.specialist ?? null) as IntelligenceSpecialist | null,
    content: row.content,
    facts: safeFacts(row.facts),
    createdAt: row.created_at,
  }));
}

export async function listIntelligenceConversations(
  actor: BillingActor,
  limit = 20
): Promise<IntelligenceConversationSummary[]> {
  const client = createBillingServiceClient(actor);
  const safeLimit = Math.min(50, Math.max(1, Math.round(limit)));
  const { data, error } = await client
    .from("ai_conversations")
    .select("id,title,updated_at")
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
  }));
}

export async function loadIntelligenceConversation(
  actor: BillingActor,
  conversationId: string
): Promise<{
  conversation: IntelligenceConversationSummary;
  messages: IntelligenceConversationMessage[];
}> {
  const client = createBillingServiceClient(actor);
  const [conversationResult, messagesResult] = await Promise.all([
    client
      .from("ai_conversations")
      .select("id,title,updated_at")
      .eq("id", conversationId)
      .eq("organization_id", actor.organizationId)
      .eq("actor_id", actor.userId)
      .eq("status", "active")
      .maybeSingle(),
    client
      .from("ai_conversation_messages")
      .select("id,role,specialist,content,facts,created_at")
      .eq("conversation_id", conversationId)
      .eq("organization_id", actor.organizationId)
      .eq("actor_id", actor.userId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(100),
  ]);

  if (conversationResult.error) throw conversationResult.error;
  if (messagesResult.error) throw messagesResult.error;
  if (!conversationResult.data) throw new Error("CONVERSATION_NOT_FOUND");

  return {
    conversation: {
      id: conversationResult.data.id,
      title: conversationResult.data.title,
      updatedAt: conversationResult.data.updated_at,
    },
    messages: (messagesResult.data ?? []).map((row) => ({
      id: row.id,
      role: row.role as "user" | "assistant",
      specialist: (row.specialist ?? null) as IntelligenceSpecialist | null,
      content: row.content,
      facts: safeFacts(row.facts),
      createdAt: row.created_at,
    })),
  };
}
