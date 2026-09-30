import { NextResponse } from "next/server";
import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { recoverPlan } from "@/lib/ai/plan-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      organizationId?: string;
      planId?: string;
    };
    const organizationId = (body.organizationId || "").trim();
    const planId = (body.planId || "").trim();

    if (!/^[a-f0-9-]{36}$/i.test(organizationId) || !/^[a-f0-9-]{36}$/i.test(planId)) {
      return NextResponse.json(
        { error: "Cerere invalidă." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const actor = await authenticateBillingActor(request, organizationId, false);
    const recovery = await recoverPlan(actor, planId);
    return NextResponse.json(
      recovery,
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "AUTH_REQUIRED" ? 401 :
      code === "ORG_ACCESS_REQUIRED" || code === "PLAN_ROLE_REQUIRED" ? 403 :
      code === "PLAN_NOT_FOUND" ? 404 :
      code === "PLAN_ID_INVALID" || code === "PLAN_RECOVERY_NOT_AVAILABLE" ? 400 :
      500;

    if (status === 500) console.error("ORBYVEN Plan Recovery failure", error);

    return NextResponse.json(
      {
        error:
          status === 401 ? "Sesiunea nu mai este validă." :
          status === 403 ? "Rolul tău nu poate reface acest plan." :
          status === 404 ? "Planul nu mai este disponibil." :
          status === 400 ? "Planul nu poate fi refăcut în starea curentă." :
          "Plan Recovery nu este disponibil momentan.",
        code,
      },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
}
