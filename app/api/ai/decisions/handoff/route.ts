import { NextResponse } from "next/server";
import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { answerIntelligenceForActor } from "@/lib/ai/intelligence-server";
import {
  appendUserConversationMessage,
  ensureConversation,
  persistAssistantResponse,
} from "@/lib/ai/conversation-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(code: string) {
  const status =
    code === "AUTH_REQUIRED" ? 401 :
    code === "ORG_ACCESS_REQUIRED" ? 403 :
    code === "CONVERSATION_NOT_FOUND" ? 404 :
    ["DECISION_NOT_AVAILABLE", "DECISION_STALE", "DECISION_HANDOFF_UNAVAILABLE", "DECISION_HANDOFF_INVALID"].includes(code) ? 409 :
    500;

  const message =
    code === "DECISION_NOT_AVAILABLE"
      ? "Nu mai există o comparație validă. Cere din nou opțiunile."
      : code === "DECISION_STALE"
        ? "Focus-ul sau variantele s-au schimbat între timp. Cere din nou comparația înainte de a continua."
        : code === "DECISION_HANDOFF_UNAVAILABLE"
        ? "Varianta nu poate fi transformată acum într-un plan confirmabil."
        : code === "DECISION_HANDOFF_INVALID"
          ? "Planul rezultat nu a trecut verificarea de siguranță."
          : status === 404
            ? "Conversația nu mai este disponibilă."
            : status === 403
              ? "Nu ai acces la acest workspace."
              : status === 401
                ? "Sesiunea a expirat."
                : "Handoff-ul ORBYVEN nu este disponibil.";

  return NextResponse.json(
    { error: message, code },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : "";
    const conversationId = typeof body.conversationId === "string" ? body.conversationId.trim() : "";
    const optionIndex = typeof body.optionIndex === "number" ? body.optionIndex : Number(body.optionIndex);
    const expectedSubject = typeof body.expectedSubject === "string" ? body.expectedSubject.trim() : "";
    const expectedOptionLabel = typeof body.expectedOptionLabel === "string" ? body.expectedOptionLabel.trim() : "";

    if (
      !/^[a-f0-9-]{36}$/i.test(organizationId) ||
      !/^[a-f0-9-]{36}$/i.test(conversationId) ||
      !Number.isInteger(optionIndex) ||
      optionIndex < 0 ||
      optionIndex > 2 ||
      !expectedSubject ||
      expectedSubject.length > 180 ||
      !expectedOptionLabel ||
      expectedOptionLabel.length > 120
    ) {
      return NextResponse.json(
        { error: "Cerere invalidă." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const actor = await authenticateBillingActor(request, organizationId, false);
    await ensureConversation(actor, conversationId, "Decision Support ORBYVEN");

    const current = await answerIntelligenceForActor(
      actor,
      "Compară opțiunile pentru Focus #1",
      conversationId
    );
    const decision = current.decision;
    const option = decision?.options[optionIndex];

    if (!decision || !option) throw new Error("DECISION_NOT_AVAILABLE");
    if (decision.subject !== expectedSubject || option.label !== expectedOptionLabel) {
      throw new Error("DECISION_STALE");
    }
    if (!option.handoffPrompt) throw new Error("DECISION_HANDOFF_UNAVAILABLE");

    const handoff = await answerIntelligenceForActor(
      actor,
      option.handoffPrompt,
      conversationId
    );
    const reviewable = handoff.actions.some(
      (action) => action.kind === "review_plan" || action.kind === "confirm_proposal"
    );
    if (!reviewable) throw new Error("DECISION_HANDOFF_INVALID");

    const userChoice =
      "Aleg varianta „" + option.label + "” pentru „" + decision.subject + "”.";
    await appendUserConversationMessage(actor, conversationId, userChoice);
    await persistAssistantResponse(actor, conversationId, handoff);

    return NextResponse.json(
      {
        ...handoff,
        conversationId,
        handoff: {
          subject: decision.subject,
          optionLabel: option.label,
          optionIndex,
          execution: "proposal_only_explicit_confirmation_required",
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (![
      "AUTH_REQUIRED",
      "ORG_ACCESS_REQUIRED",
      "CONVERSATION_NOT_FOUND",
      "DECISION_NOT_AVAILABLE",
      "DECISION_STALE",
      "DECISION_HANDOFF_UNAVAILABLE",
      "DECISION_HANDOFF_INVALID",
    ].includes(code)) {
      console.error("ORBYVEN Decision Handoff failure", error);
    }
    return errorResponse(code);
  }
}
