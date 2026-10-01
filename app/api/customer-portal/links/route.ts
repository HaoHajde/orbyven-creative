import { NextResponse } from "next/server";

import {
  authenticatePortalManager,
  createPortalServiceClient,
  generatePortalToken,
  hashPortalToken,
} from "@/lib/portal/server";

export const dynamic = "force-dynamic";

function jsonError(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "portal_error";
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId")?.trim() ?? "";
  const clientId = url.searchParams.get("clientId")?.trim() ?? "";
  if (!organizationId || !clientId) return jsonError(new Error("organizationId și clientId sunt obligatorii."));

  try {
    await authenticatePortalManager(request, organizationId);
    const service = createPortalServiceClient();
    const { data, error } = await service
      .from("client_portal_links")
      .select("id,label,expires_at,revoked_at,created_at")
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;

    return NextResponse.json({
      links: (data ?? []).map((row) => ({
        id: row.id,
        label: row.label ?? null,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at ?? null,
        createdAt: row.created_at,
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return jsonError(error, /AUTH|ACCESS|MANAGER/.test(message) ? 403 : 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      organizationId?: string;
      clientId?: string;
      expiresInDays?: number;
      label?: string;
    };
    const organizationId = body.organizationId?.trim() ?? "";
    const clientId = body.clientId?.trim() ?? "";
    if (!organizationId || !clientId) throw new Error("organizationId și clientId sunt obligatorii.");

    const actor = await authenticatePortalManager(request, organizationId);
    const service = createPortalServiceClient();

    const { data: client, error: clientError } = await service
      .from("crm_leads")
      .select("id,kind")
      .eq("organization_id", organizationId)
      .eq("id", clientId)
      .eq("kind", "client")
      .maybeSingle();
    if (clientError) throw clientError;
    if (!client) throw new Error("Portalul poate fi generat doar pentru un client.");

    const days = Math.max(1, Math.min(90, Math.round(Number(body.expiresInDays ?? 30))));
    const token = generatePortalToken();
    const tokenHash = hashPortalToken(token);
    const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();

    const { data, error } = await service
      .from("client_portal_links")
      .insert({
        organization_id: organizationId,
        client_id: clientId,
        token_hash: tokenHash,
        label: body.label?.trim() || null,
        expires_at: expiresAt,
        created_by: actor.userId,
      })
      .select("id,expires_at")
      .single();
    if (error) throw error;

    const origin = new URL(request.url).origin;
    return NextResponse.json({
      id: data.id,
      url: `${origin}/portal/${token}`,
      expiresAt: data.expires_at,
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return jsonError(error, /AUTH|ACCESS|MANAGER/.test(message) ? 403 : 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json() as { organizationId?: string; linkId?: string };
    const organizationId = body.organizationId?.trim() ?? "";
    const linkId = body.linkId?.trim() ?? "";
    if (!organizationId || !linkId) throw new Error("organizationId și linkId sunt obligatorii.");

    await authenticatePortalManager(request, organizationId);
    const service = createPortalServiceClient();
    const { data, error } = await service
      .from("client_portal_links")
      .update({ revoked_at: new Date().toISOString() })
      .eq("organization_id", organizationId)
      .eq("id", linkId)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Linkul nu mai este activ.");

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return jsonError(error, /AUTH|ACCESS|MANAGER/.test(message) ? 403 : 400);
  }
}
