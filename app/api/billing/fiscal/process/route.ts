import { NextResponse } from "next/server";

import { processPendingFiscalInvoices } from "@/lib/billing/fiscal";
import { getOblioReadiness, oblioConfig } from "@/lib/billing/oblio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const readiness = getOblioReadiness();

  if (!readiness.enabled) {
    return NextResponse.json({ skipped: true, reason: "Oblio adapter is disabled." });
  }
  if (!readiness.ready) {
    return NextResponse.json({ error: "Fiscal adapter is not fully configured." }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${oblioConfig.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const results = await processPendingFiscalInvoices(10);
    return NextResponse.json({ processed: results.length, results });
  } catch {
    return NextResponse.json({ error: "Fiscal queue processing failed." }, { status: 500 });
  }
}
