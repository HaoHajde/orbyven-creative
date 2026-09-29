import { NextResponse } from "next/server";
import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import {
  listIntelligenceConversations,
  loadIntelligenceConversation,
} from "@/lib/ai/conversation-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const organizationId = (url.searchParams.get("organizationId") || "").trim();
    const conversationId = (url.searchParams.get("conversationId") || "").trim();

    if (!/^[a-f0-9-]{36}$/i.test(organizationId)) {
      return NextResponse.json({ error: "organization_id invalid" }, { status: 400 });
    }
    if (conversationId && !/^[a-f0-9-]{36}$/i.test(conversationId)) {
      return NextResponse.json({ error: "conversation_id invalid" }, { status: 400 });
    }

    const actor = await authenticateBillingActor(request, organizationId, false);
    const data = conversationId
      ? await loadIntelligenceConversation(actor, conversationId)
      : { conversations: await listIntelligenceConversations(actor) };

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "AUTH_REQUIRED" ? 401 :
      code === "ORG_ACCESS_REQUIRED" ? 403 :
      code === "CONVERSATION_NOT_FOUND" ? 404 :
      500;

    if (status === 500) console.error("ORBYVEN conversation history failure", error);
    return NextResponse.json(
      { error: status === 500 ? "Istoricul ORBYVEN nu este disponibil." : "Acces indisponibil.", code },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
}
