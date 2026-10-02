import { NextResponse } from "next/server";

import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { persistVideoJob, updateVideoJob } from "@/lib/video-ai-job-store";
import {
  buildVideoProviderPayload,
  normalizeVideoProviderResult,
  readVideoRenderConfig,
  readVideoRenderRequest,
  type VideoRenderJob,
} from "@/lib/video-ai-render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const config = readVideoRenderConfig();
  return NextResponse.json(
    {
      enabled: config.enabled,
      ready: config.ready,
      provider: config.provider,
      endpointConfigured: config.endpointConfigured,
    },
    { headers: noStore }
  );
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 250_000) {
    return NextResponse.json({ error: "render request too large" }, { status: 413, headers: noStore });
  }

  try {
    const actor = await authenticateBillingActor(request, undefined, false);
    const body = await request.json();
    const renderRequest = readVideoRenderRequest(body);

    if (!renderRequest) {
      return NextResponse.json({ error: "render request invalid" }, { status: 400, headers: noStore });
    }

    const id = `video_${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    const config = readVideoRenderConfig();

    const initialJob: VideoRenderJob = {
      id,
      status: config.ready && config.provider ? "queued" : "provider_required",
      provider: config.provider,
      outputUrl: null,
      providerJobId: null,
      createdAt,
    };
    const persisted = await persistVideoJob(actor, initialJob, renderRequest);

    if (!config.ready || !config.provider) {
      return NextResponse.json(
        {
          job: initialJob,
          persisted,
          renderPackage: buildVideoProviderPayload(id, actor, renderRequest),
          message: "Director package created. A render provider is not configured in this environment.",
        },
        { headers: noStore }
      );
    }

    if (!persisted) throw new Error("VIDEO_JOB_PERSISTENCE_REQUIRED");

    const endpoint = process.env.ORBYVEN_VIDEO_RENDER_ENDPOINT?.trim();
    if (!endpoint) throw new Error("VIDEO_PROVIDER_NOT_CONFIGURED");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    const token = process.env.ORBYVEN_VIDEO_RENDER_TOKEN?.trim();

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(buildVideoProviderPayload(id, actor, renderRequest)),
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`VIDEO_PROVIDER_HTTP_${response.status}`);
      }

      const providerResult = normalizeVideoProviderResult(await response.json());
      const job: VideoRenderJob = {
        id,
        status: providerResult.status,
        provider: config.provider,
        outputUrl: providerResult.outputUrl,
        providerJobId: providerResult.providerJobId,
        createdAt,
      };

      await updateVideoJob(actor, id, {
        status: job.status,
        providerJobId: job.providerJobId,
        outputUrl: job.outputUrl,
        failureCode: null,
      });

      return NextResponse.json({ job, persisted: true }, { headers: noStore });
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      const failureCode = aborted
        ? "VIDEO_PROVIDER_TIMEOUT"
        : error instanceof Error
          ? error.message.slice(0, 120)
          : "UNKNOWN";
      await updateVideoJob(actor, id, { status: "failed", failureCode });
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    const code = aborted ? "VIDEO_PROVIDER_TIMEOUT" : error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "AUTH_REQUIRED" ? 401 :
      code === "ORG_ACCESS_REQUIRED" ? 403 :
      code === "VIDEO_PROVIDER_NOT_CONFIGURED" || code === "VIDEO_JOB_PERSISTENCE_REQUIRED" ? 503 :
      code.startsWith("VIDEO_PROVIDER_HTTP_") ? 502 :
      code === "VIDEO_PROVIDER_TIMEOUT" ? 504 :
      500;

    if (status >= 500) console.error("ORBYVEN Video AI render failure", error);

    return NextResponse.json(
      {
        error:
          status === 401
            ? "Autentificarea este necesară pentru randare."
            : status === 403
              ? "Nu există acces la o organizație ORBYVEN."
              : "Randarea video nu a putut fi pornită.",
        code,
      },
      { status, headers: noStore }
    );
  }
}
