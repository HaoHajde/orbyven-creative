import { NextResponse } from "next/server";
import {
  authenticateBillingActor, createBillingServiceClient,
} from "@/lib/billing/supabase-server";

export const dynamic = "force-dynamic";

function respond(enabled: boolean, reason: string, status = 200) {
  return NextResponse.json({enabled, reason}, {
    status, headers: {"Cache-Control":"no-store"},
  });
}

/**
 * Owner/admin-only readiness check. Does not consume an AI request or expose
 * credentials, tenant allowlist entries or the contents of the quota ledger.
 */
export async function GET(request: Request) {
  const organizationId = new URL(request.url).searchParams.get("organizationId") || undefined;
  if (!organizationId || !/^[a-f0-9-]{36}$/i.test(organizationId)) {
    return respond(false, "Selectează organizația pentru preview.", 400);
  }
  let actor;
  try {
    actor = await authenticateBillingActor(request, organizationId, true);
  } catch (error) {
    const needsLogin = error instanceof Error && error.message === "AUTH_REQUIRED";
    return respond(false, needsLogin ? "Sesiunea a expirat." : "Acces restricționat.", needsLogin ? 401 : 403);
  }

  if (process.env.VERCEL_ENV === "production") {
    return respond(false, "AI-ul este închis în Production pe durata etapei Alpha.");
  }
  if (process.env.ORBYVEN_AI_EDITOR_ENABLED?.trim().toLowerCase() !== "true") {
    return respond(false, "Poți personaliza manual preview-ul. Deploymentul citește ORBYVEN_AI_EDITOR_ENABLED ca dezactivat sau absent. Verifică valoarea true în Vercel Preview, apoi fă Redeploy pe branch-ul editorului.");
  }
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return respond(false, "Cheia AI nu este configurată pe server.");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return respond(false, "Contorul de consum AI nu are cheia server Supabase.");
  }

  const approved = (process.env.ORBYVEN_AI_ALLOWED_ORGANIZATION_IDS || "")
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
  if (!approved.includes(actor.organizationId.toLowerCase())) {
    return respond(false, "Organizația nu este încă aprobată pentru testul AI.");
  }

  try {
    const service = createBillingServiceClient();
    const {error} = await service
      .from("ai_editor_daily_usage")
      .select("organization_id")
      .limit(1);
    if (error) throw error;
  } catch {
    return respond(false, "Migrarea contorului AI trebuie verificată în Supabase.");
  }

  return respond(true, "AI este pregătit pentru un test limitat în Preview.");
}
