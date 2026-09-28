import { NextResponse } from "next/server";
import { WORKSPACE_UI_CONTRACT } from "@/lib/workspace-ui-contract";

export const dynamic = "force-dynamic";

const publicHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  "X-Content-Type-Options": "nosniff",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: publicHeaders });
}

export function GET() {
  return NextResponse.json(WORKSPACE_UI_CONTRACT, { headers: publicHeaders });
}
