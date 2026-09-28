import { NextResponse } from "next/server";
import {
  CURRENT_DESKTOP_VERSION,
  WORKSPACE_CREATE_MODULES,
  WORKSPACE_LAYOUT,
  WORKSPACE_NAV_GROUPS,
  WORKSPACE_THEME,
  WORKSPACE_UI_REVISION,
} from "@/lib/workspace-visual-system";

export const dynamic = "force-dynamic";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}

export function GET() {
  return NextResponse.json({
    revision: WORKSPACE_UI_REVISION,
    desktopVersion: CURRENT_DESKTOP_VERSION,
    generatedAt: new Date().toISOString(),
    theme: WORKSPACE_THEME,
    layout: WORKSPACE_LAYOUT,
    navGroups: WORKSPACE_NAV_GROUPS,
    createModules: WORKSPACE_CREATE_MODULES,
  }, { headers });
}
