import type { VideoStoryboard } from "@/lib/video-ai-director";

export type VideoProviderId = "wan" | "ltx" | "external";

export type VideoProviderDescriptor = {
  id: VideoProviderId;
  label: string;
  mode: "self_hosted" | "api";
  configured: boolean;
  supports: {
    textToVideo: boolean;
    imageToVideo: boolean;
    referenceVideo: boolean;
  };
};

export type VideoRenderManifest = {
  id: string;
  createdAt: string;
  provider: VideoProviderId;
  status: "planned" | "blocked";
  reason?: string;
  output: {
    container: "mp4";
    aspect: VideoStoryboard["aspect"];
    duration: number;
    fps: 24 | 30;
  };
  scenes: Array<{
    id: string;
    start: number;
    end: number;
    prompt: string;
    transition: string;
    camera: string;
  }>;
};

export function getVideoProviders(): VideoProviderDescriptor[] {
  return [
    {
      id: "wan",
      label: "Wan",
      mode: "self_hosted",
      configured: process.env.ORBYVEN_VIDEO_WAN_ENABLED === "true",
      supports: { textToVideo: true, imageToVideo: true, referenceVideo: true },
    },
    {
      id: "ltx",
      label: "LTX",
      mode: "self_hosted",
      configured: process.env.ORBYVEN_VIDEO_LTX_ENABLED === "true",
      supports: { textToVideo: true, imageToVideo: true, referenceVideo: false },
    },
    {
      id: "external",
      label: "External API",
      mode: "api",
      configured: process.env.ORBYVEN_VIDEO_EXTERNAL_ENABLED === "true",
      supports: { textToVideo: true, imageToVideo: true, referenceVideo: true },
    },
  ];
}

export function buildRenderManifest(
  storyboard: VideoStoryboard,
  provider: VideoProviderId,
): VideoRenderManifest {
  const descriptor = getVideoProviders().find((item) => item.id === provider);
  const configured = descriptor?.configured ?? false;

  return {
    id: `vid_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    provider,
    status: configured ? "planned" : "blocked",
    reason: configured
      ? undefined
      : `${descriptor?.label ?? provider} is not configured yet. The render package is valid and ready for provider activation.`,
    output: {
      container: "mp4",
      aspect: storyboard.aspect,
      duration: storyboard.duration,
      fps: storyboard.style === "social" ? 30 : 24,
    },
    scenes: storyboard.scenes.map((scene) => ({
      id: scene.id,
      start: scene.start,
      end: scene.end,
      prompt: scene.generationPrompt,
      transition: scene.transition,
      camera: scene.camera,
    })),
  };
}
