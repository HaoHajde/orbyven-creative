import { NextResponse } from "next/server";
import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { answerIntelligenceForActor } from "@/lib/ai/intelligence-server";
import {
  appendUserConversationMessage,
  ensureConversation,
  loadRecentConversationContext,
  persistAssistantResponse,
} from "@/lib/ai/conversation-server";
import { resolveConversationFollowUp } from "@/lib/ai/context-resolver";
import { maybePolishIntelligenceResponse } from "@/lib/ai/language-server";

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
    const previousMessages = conversationId
      ? await loadRecentConversationContext(actor, conversation.id)
      : [];
    const context = resolveConversationFollowUp(prompt, previousMessages);

    await appendUserConversationMessage(actor, conversation.id, prompt);

    const result = await answerIntelligenceForActor(
      actor,
      context.effectivePrompt,
      conversation.id
    );
    const contextualResult = context.usedContext
      ? {
          ...result,
          facts: [
            { label: "Context", value: "Completare din mesajul anterior" },
            ...result.facts,
          ].slice(0, 12),
        }
      : result;

    const finalResult = await maybePolishIntelligenceResponse(
      actor,
      conversation.id,
      prompt,
      contextualResult
    );

    await persistAssistantResponse(actor, conversation.id, finalResult);

    return NextResponse.json(
      {
        ...finalResult,
        conversationId: conversation.id,
        contextUsed: context.usedContext,
      },
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
