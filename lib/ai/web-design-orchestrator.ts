import type { BillingActor } from "@/lib/billing/supabase-server";
import {
  generateWebDesignForActor,
  saveWebDesignDraft,
  type WebDesignGenerationResult,
} from "@/lib/ai/web-design-server";
import type {
  EditableSite,
  SiteDensity,
  SiteLayout,
  SiteRadius,
  SiteSectionId,
  SiteSectionVariants,
  SiteVisualTone,
} from "@/lib/ai/site-editor";

export type WebDesignGenerationMode = "compose" | "refine" | "alternative";

type DesignDirection = {
  name: string;
  layout: SiteLayout;
  headlineSize: EditableSite["headlineSize"];
  visualTone: SiteVisualTone;
  density: SiteDensity;
  radius: SiteRadius;
  variants: SiteSectionVariants;
};

type AlternativeBlueprint = DesignDirection & {
  sectionOrder: SiteSectionId[];
};

const DIRECTIONS: DesignDirection[] = [
  {
    name: "editorial-luxury",
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
    name: "minimal-airy",
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
    name: "conversion-bold",
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
    name: "technical-precise",
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
    name: "warm-human",
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
    name: "editorial-contrast",
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

const SECTION_ORDERS: SiteSectionId[][] = [
  ["hero", "services", "benefits", "gallery", "about", "process", "faq", "contact"],
  ["hero", "benefits", "services", "process", "gallery", "about", "faq", "contact"],
  ["hero", "gallery", "services", "benefits", "about", "process", "faq", "contact"],
  ["hero", "services", "gallery", "benefits", "process", "about", "faq", "contact"],
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

function sameOrder(first: SiteSectionId[], second: SiteSectionId[]) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function directionDistance(current: EditableSite, direction: DesignDirection) {
  let score = 0;
  if (current.layout !== direction.layout) score += 2;
  if (current.headlineSize !== direction.headlineSize) score += 1;
  if (current.visualTone !== direction.visualTone) score += 2;
  if (current.density !== direction.density) score += 1;
  if (current.radius !== direction.radius) score += 1;

  for (const key of Object.keys(direction.variants) as Array<keyof SiteSectionVariants>) {
    if (current.variants[key] !== direction.variants[key]) score += 1;
  }
  return score;
}

function designFingerprint(site: EditableSite) {
  return [
    site.layout,
    site.headlineSize,
    site.visualTone,
    site.density,
    site.radius,
    site.sectionOrder.join(">"),
    ...Object.entries(site.variants).map(([key, value]) => `${key}:${value}`),
  ].join("|");
}

export function inferWebDesignGenerationMode(prompt: string): WebDesignGenerationMode {
  const value = normalize(prompt);

  if (
    /\b(alta propunere|alta varianta|o alta varianta|varianta diferita|versiune diferita|alternative|another version|another proposal|different version)\b/.test(
      value
    )
  ) {
    return "alternative";
  }

  if (
    /\b(schimba|modifica|ajusteaza|rafineaza|pastreaza|rescrie|fa mai|fa-l mai|fa o mai|reduce|mareste|micsoreaza)\b/.test(
      value
    )
  ) {
    return "refine";
  }

  return "compose";
}

export function webDesignStructuralDistance(first: EditableSite, second: EditableSite) {
  let score = 0;
  if (first.layout !== second.layout) score += 1;
  if (first.headlineSize !== second.headlineSize) score += 1;
  if (first.visualTone !== second.visualTone) score += 1;
  if (first.density !== second.density) score += 1;
  if (first.radius !== second.radius) score += 1;
  if (!sameOrder(first.sectionOrder, second.sectionOrder)) score += 1;

  for (const key of Object.keys(first.variants) as Array<keyof SiteSectionVariants>) {
    if (first.variants[key] !== second.variants[key]) score += 1;
  }
  return score;
}

function chooseAlternativeBlueprint(current: EditableSite, prompt: string): AlternativeBlueprint {
  const ranked = [...DIRECTIONS].sort(
    (left, right) => directionDistance(current, right) - directionDistance(current, left)
  );
  const top = ranked.slice(0, Math.min(3, ranked.length));
  const seed = hash(`${normalize(prompt)}|${designFingerprint(current)}`);
  const direction = top[seed % top.length] ?? DIRECTIONS[0]!;

  const differentOrders = SECTION_ORDERS.filter(
    (order) => !sameOrder(order, current.sectionOrder)
  );
  const orderPool = differentOrders.length ? differentOrders : SECTION_ORDERS;
  const sectionOrder =
    orderPool[hash(`order|${seed}|${direction.name}`) % orderPool.length] ??
    SECTION_ORDERS[0]!;

  return {
    ...direction,
    sectionOrder: [...sectionOrder],
  };
}

function guidanceForAlternative(blueprint: AlternativeBlueprint) {
  return [
    "Instrucțiune internă ORBYVEN: aceasta este o alternativă, nu o rafinare.",
    "Varianta trebuie să fie vizibil și structural diferită de draftul curent, dar la fel de coerentă și utilizabilă.",
    `Direcție de design: ${blueprint.name}.`,
    `Layout: ${blueprint.layout}; headline: ${blueprint.headlineSize}; ton: ${blueprint.visualTone}; densitate: ${blueprint.density}; colțuri: ${blueprint.radius}.`,
    `Componente: hero ${blueprint.variants.hero}; servicii ${blueprint.variants.services}; beneficii ${blueprint.variants.benefits}; despre ${blueprint.variants.about}; galerie ${blueprint.variants.gallery}; proces ${blueprint.variants.process}; faq ${blueprint.variants.faq}; contact ${blueprint.variants.contact}.`,
    `Ordine secțiuni: ${blueprint.sectionOrder.join(" > ")}.`,
    "Păstrează strict faptele reale, obiectivul business-ului și CTA-ul principal; schimbă compoziția, ritmul și ierarhia vizuală.",
  ].join(" ");
}

function guidanceForRefine() {
  return [
    "Instrucțiune internă ORBYVEN: tratează cererea ca rafinare a draftului curent.",
    "Păstrează neschimbate structura, secțiunile, ordinea, paleta și variantele care nu sunt vizate explicit de cererea utilizatorului.",
    "Modifică numai elementele necesare pentru cerere și păstrează aceeași identitate vizuală dacă utilizatorul nu cere o direcție nouă.",
  ].join(" ");
}

function applyAlternativeBlueprint(
  draft: EditableSite,
  blueprint: AlternativeBlueprint
): EditableSite {
  return {
    ...draft,
    layout: blueprint.layout,
    headlineSize: blueprint.headlineSize,
    visualTone: blueprint.visualTone,
    density: blueprint.density,
    radius: blueprint.radius,
    sectionOrder: [...blueprint.sectionOrder],
    hiddenSections: draft.hiddenSections.filter((section) => section !== "hero"),
    variants: { ...blueprint.variants },
  };
}

export async function generateOrchestratedWebDesign(
  actor: BillingActor,
  prompt: string,
  current: EditableSite
): Promise<WebDesignGenerationResult> {
  const mode = inferWebDesignGenerationMode(prompt);

  if (mode === "alternative") {
    const blueprint = chooseAlternativeBlueprint(current, prompt);
    const guidedPrompt = `${guidanceForAlternative(blueprint)}\n\nCererea utilizatorului: ${prompt}`;
    const result = await generateWebDesignForActor(actor, guidedPrompt, current);
    const draft = applyAlternativeBlueprint(result.draft, blueprint);

    await saveWebDesignDraft(actor, draft, "ai", prompt);

    return {
      ...result,
      draft,
    };
  }

  if (mode === "refine") {
    return generateWebDesignForActor(
      actor,
      `${guidanceForRefine()}\n\nCererea utilizatorului: ${prompt}`,
      current
    );
  }

  return generateWebDesignForActor(actor, prompt, current);
}
