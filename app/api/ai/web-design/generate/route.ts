import { NextResponse } from "next/server";
import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { readSiteDraft } from "@/lib/ai/site-editor";
import { generateWebDesignForActor } from "@/lib/ai/web-design-server";
import { readWebDesignInterviewFacts } from "@/lib/ai/web-design-interview";
import {
  buildWebDesignProjectPrompt,
  isInvitationProjectMode,
} from "@/lib/ai/web-design-project-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const organizationId =
      typeof body.organizationId === "string" ? body.organizationId.trim() : "";
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const currentDraft = readSiteDraft(body.currentDraft);
    const recentDrafts = Array.isArray(body.recentDrafts)
      ? body.recentDrafts
          .slice(-4)
          .map((item) => readSiteDraft(item))
          .filter((item): item is NonNullable<typeof item> => item !== null)
      : [];
    const interviewFacts = readWebDesignInterviewFacts(body.interviewFacts);

    if (!/^[a-f0-9-]{36}$/i.test(organizationId)) {
      return NextResponse.json({ error: "organization_id invalid" }, { status: 400 });
    }
    if (prompt.length < 2 || prompt.length > 2000) {
      return NextResponse.json({ error: "prompt invalid" }, { status: 400 });
    }
    if (!currentDraft) {
      return NextResponse.json({ error: "draft invalid" }, { status: 400 });
    }

    const project = buildWebDesignProjectPrompt(prompt);
    const actor = await authenticateBillingActor(request, organizationId, false);
    const result = await generateWebDesignForActor(
      actor,
      project.prompt,
      currentDraft,
      recentDrafts,
      interviewFacts
    );

    const payload = isInvitationProjectMode(project.mode)
      ? {
          ...result,
          projectMode: project.mode,
          // Business-specific brief gaps are intentionally hidden for invitations.
          // The generated suggestions remain contextual to the event brief.
          briefGaps: {
            count: 0,
            completionScore: 100,
            labels: [],
            gaps: [],
          },
        }
      : { ...result, projectMode: project.mode };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "AUTH_REQUIRED" ? 401 :
      code === "ORG_ACCESS_REQUIRED" || code === "WEB_DESIGN_EDIT_REQUIRED" ? 403 :
      code === "WEB_DESIGN_AI_QUOTA" ? 429 :
      code === "WEB_DESIGN_AI_NOT_CONFIGURED" ? 503 :
      code.startsWith("WEB_DESIGN_") ? 502 :
      500;

    if (status >= 500) console.error("ORBYVEN Web Design generation failure", error);

    const message =
      code === "WEB_DESIGN_AI_NOT_CONFIGURED"
        ? "Generatorul AI Web Design nu este activat încă în acest mediu."
        : code === "WEB_DESIGN_AI_QUOTA"
          ? "Limita AI Web Design a fost atinsă pentru moment."
          : code === "WEB_DESIGN_EDIT_REQUIRED"
            ? "Rolul tău nu poate modifica designul site-ului."
            : status >= 500
              ? "Generatorul Web Design nu a putut finaliza această variantă."
              : "Acces indisponibil.";

    return NextResponse.json(
      { error: message, code },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
}
