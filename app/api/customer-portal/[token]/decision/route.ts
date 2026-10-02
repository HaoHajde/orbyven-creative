import { NextResponse } from "next/server";

import {
  createPortalServiceClient,
  digestPortalIp,
  hashPortalToken,
} from "@/lib/portal/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  try {
    const body = await request.json() as {
      estimateId?: string;
      decision?: "accepted" | "rejected";
      actorName?: string;
      confirmed?: boolean;
    };

    const estimateId = body.estimateId?.trim() ?? "";
    const actorName = body.actorName?.trim() ?? "";
    const decision = body.decision;
    if (!estimateId || !actorName || !decision) {
      return NextResponse.json({ error: "Completează numele și decizia." }, { status: 400 });
    }
    if (decision === "accepted" && body.confirmed !== true) {
      return NextResponse.json({ error: "Confirmă că ai citit și accepți oferta." }, { status: 400 });
    }

    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")?.trim()
      || null;
    const ipDigest = digestPortalIp(forwarded);
    const userAgent = request.headers.get("user-agent")?.slice(0, 1000) || null;

    const service = createPortalServiceClient();
    const { data, error } = await service.rpc("client_portal_record_estimate_decision", {
      p_token_hash: hashPortalToken(token),
      p_estimate_id: estimateId,
      p_decision: decision,
      p_actor_name: actorName,
      p_ip_sha256: ipDigest,
      p_user_agent: userAgent,
    });

    if (error) {
      const code = String(error.message || "");
      const status = /portal_link_not_available|estimate_not_available/.test(code) ? 404
        : /estimate_not_actionable|estimate_expired/.test(code) ? 409
        : 400;
      return NextResponse.json({ error: code }, { status });
    }

    return NextResponse.json({ ok: true, evidenceId: data }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[customer-portal-decision]", error);
    return NextResponse.json({ error: "Decizia nu a putut fi înregistrată." }, { status: 500 });
  }
}
