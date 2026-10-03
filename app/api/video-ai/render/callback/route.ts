import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { updateVideoJobFromWorker } from "@/lib/video-ai-jobs";
import type { VideoRenderJobStatus } from "@/lib/video-ai-render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const allowedStatuses = new Set<VideoRenderJobStatus>(["queued", "rendering", "complete", "failed"]);
const validJobId = /^[A-Za-z0-9_-]{12,80}$/;

function validBearer(request: Request) {
  const expected = process.env.ORBYVEN_VIDEO_RENDER_TOKEN?.trim();
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return false;

  const left = Buffer.from(token);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function validSignature(request: Request, rawBody: string) {
  const secret = process.env.ORBYVEN_VIDEO_CALLBACK_SECRET?.trim();
  if (!secret) return false;

  const header = request.headers.get("x-orbyven-video-signature")?.trim() ?? "";
  const provided = header.startsWith("sha256=") ? header.slice(7) : header;
  if (!/^[0-9a-f]{64}$/i.test(provided)) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const left = Buffer.from(provided, "hex");
  const right = Buffer.from(expected, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

function safeUrl(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 2048) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 32_000) {
    return NextResponse.json({ error: "callback too large" }, { status: 413, headers: noStore });
  }

  const rawBody = await request.text();
  const bearerConfigured = Boolean(process.env.ORBYVEN_VIDEO_RENDER_TOKEN?.trim());
  const signatureConfigured = Boolean(process.env.ORBYVEN_VIDEO_CALLBACK_SECRET?.trim());

  if (!bearerConfigured && !signatureConfigured) {
    return NextResponse.json(
      { error: "callback auth not configured" },
      { status: 503, headers: noStore },
    );
  }

  if (!validBearer(request) && !validSignature(request, rawBody)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "callback json invalid" }, { status: 400, headers: noStore });
  }

  try {
    const id = typeof body.jobId === "string" ? body.jobId : "";
    const status = body.status as VideoRenderJobStatus;
    const providerJobId =
      body.providerJobId === null || body.providerJobId === undefined
        ? undefined
        : typeof body.providerJobId === "string" && body.providerJobId.length <= 240
          ? body.providerJobId
          : null;
    const outputUrl = safeUrl(body.outputUrl);
    const failureCode =
      body.failureCode === null || body.failureCode === undefined
        ? undefined
        : typeof body.failureCode === "string" && body.failureCode.length <= 120
          ? body.failureCode
          : null;

    if (
      !validJobId.test(id) ||
      !allowedStatuses.has(status) ||
      providerJobId === null ||
      outputUrl === undefined ||
      failureCode === null
    ) {
      return NextResponse.json({ error: "callback invalid" }, { status: 400, headers: noStore });
    }

    const job = await updateVideoJobFromWorker(id, {
      status,
      providerJobId,
      outputUrl,
      failureCode,
    });

    return NextResponse.json({ job }, { headers: noStore });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "VIDEO_JOB_NOT_FOUND"
        ? 404
        : code === "VIDEO_JOB_INVALID_TRANSITION"
          ? 409
          : code === "VIDEO_JOB_OUTPUT_REQUIRED"
            ? 422
            : 500;

    if (status >= 500) console.error("ORBYVEN Video AI callback failure", error);
    return NextResponse.json(
      { error: status === 500 ? "callback update failed" : code },
      { status, headers: noStore },
    );
  }
}
