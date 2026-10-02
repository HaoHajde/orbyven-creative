import {
  type EditableSite,
  type SiteSectionId,
} from "@/lib/ai/site-editor";
import type { WebDesignStrategy } from "@/lib/ai/web-design-intent";

export type WebDesignRefineTarget =
  | SiteSectionId
  | "palette"
  | "typography"
  | "brand"
  | "structure"
  | "global_visual";

export type WebDesignRefineScope = {
  strict: boolean;
  targets: WebDesignRefineTarget[];
};

const SECTION_ALIASES: Record<SiteSectionId, string[]> = {
  hero: ["hero", "prima sectiune", "prima zona", "headline", "titlul principal", "cta"],
  services: ["servicii", "services", "oferta", "produse"],
  benefits: ["beneficii", "avantaje", "benefits"],
  about: ["despre", "about", "poveste", "story"],
  gallery: ["galerie", "gallery", "portofoliu", "portfolio", "proiecte", "lucrari"],
  process: ["proces", "process", "pasi", "steps", "cum lucram"],
  faq: ["faq", "intrebari frecvente", "questions"],
  contact: ["contact", "formular", "form", "programare", "rezervare"],
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

export function resolveWebDesignRefineScope(
  prompt: string,
  strategy: WebDesignStrategy
): WebDesignRefineScope {
  if (strategy.mode !== "refine") {
    return { strict: false, targets: [] };
  }

  const value = normalize(prompt);
  const targets: WebDesignRefineTarget[] = [];

  for (const [section, aliases] of Object.entries(SECTION_ALIASES) as Array<
    [SiteSectionId, string[]]
  >) {
    if (includesAny(value, aliases)) targets.push(section);
  }

  if (
    includesAny(value, [
      "culoare",
      "culori",
      "paleta",
      "fundal",
      "background",
      "accent",
      "tema dark",
      "tema light",
      "dark mode",
      "light mode",
    ])
  ) {
    targets.push("palette");
  }

  if (
    includesAny(value, [
      "font",
      "fonturi",
      "tipografie",
      "typography",
      "marime text",
      "marimea textului",
      "headline size",
    ])
  ) {
    targets.push("typography");
  }

  if (
    includesAny(value, [
      "brand",
      "nume firma",
      "numele firmei",
      "denumire",
      "rebrand",
      "rebranding",
    ])
  ) {
    targets.push("brand");
  }

  if (
    includesAny(value, [
      "ordine sectiuni",
      "ordinea sectiunilor",
      "rearanjeaza",
      "reordoneaza",
      "muta sectiunea",
      "structura paginii",
    ])
  ) {
    targets.push("structure");
  }

  if (
    includesAny(value, [
      "layout",
      "compozitie",
      "densitate",
      "radius",
      "colturi",
      "directie vizuala",
      "stil vizual",
    ])
  ) {
    targets.push("global_visual");
  }

  const unique = [...new Set(targets)];
  return {
    strict: unique.length > 0,
    targets: unique,
  };
}

function mergeTargetVisibility(
  current: EditableSite,
  candidate: EditableSite,
  targets: Set<WebDesignRefineTarget>
) {
  const hidden = new Set(current.hiddenSections);

  for (const section of Object.keys(SECTION_ALIASES) as SiteSectionId[]) {
    if (!targets.has(section) || section === "hero") continue;
    if (candidate.hiddenSections.includes(section)) hidden.add(section);
    else hidden.delete(section);
  }

  return [...hidden];
}

export function applyWebDesignRefineScope(
  candidate: EditableSite,
  current: EditableSite,
  scope: WebDesignRefineScope
): EditableSite {
  if (!scope.strict) return candidate;

  const targets = new Set(scope.targets);
  const next: EditableSite = {
    ...current,
    sectionOrder: [...current.sectionOrder],
    hiddenSections: [...current.hiddenSections],
    variants: { ...current.variants },
    services: current.services.map((item) => ({ ...item })),
    benefits: current.benefits.map((item) => ({ ...item })),
    gallery: current.gallery.map((item) => ({ ...item })),
    process: current.process.map((item) => ({ ...item })),
    faq: current.faq.map((item) => ({ ...item })),
  };

  if (targets.has("hero")) {
    next.eyebrow = candidate.eyebrow;
    next.headline = candidate.headline;
    next.description = candidate.description;
    next.cta = candidate.cta;
    next.headlineSize = candidate.headlineSize;
    next.variants.hero = candidate.variants.hero;
  }

  if (targets.has("services")) {
    next.servicesTitle = candidate.servicesTitle;
    next.services = candidate.services.map((item) => ({ ...item }));
    next.variants.services = candidate.variants.services;
  }

  if (targets.has("benefits")) {
    next.benefitsTitle = candidate.benefitsTitle;
    next.benefits = candidate.benefits.map((item) => ({ ...item }));
    next.variants.benefits = candidate.variants.benefits;
  }

  if (targets.has("about")) {
    next.aboutTitle = candidate.aboutTitle;
    next.aboutDescription = candidate.aboutDescription;
    next.variants.about = candidate.variants.about;
  }

  if (targets.has("gallery")) {
    next.galleryTitle = candidate.galleryTitle;
    next.gallery = candidate.gallery.map((item) => ({ ...item }));
    next.variants.gallery = candidate.variants.gallery;
  }

  if (targets.has("process")) {
    next.processTitle = candidate.processTitle;
    next.process = candidate.process.map((item) => ({ ...item }));
    next.variants.process = candidate.variants.process;
  }

  if (targets.has("faq")) {
    next.faqTitle = candidate.faqTitle;
    next.faq = candidate.faq.map((item) => ({ ...item }));
    next.variants.faq = candidate.variants.faq;
  }

  if (targets.has("contact")) {
    next.contactTitle = candidate.contactTitle;
    next.contactDescription = candidate.contactDescription;
    next.variants.contact = candidate.variants.contact;
  }

  if (targets.has("palette")) {
    next.accent = candidate.accent;
    next.background = candidate.background;
    next.surface = candidate.surface;
    next.textColor = candidate.textColor;
  }

  if (targets.has("typography")) {
    next.headlineSize = candidate.headlineSize;
  }

  if (targets.has("brand")) {
    next.brand = candidate.brand;
  }

  if (targets.has("structure")) {
    next.sectionOrder = [...candidate.sectionOrder];
    next.hiddenSections = [...candidate.hiddenSections];
  } else {
    next.hiddenSections = mergeTargetVisibility(current, candidate, targets);
  }

  if (targets.has("global_visual")) {
    next.layout = candidate.layout;
    next.visualTone = candidate.visualTone;
    next.density = candidate.density;
    next.radius = candidate.radius;
  }

  return next;
}

export function webDesignRefineScopeInstruction(scope: WebDesignRefineScope) {
  if (!scope.strict) return "";

  return [
    "ORBYVEN Refine Lock:",
    `strict=true`,
    `editable_targets=${scope.targets.join(",")}`,
    "Nu modifica intenționat câmpuri din afara țintelor. Serverul va restaura deterministic orice zonă necerută.",
  ].join("\n");
}
