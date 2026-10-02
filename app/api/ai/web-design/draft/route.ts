import { NextResponse } from "next/server";
import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { readSiteDraft } from "@/lib/ai/site-editor";
import {
  loadWebDesignDraft,
  saveWebDesignDraft,
} from "@/lib/ai/web-design-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validOrganizationId(value: string) {
  return /^[a-f0-9-]{36}$/i.test(value);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId")?.trim() ?? "";
    if (!validOrganizationId(organizationId)) {
      return NextResponse.json({ error: "organization_id invalid" }, { status: 400 });
    }

    const actor = await authenticateBillingActor(request, organizationId, false);
    const result = await loadWebDesignDraft(actor);
    return NextResponse.json(
      { draft: result?.draft ?? null, revision: result?.revision ?? null, updatedAt: result?.updatedAt ?? null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "AUTH_REQUIRED" ? 401 :
      code === "ORG_ACCESS_REQUIRED" ? 403 :
      500;
    if (status === 500) console.error("ORBYVEN Web Design draft load failure", error);
    return NextResponse.json(
      { error: status === 500 ? "Draftul nu a putut fi încărcat." : "Acces indisponibil.", code },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const organizationId =
      typeof body.organizationId === "string" ? body.organizationId.trim() : "";
    const draft = readSiteDraft(body.draft);
    const source =
      body.source === "ai" || body.source === "preset" || body.source === "local"
        ? body.source
        : "local";
    const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 2000) : null;

    if (!validOrganizationId(organizationId)) {
      return NextResponse.json({ error: "organization_id invalid" }, { status: 400 });
    }
    if (!draft) {
      return NextResponse.json({ error: "draft invalid" }, { status: 400 });
    }

    const actor = await authenticateBillingActor(request, organizationId, false);
    const result = await saveWebDesignDraft(actor, draft, source, prompt);
    return NextResponse.json(
      { ok: true, revision: result.revision, updatedAt: result.updatedAt },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "AUTH_REQUIRED" ? 401 :
      code === "ORG_ACCESS_REQUIRED" || code === "WEB_DESIGN_EDIT_REQUIRED" ? 403 :
      code === "WEB_DESIGN_DRAFT_INVALID" ? 400 :
      500;
    if (status === 500) console.error("ORBYVEN Web Design draft save failure", error);
    return NextResponse.json(
      { error: status === 500 ? "Draftul nu a putut fi salvat." : "Acces indisponibil.", code },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
}
