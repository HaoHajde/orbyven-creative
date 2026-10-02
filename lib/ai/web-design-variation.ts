import type {
  EditableSite,
  SiteDensity,
  SiteLayout,
  SiteRadius,
  SiteSectionVariants,
  SiteVisualTone,
} from "./site-editor.ts";
import type { WebDesignStrategy } from "./web-design-intent.ts";

export type DesignDna = {
  id: string;
  layout: SiteLayout;
  headlineSize: EditableSite["headlineSize"];
  visualTone: SiteVisualTone;
  density: SiteDensity;
  radius: SiteRadius;
  variants: SiteSectionVariants;
};

const DESIGN_DNA: DesignDna[] = [
  {
    id: "editorial-luxury",
    layout: "editorial",
    headlineSize: "large",
    visualTone: "luxury",
    density: "airy",
    radius: "sharp",
    variants: {
      hero: "editorial",
      services: "list",
      benefits: "strip",
      about: "story",
      gallery: "mosaic",
      process: "timeline",
      faq: "columns",
      contact: "compact",
    },
  },
  {
    id: "minimal-airy",
    layout: "centered",
    headlineSize: "large",
    visualTone: "minimal",
    density: "airy",
    radius: "rounded",
    variants: {
      hero: "centered",
      services: "cards",
      benefits: "strip",
      about: "story",
      gallery: "grid",
      process: "steps",
      faq: "stack",
      contact: "compact",
    },
  },
  {
    id: "conversion-bold",
    layout: "split",
    headlineSize: "large",
    visualTone: "bold",
    density: "balanced",
    radius: "rounded",
    variants: {
      hero: "split",
      services: "spotlight",
      benefits: "cards",
      about: "split",
      gallery: "mosaic",
      process: "steps",
      faq: "columns",
      contact: "split",
    },
  },
  {
    id: "technical-precise",
    layout: "split",
    headlineSize: "normal",
    visualTone: "technical",
    density: "compact",
    radius: "soft",
    variants: {
      hero: "split",
      services: "list",
      benefits: "strip",
      about: "split",
      gallery: "grid",
      process: "timeline",
      faq: "stack",
      contact: "split",
    },
  },
  {
    id: "warm-human",
    layout: "centered",
    headlineSize: "large",
    visualTone: "warm",
    density: "airy",
    radius: "rounded",
    variants: {
      hero: "centered",
      services: "cards",
      benefits: "cards",
      about: "story",
      gallery: "mosaic",
      process: "steps",
      faq: "stack",
      contact: "compact",
    },
  },
  {
    id: "editorial-contrast",
    layout: "editorial",
    headlineSize: "large",
    visualTone: "editorial",
    density: "balanced",
    radius: "soft",
    variants: {
      hero: "editorial",
      services: "spotlight",
      benefits: "strip",
      about: "split",
      gallery: "mosaic",
      process: "timeline",
      faq: "columns",
      contact: "compact",
    },
  },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function distanceFromCurrent(current: EditableSite, dna: DesignDna) {
  let score = 0;
  if (current.layout !== dna.layout) score += 3;
  if (current.headlineSize !== dna.headlineSize) score += 1;
  if (current.visualTone !== dna.visualTone) score += 3;
  if (current.density !== dna.density) score += 1;
  if (current.radius !== dna.radius) score += 1;

  for (const key of Object.keys(dna.variants) as Array<keyof SiteSectionVariants>) {
    if (current.variants[key] !== dna.variants[key]) score += 1;
  }
  return score;
}

function currentFingerprint(current: EditableSite) {
  return [
    current.layout,
    current.headlineSize,
    current.visualTone,
    current.density,
    current.radius,
    current.sectionOrder.join(">"),
    ...Object.entries(current.variants).map(([key, value]) => `${key}:${value}`),
  ].join("|");
}

export function getAlternativeDesignDnaCandidates(
  current: EditableSite,
  prompt: string,
  limit = 3
): DesignDna[] {
  const fingerprint = currentFingerprint(current);
  const promptKey = normalize(prompt);
  const ranked = [...DESIGN_DNA].sort((left, right) => {
    const distance =
      distanceFromCurrent(current, right) - distanceFromCurrent(current, left);
    if (distance !== 0) return distance;

    const leftSeed = hash(`${promptKey}|${fingerprint}|${left.id}`);
    const rightSeed = hash(`${promptKey}|${fingerprint}|${right.id}`);
    if (leftSeed !== rightSeed) return leftSeed - rightSeed;
    return left.id.localeCompare(right.id);
  });

  return ranked.slice(0, Math.max(1, Math.min(limit, ranked.length)));
}

export function selectAlternativeDesignDna(
  current: EditableSite,
  prompt: string
): DesignDna {
  const pool = getAlternativeDesignDnaCandidates(current, prompt, 3);
  const seed = hash(`${normalize(prompt)}|${currentFingerprint(current)}`);
  return pool[seed % pool.length] ?? DESIGN_DNA[0]!;
}

export function applySpecificDesignDna(
  draft: EditableSite,
  dna: DesignDna
): EditableSite {
  return {
    ...draft,
    layout: dna.layout,
    headlineSize: dna.headlineSize,
    visualTone: dna.visualTone,
    density: dna.density,
    radius: dna.radius,
    variants: { ...dna.variants },
  };
}

export function applyDesignDna(
  draft: EditableSite,
  current: EditableSite,
  strategy: WebDesignStrategy,
  prompt: string
): EditableSite {
  if (strategy.mode !== "alternative") return draft;

  return applySpecificDesignDna(
    draft,
    selectAlternativeDesignDna(current, prompt)
  );
}

export function designDnaInstruction(
  current: EditableSite,
  strategy: WebDesignStrategy,
  prompt: string
) {
  if (strategy.mode !== "alternative") return "";

  const dna = selectAlternativeDesignDna(current, prompt);
  return [
    "ORBYVEN Design DNA:",
    `dna=${dna.id}`,
    `layout=${dna.layout}`,
    `headline_size=${dna.headlineSize}`,
    `visual_tone=${dna.visualTone}`,
    `density=${dna.density}`,
    `radius=${dna.radius}`,
    `hero_variant=${dna.variants.hero}`,
    `services_variant=${dna.variants.services}`,
    `benefits_variant=${dna.variants.benefits}`,
    `about_variant=${dna.variants.about}`,
    `gallery_variant=${dna.variants.gallery}`,
    `process_variant=${dna.variants.process}`,
    `faq_variant=${dna.variants.faq}`,
    `contact_variant=${dna.variants.contact}`,
    "Varianta trebuie să fie vizibil diferită de draftul curent, fără a schimba faptele reale sau obiectivul principal.",
  ].join("\n");
}

export function designDnaDistance(
  first: EditableSite,
  second: EditableSite
) {
  let score = 0;
  if (first.layout !== second.layout) score += 3;
  if (first.headlineSize !== second.headlineSize) score += 1;
  if (first.visualTone !== second.visualTone) score += 3;
  if (first.density !== second.density) score += 1;
  if (first.radius !== second.radius) score += 1;
  for (const key of Object.keys(first.variants) as Array<keyof SiteSectionVariants>) {
    if (first.variants[key] !== second.variants[key]) score += 1;
  }
  return score;
}
