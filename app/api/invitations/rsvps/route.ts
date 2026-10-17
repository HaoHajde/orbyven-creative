import { NextResponse } from "next/server";

import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import {
  isInvitationProjectType,
  type InvitationProjectType,
} from "@/lib/invitations/contracts";
import {
  deleteInvitationRsvp,
  updateInvitationRsvp,
} from "@/lib/invitations/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "AUTH_REQUIRED") {
    return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  }
  if (message === "ORG_ACCESS_REQUIRED") {
    return NextResponse.json({ error: "Acces refuzat." }, { status: 403 });
  }
  if (message === "INVITATION_TABLE_NOT_FOUND") {
    return NextResponse.json({ error: "Masa selectată nu mai există." }, { status: 400 });
  }
  if (message === "INVITATION_PROJECT_NOT_FOUND" || message === "INVITATION_RSVP_NOT_FOUND") {
    return NextResponse.json({ error: "Răspunsul nu mai există." }, { status: 404 });
  }
  console.error("ORBYVEN invitation RSVP admin error", error);
  return NextResponse.json({ error: "Răspunsul nu a putut fi actualizat." }, { status: 500 });
}

async function readJson(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 16_000) {
    return { error: NextResponse.json({ error: "Cerere prea mare." }, { status: 413 }) } as const;
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return { error: NextResponse.json({ error: "Format invalid." }, { status: 415 }) } as const;
  }
  try {
    return { body: (await request.json()) as Record<string, unknown> } as const;
  } catch {
    return { error: NextResponse.json({ error: "JSON invalid." }, { status: 400 }) } as const;
  }
}

function readIdentity(body: Record<string, unknown>) {
  const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : "";
  const rsvpId = typeof body.rsvpId === "string" ? body.rsvpId.trim() : "";
  const projectType = body.projectType;
  if (!organizationId || !UUID_RE.test(rsvpId) || !isInvitationProjectType(projectType)) return null;
  return { organizationId, rsvpId, projectType };
}

function readEditableRsvp(body: Record<string, unknown>) {
  const guestName = typeof body.guestName === "string" ? body.guestName.trim() : "";
  const attending = body.attending;
  const guestCount = Number(body.guestCount);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const tableId = body.tableId === null || body.tableId === ""
    ? null
    : typeof body.tableId === "string" && UUID_RE.test(body.tableId.trim())
      ? body.tableId.trim()
      : undefined;
  if (
    guestName.length < 2 ||
    guestName.length > 120 ||
    typeof attending !== "boolean" ||
    !Number.isInteger(guestCount) ||
    guestCount < 0 ||
    guestCount > 12 ||
    (attending && guestCount < 1) ||
    (!attending && guestCount !== 0) ||
    message.length > 700 ||
    (body.tableId !== undefined && tableId === undefined)
  ) {
    return null;
  }
  return {
    guestName,
    attending,
    guestCount,
    message: message || null,
    ...(body.tableId !== undefined ? { tableId } : {}),
  };
}

function rejectViewer(role: string) {
  return role === "viewer"
    ? NextResponse.json({ error: "Rolul tău este doar pentru vizualizare." }, { status: 403 })
    : null;
}

export async function PATCH(request: Request) {
  try {
    const parsed = await readJson(request);
    if ("error" in parsed) return parsed.error;
    const identity = readIdentity(parsed.body);
    const editable = readEditableRsvp(parsed.body);
    if (!identity || !editable) {
      return NextResponse.json({ error: "Date RSVP invalide." }, { status: 400 });
    }

    const actor = await authenticateBillingActor(request, identity.organizationId, false);
    const viewerError = rejectViewer(actor.role);
    if (viewerError) return viewerError;

    const rsvp = await updateInvitationRsvp({
      actor,
      projectType: identity.projectType as InvitationProjectType,
      rsvpId: identity.rsvpId,
      ...editable,
    });
    return NextResponse.json({ rsvp }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const parsed = await readJson(request);
    if ("error" in parsed) return parsed.error;
    const identity = readIdentity(parsed.body);
    if (!identity) {
      return NextResponse.json({ error: "Răspuns invalid." }, { status: 400 });
    }

    const actor = await authenticateBillingActor(request, identity.organizationId, false);
    const viewerError = rejectViewer(actor.role);
    if (viewerError) return viewerError;

    const deletedId = await deleteInvitationRsvp({
      actor,
      projectType: identity.projectType as InvitationProjectType,
      rsvpId: identity.rsvpId,
    });
    return NextResponse.json({ deletedId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
