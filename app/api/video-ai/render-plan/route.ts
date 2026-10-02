import { NextResponse } from "next/server";

import type { VideoStoryboard } from "@/lib/video-ai-director";
import {
  buildRenderManifest,
  getVideoProviders,
  type VideoProviderId,
} from "@/lib/video-ai-render";

const allowedProviders = new Set<VideoProviderId>(["wan", "ltx", "external"]);

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const record = body as Record<string, unknown>;
  const storyboard = record.storyboard as VideoStoryboard | undefined;
  const provider = record.provider as VideoProviderId | undefined;

  if (
    !storyboard ||
    typeof storyboard !== "object" ||
    !Array.isArray(storyboard.scenes) ||
    storyboard.scenes.length < 1 ||
    !provider ||
    !allowedProviders.has(provider)
  ) {
    return NextResponse.json(
      { error: "A valid storyboard and provider are required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const manifest = buildRenderManifest(storyboard, provider);
  return NextResponse.json(
    {
      manifest,
      providers: getVideoProviders(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
