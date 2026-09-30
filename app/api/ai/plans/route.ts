import { NextResponse } from "next/server";
import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { loadLatestPlanAction } from "@/lib/ai/plan-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const organizationId = (url.searchParams.get("organizationId") || "").trim();
    const conversationId = (url.searchParams.get("conversationId") || "").trim();

    if (!/^[a-f0-9-]{36}$/i.test(organizationId) || !/^[a-f0-9-]{36}$/i.test(conversationId)) {
      return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
    }

    const actor = await authenticateBillingActor(request, organizationId, false);
    const plan = await loadLatestPlanAction(actor, conversationId);
    return NextResponse.json({ plan }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status = code === "AUTH_REQUIRED" ? 401 : code === "ORG_ACCESS_REQUIRED" ? 403 : 500;
    if (status === 500) console.error("ORBYVEN Plan Mode state failure", error);
    return NextResponse.json(
      { error: status === 500 ? "Planul ORBYVEN nu este disponibil." : "Acces indisponibil.", code },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
}
