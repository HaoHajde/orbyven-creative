import { NextResponse } from "next/server";
import {
  authorizeControlCenter,
  ControlCenterHttpError,
  requireStaffRole,
} from "@/lib/orbyven-control-center-server";
import { readIntegrityReport } from "@/lib/orbyven-integrity-server";

export const dynamic = "force-dynamic";

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "audit";
}

export async function GET(request: Request) {
  try {
    const { admin, staffRole } = await authorizeControlCenter(request);
    requireStaffRole(staffRole, ["platform_owner"]);

    const url = new URL(request.url);
    const runId = url.searchParams.get("run_id")?.trim() ?? "";
    if (!runId) {
      throw new ControlCenterHttpError(
        400,
        "integrity_run_required",
        "Run ID is required."
      );
    }

    const report = await readIntegrityReport(admin, runId);
    const filename = `orbyven-integrity-${safeFilename(report.run_key)}.md`;

    return new Response(report.report_markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
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
        error: "integrity_report_download_failed",
        message: "Raportul nu a putut fi descărcat.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
