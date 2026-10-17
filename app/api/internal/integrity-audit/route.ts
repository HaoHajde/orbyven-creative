import { NextResponse } from "next/server";
import { ControlCenterHttpError } from "@/lib/orbyven-control-center-server";
import {
  authorizeIntegrityIngest,
  createIntegrityServiceClient,
  ingestIntegrityRun,
  parseIntegrityIngestPayload,
} from "@/lib/orbyven-integrity-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    authorizeIntegrityIngest(request);

    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("application/json")) {
      throw new ControlCenterHttpError(
        415,
        "integrity_content_type_required",
        "Content-Type must be application/json."
      );
    }

    const raw = await request.json().catch(() => null);
    const payload = parseIntegrityIngestPayload(raw);
    const admin = createIntegrityServiceClient();
    const runId = await ingestIntegrityRun(admin, payload);

    return NextResponse.json(
      { ok: true, run_id: runId },
      {
        status: 201,
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
      {
        error: "integrity_ingest_failed",
        message: "Integrity audit ingest failed.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
