import { NextResponse } from "next/server";
import { ControlCenterHttpError } from "@/lib/orbyven-control-center-server";
import { createIntegrityServiceClient } from "@/lib/orbyven-integrity-server";
import {
  authorizeGuardianWorker,
  claimGuardianAction,
} from "@/lib/orbyven-guardian-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    authorizeGuardianWorker(request);
    const admin = createIntegrityServiceClient();
    const job = await claimGuardianAction(admin);

    if (!job) {
      return new Response(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return NextResponse.json(job, {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
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
      { error: "guardian_claim_failed", message: "Guardian claim failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
