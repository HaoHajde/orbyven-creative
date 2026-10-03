import { NextResponse } from "next/server";

import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import { createVideoJob, getVideoJob, updateVideoJob } from "@/lib/video-ai-jobs";
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
const validClientRenderId = /^video_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

    const requestedId = request.headers.get("x-orbyven-render-id")?.trim() ?? "";
    let id = validClientRenderId.test(requestedId) ? requestedId : `video_${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    const config = readVideoRenderConfig();
    const callbackUrl = new URL("/api/video-ai/render/callback", request.url).toString();

    const existing = validClientRenderId.test(requestedId)
      ? await getVideoJob(actor, requestedId)
      : null;

    if (existing && existing.status !== "failed") {
      const job: VideoRenderJob = {
        id: existing.id,
        status: existing.status,
        provider: existing.provider,
        outputUrl: existing.outputUrl,
        providerJobId: existing.providerJobId,
        createdAt: existing.createdAt,
      };
      return NextResponse.json(
        {
          job,
          ...(existing.status === "provider_required"
            ? {
                renderPackage: buildVideoProviderPayload(
                  existing.id,
                  actor,
                  renderRequest,
                  callbackUrl,
                  existing.provider,
                ),
              }
            : {}),
          deduplicated: true,
        },
        { headers: noStore },
      );
    }

    let retryExistingFailed = false;
    if (existing?.status === "failed") {
      if (config.ready && config.provider) {
        await updateVideoJob(actor, id, {
          status: "queued",
          provider: config.provider,
          failureCode: null,
        });
        retryExistingFailed = true;
      } else {
        id = `video_${crypto.randomUUID()}`;
      }
    }

    if (!config.ready || !config.provider) {
      const persisted = await createVideoJob(actor, {
        id,
        provider: config.provider,
        status: "provider_required",
        request: renderRequest,
        createdAt,
      });
      const job: VideoRenderJob = {
        id: persisted.id,
        status: persisted.status,
        provider: persisted.provider,
        outputUrl: persisted.outputUrl,
        providerJobId: persisted.providerJobId,
        createdAt: persisted.createdAt,
      };
      return NextResponse.json(
        {
          job,
          renderPackage: buildVideoProviderPayload(id, actor, renderRequest, callbackUrl, config.provider),
          message: "Director package created. A render provider is not configured in this environment.",
        },
        { headers: noStore }
      );
    }

    const endpoint = process.env.ORBYVEN_VIDEO_RENDER_ENDPOINT?.trim();
    if (!endpoint) throw new Error("VIDEO_PROVIDER_NOT_CONFIGURED");

    if (!retryExistingFailed) {
      await createVideoJob(actor, {
        id,
        provider: config.provider,
        status: "queued",
        request: renderRequest,
        createdAt,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    const token = process.env.ORBYVEN_VIDEO_RENDER_TOKEN?.trim();

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": id,
          "X-Orbyven-Job-Id": id,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(buildVideoProviderPayload(id, actor, renderRequest, callbackUrl, config.provider)),
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`VIDEO_PROVIDER_HTTP_${response.status}`);
      }

      const providerResult = normalizeVideoProviderResult(await response.json());
      const persisted = await updateVideoJob(actor, id, {
        status: providerResult.status,
        provider: config.provider,
        outputUrl: providerResult.outputUrl,
        providerJobId: providerResult.providerJobId,
        failureCode: providerResult.status === "failed" ? "PROVIDER_REPORTED_FAILURE" : null,
      });
      const job: VideoRenderJob = {
        id: persisted.id,
        status: persisted.status,
        provider: persisted.provider,
        outputUrl: persisted.outputUrl,
        providerJobId: persisted.providerJobId,
        createdAt: persisted.createdAt,
      };

      return NextResponse.json({ job }, { headers: noStore });
    } catch (providerError) {
      const failureCode =
        providerError instanceof Error
          ? providerError.name === "AbortError"
            ? "PROVIDER_TIMEOUT_PENDING"
            : providerError.message.slice(0, 120)
          : "PROVIDER_UNKNOWN";
      const providerHttpFailure =
        providerError instanceof Error &&
        providerError.message.startsWith("VIDEO_PROVIDER_HTTP_");
      try {
        await updateVideoJob(actor, id, {
          status: providerHttpFailure ? "failed" : "queued",
          provider: config.provider,
          failureCode,
        });
      } catch (persistenceError) {
        console.error("ORBYVEN Video AI failed to persist provider failure", persistenceError);
      }
      throw providerError;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const aborted = error instanceof Error && error.name === "AbortError";
    const status =
      code === "AUTH_REQUIRED" ? 401 :
      code === "ORG_ACCESS_REQUIRED" ? 403 :
      code === "VIDEO_PROVIDER_NOT_CONFIGURED" ? 503 :
      code.startsWith("VIDEO_PROVIDER_HTTP_") ? 502 :
      aborted ? 504 :
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
