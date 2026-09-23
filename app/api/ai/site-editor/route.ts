import { NextResponse } from "next/server";
import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { readSiteDraft } from "@/lib/ai/site-editor";
import { suggestSiteEdit } from "@/lib/ai/openai-server";
import { claimAiEditorQuota, finishAiEditorQuota } from "@/lib/ai/quota-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (error: string, status: number, code?: string) =>
  NextResponse.json(
    code ? { error, code } : { error },
    { status, headers: { "Cache-Control": "no-store" } }
  );

export async function POST(request: Request) {
  // Alpha is only for a controlled Preview deployment; never bill production accidentally.
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.ORBYVEN_AI_EDITOR_ENABLED?.trim().toLowerCase() !== "true"
  ) {
    return fail("Editorul AI este dezactivat pentru acest mediu.", 503);
  }

  const credential = process.env.OPENAI_API_KEY?.trim();
  if (!credential) return fail("Serviciul AI nu este configurat.", 503);

  if (Number(request.headers.get("content-length") || 0) > 12000) {
    return fail("Cerere prea mare.", 413);
  }

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 12000) return fail("Cerere prea mare.", 413);
    body = JSON.parse(raw) as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw Error("Invalid input");
    }
  } catch {
    return fail("Cerere invalidă.", 400);
  }

  const organizationId = body.organizationId;
  const draft = readSiteDraft(body.draft);
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (
    !draft ||
    typeof organizationId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(organizationId) ||
    prompt.length < 4 ||
    prompt.length > 600
  ) {
    return fail("Date invalide.", 400);
  }

  let actor;
  try {
    actor = await authenticateBillingActor(request, organizationId, true);
  } catch (error) {
    const needsLogin = error instanceof Error && error.message === "AUTH_REQUIRED";
    return fail(
      needsLogin
        ? "Autentifică-te din nou."
        : "Nu ai drept de editare pentru această organizație.",
      needsLogin ? 401 : 403
    );
  }

  // Even when Preview is enabled, only explicitly selected pilot organizations may spend tokens.
  const allowedOrganizations = (process.env.ORBYVEN_AI_ALLOWED_ORGANIZATION_IDS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!allowedOrganizations.includes(actor.organizationId.toLowerCase())) {
    return fail("Editorul AI nu este activat pentru firma ta.", 403);
  }

  let claim;
  try {
    claim = await claimAiEditorQuota(actor);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason === "AI_QUOTA_DAY") {
      return fail("Limita de 8 solicitări AI pe zi pentru firmă a fost atinsă.", 429);
    }
    if (reason === "AI_QUOTA_MINUTE") {
      return fail("Așteaptă un minut înainte de următoarea modificare AI.", 429);
    }
    if (reason === "AI_ACCESS_REVOKED") {
      return fail("Accesul la această organizație nu mai este activ.", 403);
    }
    return fail("Controlul de consum AI nu este pregătit. Editorul rămâne oprit.", 503);
  }

  let success = false;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const result = await suggestSiteEdit(draft, prompt, credential);
    inputTokens = result.usage.inputTokens;
    outputTokens = result.usage.outputTokens;
    success = true;
    return NextResponse.json(
      {
        draft: result.draft,
        message: result.message,
        remainingToday: claim.remainingToday,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    // Provider 429 has several distinct causes. Preserve a safe, actionable
    // classification; do not return raw upstream error text or credentials.
    if (reason === "OPENAI_CREDITS") {
      return fail("Contul OpenAI API nu mai are credite disponibile sau cota API este insuficientă. Verifică Billing din platform.openai.com; abonamentul ChatGPT este separat.", 503, reason);
    }
    if (reason === "OPENAI_BILLING_LIMIT") {
      return fail("OpenAI API a atins o limită de cheltuieli a organizației sau proiectului. Verifică limitele și Billing în OpenAI Platform.", 503, reason);
    }
    if (reason === "OPENAI_USAGE_LIMIT") {
      return fail("OpenAI API a atins limita aprobată de utilizare. Verifică pagina Limits din OpenAI Platform.", 503, reason);
    }
    if (reason === "OPENAI_TEMP_LIMIT" || reason === "AI_RATE_LIMIT") {
      return fail("OpenAI API limitează temporar viteza cererilor. Așteaptă și încearcă din nou o singură dată.", 429, "OPENAI_TEMP_LIMIT");
    }
    if (reason === "OPENAI_BAD_KEY") {
      return fail("Cheia OpenAI API din Vercel Preview este invalidă ori revocată. Verifică setarea fără să trimiți cheia în chat.", 503, reason);
    }
    if (reason === "OPENAI_ACCESS_DENIED") {
      return fail("Cheia/proiectul OpenAI nu are permisiunea necesară pentru acest model sau API.", 503, reason);
    }
    if (reason === "OPENAI_BAD_REQUEST" || reason === "AI_MODEL_INVALID") {
      return fail("OpenAI a respins modelul sau formatul cererii. Verifică ORBYVEN_AI_MODEL și configurația API.", 502, "OPENAI_BAD_REQUEST");
    }
    return fail("Serviciul OpenAI nu a putut procesa solicitarea acum. Editorul local rămâne disponibil.", 502, "OPENAI_PROVIDER_UNAVAILABLE");
  } finally {
    // Keep request reserved if worker crashes; failed requests also consume quota.
    try {
      await finishAiEditorQuota(claim.requestId, success, {
        inputTokens,
        outputTokens,
      });
    } catch {
      console.error("ORBYVEN AI finalize unavailable");
    }
  }
}
