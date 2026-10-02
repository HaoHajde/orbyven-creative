import { NextResponse } from "next/server";

import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { listVideoJobs } from "@/lib/video-ai-job-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  try {
    const actor = await authenticateBillingActor(request, undefined, false);
    const jobs = await listVideoJobs(actor, 12);
    return NextResponse.json({ jobs }, { headers: noStore });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "AUTH_REQUIRED" ? 401 :
      code === "ORG_ACCESS_REQUIRED" ? 403 :
      500;

    if (status >= 500) console.error("ORBYVEN Video AI history failure", error);

    return NextResponse.json(
      {
        error:
          status === 401
            ? "Autentificarea este necesară."
            : status === 403
              ? "Nu există acces la o organizație ORBYVEN."
              : "Istoricul Video AI nu a putut fi încărcat.",
        code,
      },
      { status, headers: noStore }
    );
  }
}
