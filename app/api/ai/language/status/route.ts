import { NextResponse } from "next/server";
import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { loadLanguageOpsStatus } from "@/lib/ai/language-status-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const organizationId = (url.searchParams.get("organizationId") || "").trim();

    if (!/^[a-f0-9-]{36}$/i.test(organizationId)) {
      return NextResponse.json({ error: "organization_id invalid" }, { status: 400 });
    }

    const actor = await authenticateBillingActor(request, organizationId, false);
    const status = await loadLanguageOpsStatus(actor);

    return NextResponse.json(status, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "AUTH_REQUIRED" ? 401 :
      code === "ORG_ACCESS_REQUIRED" || code === "AI_ADMIN_REQUIRED" ? 403 :
      500;

    if (status === 500) console.error("ORBYVEN AI status failure", error);
    return NextResponse.json(
      {
        error: status === 500
          ? "Statusul ORBYVEN AI nu este disponibil."
          : "Acces indisponibil.",
        code,
      },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
}
