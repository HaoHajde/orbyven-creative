import { NextResponse } from "next/server";
import { getWorkspacePresentationConfig } from "@/lib/workspace-ui";

/**
 * Only the public Supabase URL and publishable key are returned here.
 * Never add service_role, billing secrets, or user-specific information.
 * Desktop has its own locally bundled UI and connects to the same RLS-backed API.
 */
export const dynamic = "force-dynamic";

function publicHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: publicHeaders() });
}

export function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    return NextResponse.json(
      { error: "Desktop configuration unavailable." },
      { status: 503, headers: publicHeaders() },
    );
  }
  return NextResponse.json(
    {
      supabaseUrl: url,
      supabasePublishableKey: publishableKey,
      workspaceUi: getWorkspacePresentationConfig(),
      desktop: {
        latestVersion: "0.4.0",
        webWorkspacePath: "/workspace",
        syncMode: "shared-shell-live-config",
      },
    },
    { headers: publicHeaders() },
  );
}
