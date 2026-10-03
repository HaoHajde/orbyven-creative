import type { VideoStoryboard } from "@/lib/video-ai-director";

export type VideoRenderProvider = "webhook" | "wan" | "ltx";
export type VideoRenderJobStatus =
  | "provider_required"
  | "queued"
  | "rendering"
  | "complete"
  | "failed";

export type VideoRenderRequest = {
  storyboard: VideoStoryboard;
  referenceUrl?: string;
  sourceUrls?: string[];
};

export type VideoRenderConfig = {
  enabled: boolean;
  ready: boolean;
  provider: VideoRenderProvider | null;
  endpointConfigured: boolean;
};

export type VideoRenderJob = {
  id: string;
  status: VideoRenderJobStatus;
  provider: VideoRenderProvider | null;
  outputUrl: string | null;
  providerJobId: string | null;
  createdAt: string;
};

const providers = new Set<VideoRenderProvider>(["webhook", "wan", "ltx"]);

function safeHttpUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function readVideoRenderConfig(
  env: Record<string, string | undefined> = process.env
): VideoRenderConfig {
  const enabled = env.ORBYVEN_VIDEO_AI_ENABLED?.trim().toLowerCase() === "true";
  const rawProvider = env.ORBYVEN_VIDEO_RENDER_PROVIDER?.trim().toLowerCase() ?? "";
  const provider = providers.has(rawProvider as VideoRenderProvider)
    ? (rawProvider as VideoRenderProvider)
    : null;
  const endpointConfigured = Boolean(safeHttpUrl(env.ORBYVEN_VIDEO_RENDER_ENDPOINT));

  return {
    enabled,
    ready: enabled && Boolean(provider) && endpointConfigured,
    provider,
    endpointConfigured,
  };
}

export function readVideoRenderRequest(value: unknown): VideoRenderRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const storyboard = record.storyboard;

  if (!storyboard || typeof storyboard !== "object" || Array.isArray(storyboard)) return null;
  const board = storyboard as Record<string, unknown>;

  if (
    typeof board.summary !== "string" ||
    board.summary.trim().length < 2 ||
    board.summary.length > 4000 ||
    ![15, 30, 45, 60].includes(Number(board.duration)) ||
    !["9:16", "16:9", "1:1"].includes(String(board.aspect)) ||
    !["product", "cinematic", "minimal-ui", "social"].includes(String(board.style)) ||
    !Array.isArray(board.scenes) ||
    board.scenes.length < 1 ||
    board.scenes.length > 12
  ) {
    return null;
  }

  for (const scene of board.scenes) {
    if (!scene || typeof scene !== "object" || Array.isArray(scene)) return null;
    const item = scene as Record<string, unknown>;
    if (
      typeof item.id !== "string" ||
      typeof item.title !== "string" ||
      typeof item.generationPrompt !== "string" ||
      item.generationPrompt.length < 10 ||
      item.generationPrompt.length > 5000
    ) {
      return null;
    }
  }

  const referenceUrl =
    record.referenceUrl === undefined || record.referenceUrl === ""
      ? undefined
      : safeHttpUrl(record.referenceUrl) ?? undefined;

  if (record.referenceUrl && !referenceUrl) return null;

  const sourceUrls = Array.isArray(record.sourceUrls)
    ? record.sourceUrls
        .slice(0, 12)
        .map(safeHttpUrl)
        .filter((item): item is string => Boolean(item))
    : undefined;

  if (Array.isArray(record.sourceUrls) && sourceUrls?.length !== record.sourceUrls.length) {
    return null;
  }

  return {
    storyboard: storyboard as VideoStoryboard,
    referenceUrl,
    sourceUrls,
  };
}

function outputSpec(storyboard: VideoStoryboard) {
  const dimensions =
    storyboard.aspect === "9:16"
      ? { width: 1080, height: 1920 }
      : storyboard.aspect === "16:9"
        ? { width: 1920, height: 1080 }
        : { width: 1080, height: 1080 };
  const fps = storyboard.style === "social" || storyboard.style === "minimal-ui" ? 30 : 24;
  return { ...dimensions, fps };
}

export function buildVideoProviderPayload(
  id: string,
  actor: { userId: string; organizationId: string },
  request: VideoRenderRequest,
  callbackUrl?: string,
  provider?: VideoRenderProvider | null,
) {
  const spec = outputSpec(request.storyboard);
  return {
    version: 2,
    jobId: id,
    provider: provider ?? null,
    actor: {
      userId: actor.userId,
      organizationId: actor.organizationId,
    },
    project: {
      brand: "ORBYVEN Creative",
      storyboard: request.storyboard,
      referenceUrl: request.referenceUrl ?? null,
      sourceUrls: request.sourceUrls ?? [],
    },
    output: {
      container: "mp4",
      codec: "h264",
      aspect: request.storyboard.aspect,
      width: spec.width,
      height: spec.height,
      fps: spec.fps,
      durationSeconds: request.storyboard.duration,
      audio: false,
    },
    renderPlan: {
      mode: "scene-batch",
      sceneCount: request.storyboard.scenes.length,
      continuity: {
        brandLock: true,
        preserveReadableUi: true,
        restrainedVioletAccent: true,
        hardCutsAllowed: false,
      },
      negativePrompt:
        "distorted typography, unreadable UI, random logos, generic stock SaaS, duplicate elements, warped screens, abrupt hard cuts",
      scenes: request.storyboard.scenes.map((scene) => ({
        id: scene.id,
        index: scene.index,
        durationSeconds: Number((scene.end - scene.start).toFixed(1)),
        prompt: scene.generationPrompt,
        camera: scene.camera,
        transition: scene.transition,
        onScreenText: scene.onScreenText,
      })),
    },
    callback: callbackUrl
      ? {
          url: callbackUrl,
          method: "POST",
          authorization: "bearer",
          signatureHeader: "x-orbyven-video-signature",
          signatureAlgorithm: "hmac-sha256",
        }
      : null,
  };
}

export function normalizeVideoProviderResult(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { providerJobId: null, outputUrl: null, status: "queued" as VideoRenderJobStatus };
  }
  const record = value as Record<string, unknown>;
  const status: VideoRenderJobStatus =
    record.status === "rendering" ||
    record.status === "complete" ||
    record.status === "failed" ||
    record.status === "queued"
      ? record.status
      : "queued";

  return {
    providerJobId:
      typeof record.jobId === "string" && record.jobId.length <= 240 ? record.jobId : null,
    outputUrl: safeHttpUrl(record.outputUrl),
    status,
  };
}
