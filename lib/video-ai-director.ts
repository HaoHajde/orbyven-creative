export type VideoAspect = "9:16" | "16:9" | "1:1";
export type VideoDuration = 15 | 30 | 45 | 60;
export type VideoStyle = "product" | "cinematic" | "minimal-ui" | "social";

export type VideoScene = {
  id: string;
  index: number;
  start: number;
  end: number;
  title: string;
  purpose: string;
  camera: string;
  transition: string;
  onScreenText: string;
  generationPrompt: string;
};

export type VideoStoryboard = {
  title: string;
  summary: string;
  duration: VideoDuration;
  aspect: VideoAspect;
  style: VideoStyle;
  scenes: VideoScene[];
};

const styleDirection: Record<VideoStyle, string> = {
  product:
    "premium product launch, precision camera movement, elegant UI reveals, restrained violet accents, cinematic studio lighting",
  cinematic:
    "cinematic commercial, soft volumetric lighting, deliberate camera choreography, shallow depth of field, premium pacing",
  "minimal-ui":
    "minimal software showcase, crisp interface, smooth scroll and hover states, subtle parallax, clean negative space",
  social:
    "high-retention social ad, fluid scene changes, readable mobile UI, concise visual storytelling, premium but energetic pacing",
};

const phases = [
  {
    title: "Brand reveal",
    purpose: "Establish the brand and visual language immediately.",
    camera: "Slow dolly-in from darkness into the ORBYVEN mark and interface surface.",
    transition: "Logo glow stretches into the first product surface.",
    text: "ORBYVEN",
  },
  {
    title: "Product reveal",
    purpose: "Show the real product as a connected digital experience.",
    camera: "Glide across the interface with subtle parallax and depth.",
    transition: "Push into one live card until it fills the frame.",
    text: "One ecosystem.",
  },
  {
    title: "AI action",
    purpose: "Demonstrate AI creating or changing something useful in real time.",
    camera: "Locked hero framing with controlled macro moves on generated elements.",
    transition: "Generated component morphs into the next workspace scene.",
    text: "Imagine it.",
  },
  {
    title: "Business workspace",
    purpose: "Show the operational side: clients, projects, offers, analytics and modules.",
    camera: "Orbit a layered dashboard, then settle into a readable frontal view.",
    transition: "Connected cards flow into one another instead of hard cuts.",
    text: "Run it.",
  },
  {
    title: "Automation flow",
    purpose: "Show modules sharing context and reducing manual work.",
    camera: "Follow data moving between cards with a gentle tracking shot.",
    transition: "The final data pulse becomes the closing brand glow.",
    text: "Everything connected.",
  },
  {
    title: "Closing",
    purpose: "End with a memorable brand statement and clean CTA.",
    camera: "Slow pull-back to reveal the full ORBYVEN ecosystem.",
    transition: "Fade only after the final logo lockup is fully readable.",
    text: "Build. Manage. Grow.",
  },
] as const;

function normalizeBrief(brief: string) {
  return brief.trim().replace(/\s+/g, " ");
}

function makeScenePrompt(
  brief: string,
  style: VideoStyle,
  aspect: VideoAspect,
  phase: (typeof phases)[number],
) {
  return [
    styleDirection[style],
    `format ${aspect}`,
    "ORBYVEN Creative brand, charcoal black surfaces, restrained violet accents, crisp typography, realistic software UI",
    phase.purpose,
    phase.camera,
    phase.transition,
    `Campaign brief: ${brief}`,
    "preserve readable UI, no distorted text, no random logos, no generic stock SaaS interface",
  ].join(". ");
}

export function buildStoryboard(input: {
  brief: string;
  duration: VideoDuration;
  aspect: VideoAspect;
  style: VideoStyle;
}): VideoStoryboard {
  const brief = normalizeBrief(input.brief) || "Present ORBYVEN as a premium AI-powered business ecosystem.";
  const usablePhases = input.duration <= 15 ? phases.slice(0, 4) : input.duration <= 30 ? phases.slice(0, 5) : phases;
  const sceneLength = input.duration / usablePhases.length;

  const scenes = usablePhases.map((phase, index) => {
    const start = Number((index * sceneLength).toFixed(1));
    const end = Number(((index + 1) * sceneLength).toFixed(1));

    return {
      id: `scene-${index + 1}`,
      index: index + 1,
      start,
      end,
      title: phase.title,
      purpose: phase.purpose,
      camera: phase.camera,
      transition: phase.transition,
      onScreenText: phase.text,
      generationPrompt: makeScenePrompt(brief, input.style, input.aspect, phase),
    };
  });

  return {
    title: "ORBYVEN Video AI Direction",
    summary: brief,
    duration: input.duration,
    aspect: input.aspect,
    style: input.style,
    scenes,
  };
}
