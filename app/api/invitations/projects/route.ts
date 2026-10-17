import { NextResponse } from "next/server";

import { readSiteDraft } from "@/lib/ai/site-editor";
import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import {
  isInvitationProjectType,
  type InvitationProjectType,
} from "@/lib/invitations/contracts";
import {
  loadInvitationAdminState,
  publishInvitationProject,
} from "@/lib/invitations/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "AUTH_REQUIRED") {
    return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  }
  if (message === "ORG_ACCESS_REQUIRED") {
    return NextResponse.json({ error: "Acces refuzat." }, { status: 403 });
  }
  console.error("ORBYVEN invitation project error", error);
  return NextResponse.json(
    { error: "Invitația nu a putut fi salvată momentan." },
    { status: 500 }
  );
}

function publicPayload(state: Awaited<ReturnType<typeof loadInvitationAdminState>>) {
  return {
    project: state.project
      ? {
          id: state.project.id,
          projectType: state.project.projectType,
          slug: state.project.slug,
          title: state.project.title,
          publishedAt: state.project.publishedAt,
          publicPath: `/invitatie/${state.project.slug}`,
        }
      : null,
    rsvps: state.rsvps,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId")?.trim() ?? "";
    const projectType = url.searchParams.get("projectType")?.trim() ?? "";
    if (!organizationId || !isInvitationProjectType(projectType)) {
      return NextResponse.json({ error: "Parametri invalizi." }, { status: 400 });
    }

    const actor = await authenticateBillingActor(request, organizationId, false);
    const state = await loadInvitationAdminState(actor, projectType);
    return NextResponse.json(publicPayload(state), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 120_000) {
      return NextResponse.json({ error: "Proiectul este prea mare." }, { status: 413 });
    }
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Format invalid." }, { status: 415 });
    }

    const body = (await request.json()) as {
      organizationId?: unknown;
      projectType?: unknown;
      draft?: unknown;
    };
    const organizationId =
      typeof body.organizationId === "string" ? body.organizationId.trim() : "";
    if (!organizationId || !isInvitationProjectType(body.projectType)) {
      return NextResponse.json({ error: "Proiect invalid." }, { status: 400 });
    }

    const projectType: InvitationProjectType = body.projectType;
    const actor = await authenticateBillingActor(request, organizationId, false);
    if (actor.role === "viewer") {
      return NextResponse.json({ error: "Rolul tău este doar pentru vizualizare." }, { status: 403 });
    }

    const draft = readSiteDraft(body.draft);
    if (!draft) {
      return NextResponse.json({ error: "Design invalid." }, { status: 400 });
    }

    await publishInvitationProject({ actor, projectType, draft });
    const state = await loadInvitationAdminState(actor, projectType);
    return NextResponse.json(publicPayload(state), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
