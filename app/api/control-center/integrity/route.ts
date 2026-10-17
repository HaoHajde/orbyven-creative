import { NextResponse } from "next/server";
import {
  authorizeControlCenter,
  ControlCenterHttpError,
  requireStaffRole,
} from "@/lib/orbyven-control-center-server";
import { requireIntegrityOwner } from "@/lib/orbyven-integrity-owner";
import {
  loadIntegrityPayload,
  queueGuardianFix,
  resolveManualFinding,
} from "@/lib/orbyven-integrity-server";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  console.error(error);

  if (error instanceof ControlCenterHttpError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      error: "integrity_operation_failed",
      message: "Operația de integritate nu a putut fi finalizată.",
    },
    { status: 500, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request: Request) {
  try {
    const { admin, user, staffRole } = await authorizeControlCenter(request);
    requireStaffRole(staffRole, ["platform_owner"]);
    requireIntegrityOwner(user.id);

    const payload = await loadIntegrityPayload(admin);
    const latestRunId = payload.latest_run?.id ?? null;
    const currentPayload = latestRunId
      ? {
          ...payload,
          manual_actions: payload.manual_actions.filter(
            (finding) => finding.run_id === latestRunId
          ),
          ai_actions: payload.ai_actions.filter(
            (finding) => finding.run_id === latestRunId
          ),
        }
      : payload;

    return NextResponse.json(currentPayload, {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { admin, user, staffRole } = await authorizeControlCenter(request);
    requireStaffRole(staffRole, ["platform_owner"]);
    requireIntegrityOwner(user.id);

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    const findingId = typeof body.finding_id === "string" ? body.finding_id.trim() : "";

    if (!findingId) {
      throw new ControlCenterHttpError(
        400,
        "integrity_finding_required",
        "Finding ID is required."
      );
    }

    switch (action) {
      case "queue_guardian_fix": {
        const actionId = await queueGuardianFix(admin, user.id, findingId);
        return NextResponse.json(
          { ok: true, action_id: actionId },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
      case "resolve_manual":
        await resolveManualFinding(admin, user.id, findingId, false);
        return NextResponse.json(
          { ok: true },
          { headers: { "Cache-Control": "no-store" } }
        );
      case "accept_risk":
        await resolveManualFinding(admin, user.id, findingId, true);
        return NextResponse.json(
          { ok: true },
          { headers: { "Cache-Control": "no-store" } }
        );
      default:
        throw new ControlCenterHttpError(
          400,
          "unknown_integrity_action",
          "Unknown integrity action."
        );
    }
  } catch (error) {
    return errorResponse(error);
  }
}
