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
    typeof board.title !== "string" ||
    board.title.trim().length < 2 ||
    board.title.length > 200 ||
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
    const start = Number(item.start);
    const end = Number(item.end);
    if (
      typeof item.id !== "string" ||
      item.id.length < 1 ||
      item.id.length > 120 ||
      !Number.isInteger(Number(item.index)) ||
      Number(item.index) < 1 ||
      Number(item.index) > 12 ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < 0 ||
      end <= start ||
      end > Number(board.duration) ||
      typeof item.title !== "string" ||
      item.title.trim().length < 1 ||
      item.title.length > 180 ||
      typeof item.purpose !== "string" ||
      item.purpose.length < 2 ||
      item.purpose.length > 600 ||
      typeof item.camera !== "string" ||
      item.camera.length < 2 ||
      item.camera.length > 600 ||
      typeof item.transition !== "string" ||
      item.transition.length < 2 ||
      item.transition.length > 600 ||
      typeof item.onScreenText !== "string" ||
      item.onScreenText.length > 180 ||
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

export function buildVideoProviderPayload(
  id: string,
  actor: { userId: string; organizationId: string },
  request: VideoRenderRequest
) {
  return {
    version: 1,
    jobId: id,
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
      aspect: request.storyboard.aspect,
      durationSeconds: request.storyboard.duration,
    },
  };
}

export function normalizeVideoProviderResult(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { providerJobId: null, outputUrl: null, status: "queued" as VideoRenderJobStatus };
  }
  const record = value as Record<string, unknown>;
  const status =
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
