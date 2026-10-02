import { NextResponse } from "next/server";
import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { ensureConversation } from "@/lib/ai/conversation-server";
import { recheckActionOutcome } from "@/lib/ai/action-outcome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(code: string) {
  const status =
    code === "AUTH_REQUIRED" ? 401 :
    code === "ORG_ACCESS_REQUIRED" ? 403 :
    code === "CONVERSATION_NOT_FOUND" || code === "OUTCOME_PLAN_NOT_FOUND" ? 404 :
    code === "OUTCOME_PLAN_NOT_COMPLETE" ? 409 :
    500;

  const message =
    code === "OUTCOME_PLAN_NOT_COMPLETE"
      ? "Planul nu este încă finalizat. Outcome Loop pornește numai după ultimul pas executat."
      : code === "OUTCOME_PLAN_NOT_FOUND"
        ? "Planul nu mai este disponibil pentru acest re-check."
        : code === "CONVERSATION_NOT_FOUND"
          ? "Conversația nu mai este disponibilă."
          : status === 403
            ? "Nu ai acces la acest workspace."
            : status === 401
              ? "Sesiunea a expirat."
              : "Outcome Loop ORBYVEN nu este disponibil.";

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
    const planId = typeof body.planId === "string" ? body.planId.trim() : "";

    if (
      !/^[a-f0-9-]{36}$/i.test(organizationId) ||
      !/^[a-f0-9-]{36}$/i.test(conversationId) ||
      !/^[a-f0-9-]{36}$/i.test(planId)
    ) {
      return NextResponse.json(
        { error: "Cerere invalidă." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const actor = await authenticateBillingActor(request, organizationId, false);
    await ensureConversation(actor, conversationId, "Outcome Loop ORBYVEN");
    const response = await recheckActionOutcome(actor, conversationId, planId);

    return NextResponse.json(
      { ...response, conversationId },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (![
      "AUTH_REQUIRED",
      "ORG_ACCESS_REQUIRED",
      "CONVERSATION_NOT_FOUND",
      "OUTCOME_PLAN_NOT_FOUND",
      "OUTCOME_PLAN_NOT_COMPLETE",
    ].includes(code)) {
      console.error("ORBYVEN Action Outcome failure", error);
    }
    return errorResponse(code);
  }
}
