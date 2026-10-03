import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const rawVersion =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.VERCEL_DEPLOYMENT_ID ??
    "local";

  const version = rawVersion === "local"
    ? rawVersion
    : rawVersion.slice(0, 16);

  return NextResponse.json(
    { version },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
