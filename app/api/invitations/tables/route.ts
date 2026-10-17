import { NextResponse } from "next/server";

import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import {
  isInvitationProjectType,
  type InvitationProjectType,
} from "@/lib/invitations/contracts";
import {
  createInvitationTable,
  deleteInvitationTable,
  updateInvitationTable,
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
  if (message === "INVITATION_PROJECT_NOT_FOUND" || message === "INVITATION_TABLE_NOT_FOUND") {
    return NextResponse.json({ error: "Masa nu mai există." }, { status: 404 });
  }
  console.error("ORBYVEN invitation seating error", error);
  return NextResponse.json({ error: "Aranjarea meselor nu a putut fi actualizată." }, { status: 500 });
}

async function readJson(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 8_000) {
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

function readIdentity(body: Record<string, unknown>, requireTableId: boolean) {
  const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : "";
  const projectType = body.projectType;
  const tableId = typeof body.tableId === "string" ? body.tableId.trim() : "";
  if (
    !organizationId ||
    !isInvitationProjectType(projectType) ||
    (requireTableId && !UUID_RE.test(tableId))
  ) return null;
  return { organizationId, projectType, tableId };
}

function readTable(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const capacity = Number(body.capacity);
  if (name.length < 1 || name.length > 60 || !Number.isInteger(capacity) || capacity < 1 || capacity > 30) {
    return null;
  }
  return { name, capacity };
}

function rejectViewer(role: string) {
  return role === "viewer"
    ? NextResponse.json({ error: "Rolul tău este doar pentru vizualizare." }, { status: 403 })
    : null;
}

export async function POST(request: Request) {
  try {
    const parsed = await readJson(request);
    if ("error" in parsed) return parsed.error;
    const identity = readIdentity(parsed.body, false);
    const editable = readTable(parsed.body);
    if (!identity || !editable) {
      return NextResponse.json({ error: "Date masă invalide." }, { status: 400 });
    }
    const actor = await authenticateBillingActor(request, identity.organizationId, false);
    const viewerError = rejectViewer(actor.role);
    if (viewerError) return viewerError;
    const table = await createInvitationTable({
      actor,
      projectType: identity.projectType as InvitationProjectType,
      ...editable,
    });
    return NextResponse.json({ table }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = await readJson(request);
    if ("error" in parsed) return parsed.error;
    const identity = readIdentity(parsed.body, true);
    const editable = readTable(parsed.body);
    if (!identity || !editable) {
      return NextResponse.json({ error: "Date masă invalide." }, { status: 400 });
    }
    const actor = await authenticateBillingActor(request, identity.organizationId, false);
    const viewerError = rejectViewer(actor.role);
    if (viewerError) return viewerError;
    const table = await updateInvitationTable({
      actor,
      projectType: identity.projectType as InvitationProjectType,
      tableId: identity.tableId,
      ...editable,
    });
    return NextResponse.json({ table }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const parsed = await readJson(request);
    if ("error" in parsed) return parsed.error;
    const identity = readIdentity(parsed.body, true);
    if (!identity) {
      return NextResponse.json({ error: "Masă invalidă." }, { status: 400 });
    }
    const actor = await authenticateBillingActor(request, identity.organizationId, false);
    const viewerError = rejectViewer(actor.role);
    if (viewerError) return viewerError;
    const deletedId = await deleteInvitationTable({
      actor,
      projectType: identity.projectType as InvitationProjectType,
      tableId: identity.tableId,
    });
    return NextResponse.json({ deletedId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
