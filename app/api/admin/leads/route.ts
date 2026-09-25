import { NextResponse } from "next/server";
import {
  authorizeControlCenter,
  ControlCenterHttpError,
  requireStaffRole,
} from "@/lib/orbyven-control-center-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIELDS = "id,name,email,project_type,budget,message,status,created_at";
const ALLOWED_STATUSES = new Set(["new", "contacted", "won", "lost"]);

function errorResponse(error: unknown) {
  if (error instanceof ControlCenterHttpError) {
    return NextResponse.json(
      { error: error.code },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  }
  console.error("Admin leads operation failed", error);
  return NextResponse.json(
    { error: "admin_leads_operation_failed" },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: Request) {
  try {
    const { admin, staffRole } = await authorizeControlCenter(request);
    requireStaffRole(staffRole, ["platform_owner", "platform_admin"]);
    const { data, error } = await admin
      .from("leads")
      .select(FIELDS)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return NextResponse.json(
      { leads: data ?? [] },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { admin, user, staffRole } = await authorizeControlCenter(request);
    requireStaffRole(staffRole, ["platform_owner", "platform_admin"]);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    const { id, status } = body as { id?: unknown; status?: unknown };
    if (
      typeof id !== "number" ||
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      typeof status !== "string" ||
      !ALLOWED_STATUSES.has(status)
    ) {
      return NextResponse.json({ error: "invalid_lead_status" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("leads")
      .update({ status })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "lead_not_found" }, { status: 404 });
    }
    const { error: auditError } = await admin.from("platform_audit_log").insert({
      actor_user_id: user.id,
      actor_role: staffRole,
      action: "legacy_lead.status_updated",
      target_type: "lead",
      target_id: String(id),
      metadata: { status },
    });
    if (auditError) console.error("Admin lead audit log failed", auditError);
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
