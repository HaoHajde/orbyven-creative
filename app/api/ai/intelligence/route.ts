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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : "";
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const conversationId =
      typeof body.conversationId === "string" && body.conversationId.trim()
        ? body.conversationId.trim()
        : null;

    if (!/^[a-f0-9-]{36}$/i.test(organizationId)) {
      return NextResponse.json({ error: "organization_id invalid" }, { status: 400 });
    }
    if (conversationId && !/^[a-f0-9-]{36}$/i.test(conversationId)) {
      return NextResponse.json({ error: "conversation_id invalid" }, { status: 400 });
    }
    if (prompt.length < 2 || prompt.length > 1200) {
      return NextResponse.json({ error: "prompt invalid" }, { status: 400 });
    }

    const actor = await authenticateBillingActor(request, organizationId, false);
    const conversation = await ensureConversation(actor, conversationId, prompt);
    await appendUserConversationMessage(actor, conversation.id, prompt);

    const result = await answerIntelligenceForActor(actor, prompt, conversation.id);
    await persistAssistantResponse(actor, conversation.id, result);

    return NextResponse.json(
      { ...result, conversationId: conversation.id },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "AUTH_REQUIRED" ? 401 :
      code === "ORG_ACCESS_REQUIRED" ? 403 :
      code === "CONVERSATION_NOT_FOUND" ? 404 :
      500;
    if (status === 500) console.error("ORBYVEN Intelligence failure", error);
    return NextResponse.json(
      { error: status === 500 ? "ORBYVEN Intelligence indisponibil." : "Acces indisponibil.", code },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
}
