import { NextResponse } from "next/server";
import { ControlCenterHttpError } from "@/lib/orbyven-control-center-server";
import { createIntegrityServiceClient } from "@/lib/orbyven-integrity-server";
import {
  authorizeGuardianWorker,
  completeGuardianAction,
} from "@/lib/orbyven-guardian-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    authorizeGuardianWorker(request);

    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("application/json")) {
      throw new ControlCenterHttpError(
        415,
        "guardian_content_type_required",
        "Content-Type must be application/json."
      );
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ControlCenterHttpError(400, "guardian_payload_invalid", "Invalid Guardian payload.");
    }

    const admin = createIntegrityServiceClient();
    await completeGuardianAction(admin, body);

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    console.error(error);

    if (error instanceof ControlCenterHttpError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { error: "guardian_result_failed", message: "Guardian result update failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
