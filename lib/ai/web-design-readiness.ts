import type { EditableSite, SiteSectionId } from "@/lib/ai/site-editor";
import type { WebDesignStrategy } from "@/lib/ai/web-design-intent";
import type { WebDesignQualityReport } from "@/lib/ai/web-design-quality";

export type WebDesignReadinessBlockerCode =
  | "PLACEHOLDER_COPY"
  | "DEMO_BRAND"
  | "TOO_FEW_READY_SECTIONS"
  | "QUALITY_REVIEW_REQUIRED";

export type WebDesignReadinessBlocker = {
  code: WebDesignReadinessBlockerCode;
  message: string;
  sections: SiteSectionId[];
};

export type WebDesignReadinessReport = {
  score: number;
  status: "ready" | "almost_ready" | "draft";
  blockers: WebDesignReadinessBlocker[];
  placeholderCount: number;
};

const PLACEHOLDER_PATTERNS = [
  /exemplu vizual/i,
  /spațiu (rezervat|pentru)/i,
  /inlocuieste/i,
  /înlocuiește/i,
  /continut demonstrativ/i,
  /conținut demonstrativ/i,
  /serviciu principal/i,
  /serviciu complementar/i,
  /adauga aici/i,
  /adaugă aici/i,
  /proiect real/i,
  /fotografie reala/i,
  /fotografie reală/i,
];

const DEMO_BRANDS = new Set([
  "atelier studio",
  "atelier instalatii",
  "atelier instalații",
  "maison fleur",
]);

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasPlaceholder(value: string) {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

function sectionCopy(draft: EditableSite): Record<SiteSectionId, string[]> {
  return {
    hero: [draft.brand, draft.eyebrow, draft.headline, draft.description, draft.cta],
    services: [
      draft.servicesTitle,
      ...draft.services.flatMap((item) => [item.title, item.description]),
    ],
    benefits: [
      draft.benefitsTitle,
      ...draft.benefits.flatMap((item) => [item.title, item.description]),
    ],
    about: [draft.aboutTitle, draft.aboutDescription],
    gallery: [
      draft.galleryTitle,
      ...draft.gallery.flatMap((item) => [item.title, item.description]),
    ],
    process: [
      draft.processTitle,
      ...draft.process.flatMap((item) => [item.title, item.description]),
    ],
    faq: [
      draft.faqTitle,
      ...draft.faq.flatMap((item) => [item.question, item.answer]),
    ],
    contact: [draft.contactTitle, draft.contactDescription],
  };
}

function visibleSections(draft: EditableSite) {
  return draft.sectionOrder.filter(
    (section) => section === "hero" || !draft.hiddenSections.includes(section)
  );
}

export function evaluateWebDesignReadiness(
  draft: EditableSite,
  strategy: WebDesignStrategy,
  quality: WebDesignQualityReport
): WebDesignReadinessReport {
  const copy = sectionCopy(draft);
  const visible = visibleSections(draft);
  const placeholderSections = visible.filter((section) =>
    copy[section].some(hasPlaceholder)
  );
  const placeholderCount = visible.reduce(
    (count, section) =>
      count + copy[section].filter((value) => hasPlaceholder(value)).length,
    0
  );

  const blockers: WebDesignReadinessBlocker[] = [];

  if (placeholderCount > 0) {
    blockers.push({
      code: "PLACEHOLDER_COPY",
      message:
        "Există conținut demonstrativ care trebuie înlocuit cu informații reale înainte de publicare.",
      sections: placeholderSections,
    });
  }

  if (DEMO_BRANDS.has(normalize(draft.brand))) {
    blockers.push({
      code: "DEMO_BRAND",
      message: "Numele brandului este încă unul demonstrativ.",
      sections: ["hero"],
    });
  }

  if (visible.length < 4) {
    blockers.push({
      code: "TOO_FEW_READY_SECTIONS",
      message: "Structura vizibilă este prea subțire pentru a fi considerată gata de publicare.",
      sections: visible,
    });
  }

  if (quality.status === "review") {
    blockers.push({
      code: "QUALITY_REVIEW_REQUIRED",
      message: "Quality Critic a identificat probleme tehnice care merită revizuite.",
      sections: [],
    });
  }

  let score = 100;
  score -= Math.min(36, placeholderCount * 6);
  if (blockers.some((item) => item.code === "DEMO_BRAND")) score -= 18;
  if (blockers.some((item) => item.code === "TOO_FEW_READY_SECTIONS")) score -= 16;
  if (blockers.some((item) => item.code === "QUALITY_REVIEW_REQUIRED")) score -= 12;

  if (strategy.confidence === "low") score -= 8;
  else if (strategy.confidence === "medium") score -= 3;

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    status: score >= 90 && blockers.length === 0
      ? "ready"
      : score >= 72
        ? "almost_ready"
        : "draft",
    blockers,
    placeholderCount,
  };
}
