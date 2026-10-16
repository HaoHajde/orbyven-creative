import { NextResponse } from "next/server";

import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { getVideoJob } from "@/lib/video-ai-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const validJobId = /^[A-Za-z0-9_-]{12,80}$/;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!validJobId.test(id)) {
      return NextResponse.json({ error: "job id invalid" }, { status: 400, headers: noStore });
    }

    const actor = await authenticateBillingActor(request, undefined, false);
    const job = await getVideoJob(actor, id);

    if (!job) {
      return NextResponse.json({ error: "job not found" }, { status: 404, headers: noStore });
    }

    return NextResponse.json({ job }, { headers: noStore });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status = code === "AUTH_REQUIRED" ? 401 : code === "ORG_ACCESS_REQUIRED" ? 403 : 500;

    if (status >= 500) console.error("ORBYVEN Video AI status failure", error);

    return NextResponse.json(
      {
        error:
          status === 401
            ? "Autentificarea este necesară."
            : status === 403
              ? "Nu există acces la organizația ORBYVEN."
              : "Statusul randării nu a putut fi încărcat.",
        code,
      },
      { status, headers: noStore },
    );
  }
}
