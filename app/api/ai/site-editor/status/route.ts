import { NextResponse } from "next/server";
import {
  authenticateBillingActor, createBillingServiceClient,
} from "@/lib/billing/supabase-server";
import { cloudflareAiReady, editorAiProvider, type EditorAiProvider } from "@/lib/ai/provider-selection";

export const dynamic = "force-dynamic";

function respond(enabled: boolean, reason: string, status = 200, provider: EditorAiProvider = "local") {
  return NextResponse.json({enabled, reason, provider}, {
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

  const provider = editorAiProvider();
  if (provider === "local") {
    return respond(false, "Design Engine gratuit este activ. Textele noi pot fi introduse manual; pentru copywriting AI poți conecta ulterior Cloudflare Workers AI sau OpenAI.", 200, "local");
  }
  if (process.env.VERCEL_ENV === "production") {
    return respond(false, "Modelele lingvistice sunt închise în Production pe durata etapei Alpha.");
  }
  if (process.env.ORBYVEN_AI_EDITOR_ENABLED?.trim().toLowerCase() !== "true") {
    return respond(false, "Modelul lingvistic este dezactivat în Preview. Motorul local funcționează gratuit.");
  }
  if (provider === "openai" && !process.env.OPENAI_API_KEY?.trim()) {
    return respond(false, "Cheia OpenAI nu este configurată pe server.", 200, provider);
  }
  if (provider === "cloudflare" && !cloudflareAiReady()) {
    return respond(false, "Configurează Cloudflare Account ID și tokenul Workers AI în Vercel Preview. Motorul local funcționează gratuit.", 200, provider);
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

  return respond(true,
    provider === "cloudflare"
      ? "Modelul Cloudflare este configurat. Cota sa gratuită poate fi limitată; designul local nu consumă Neurons."
      : "Modelul OpenAI este configurat. Creditele API sunt verificate la trimiterea cererii; designul local nu consumă tokenuri.",
    200, provider);
}
