import { NextResponse } from "next/server";
import { answerIntelligenceRequest } from "@/lib/ai/intelligence-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : "";
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!/^[a-f0-9-]{36}$/i.test(organizationId)) {
      return NextResponse.json({ error: "organization_id invalid" }, { status: 400 });
    }
    if (prompt.length < 2 || prompt.length > 1200) {
      return NextResponse.json({ error: "prompt invalid" }, { status: 400 });
    }

    const result = await answerIntelligenceRequest(request, organizationId, prompt);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status = code === "AUTH_REQUIRED" ? 401 : code === "ORG_ACCESS_REQUIRED" ? 403 : 500;
    if (status === 500) console.error("ORBYVEN Intelligence failure", error);
    return NextResponse.json(
      { error: status === 500 ? "ORBYVEN Intelligence indisponibil." : "Acces indisponibil." },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
}
