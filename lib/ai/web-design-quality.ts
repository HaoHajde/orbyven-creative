import type { EditableSite } from "@/lib/ai/site-editor";
import type {
  WebDesignPrimaryAction,
  WebDesignStrategy,
} from "@/lib/ai/web-design-intent";

export type WebDesignQualityIssueCode =
  | "LOW_TEXT_CONTRAST"
  | "GENERIC_CTA"
  | "HEADLINE_MOBILE_RISK"
  | "OVERDENSE_STRUCTURE"
  | "REDUNDANT_COPY"
  | "WEAK_VISIBLE_STRUCTURE";

export type WebDesignQualityIssue = {
  code: WebDesignQualityIssueCode;
  severity: "info" | "warning";
  message: string;
  autoFixed: boolean;
};

export type WebDesignQualityReport = {
  score: number;
  status: "strong" | "good" | "review";
  fixesApplied: number;
  issues: WebDesignQualityIssue[];
};

export type WebDesignQualityResult = {
  draft: EditableSite;
  report: WebDesignQualityReport;
};

const GENERIC_CTA = new Set([
  "afla mai mult",
  "descopera",
  "vezi mai mult",
  "mai multe",
  "incepe",
  "continua",
  "click aici",
  "learn more",
  "discover",
  "see more",
  "start",
]);

const ACTION_CTA: Record<WebDesignPrimaryAction, string> = {
  request_quote: "Cere o ofertă",
  book: "Programează-te",
  buy: "Vezi produsele",
  contact: "Contactează-ne",
  view_work: "Vezi proiectele",
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hexToRgb(value: string) {
  const hex = value.replace("#", "");
  if (!/^[a-fA-F0-9]{6}$/.test(hex)) return null;
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function relativeLuminance(value: string) {
  const rgb = hexToRgb(value);
  if (!rgb) return null;

  const channel = (component: number) => {
    const value = component / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  return (
    0.2126 * channel(rgb.r) +
    0.7152 * channel(rgb.g) +
    0.0722 * channel(rgb.b)
  );
}

function contrastRatio(foreground: string, background: string) {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  if (fg === null || bg === null) return null;

  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

function preferredTextColor(background: string) {
  const luminance = relativeLuminance(background);
  if (luminance === null) return "#f7f7f8";
  return luminance > 0.42 ? "#17171b" : "#f7f7f8";
}

function visibleSectionCount(draft: EditableSite) {
  return draft.sectionOrder.filter(
    (section) => section === "hero" || !draft.hiddenSections.includes(section)
  ).length;
}

function repeatedCopy(draft: EditableSite) {
  const values = [
    draft.headline,
    draft.description,
    draft.servicesTitle,
    ...draft.services.flatMap((item) => [item.title, item.description]),
    draft.benefitsTitle,
    ...draft.benefits.flatMap((item) => [item.title, item.description]),
    draft.aboutTitle,
    draft.aboutDescription,
    draft.galleryTitle,
    draft.processTitle,
    draft.faqTitle,
    draft.contactTitle,
    draft.contactDescription,
  ]
    .map(normalize)
    .filter((value) => value.length >= 18);

  return values.some((value, index) => values.indexOf(value) !== index);
}

function issuePenalty(issue: WebDesignQualityIssue) {
  if (issue.code === "LOW_TEXT_CONTRAST") return 16;
  if (issue.code === "WEAK_VISIBLE_STRUCTURE") return 14;
  if (issue.code === "GENERIC_CTA") return 10;
  if (issue.code === "HEADLINE_MOBILE_RISK") return 8;
  if (issue.code === "OVERDENSE_STRUCTURE") return 7;
  return 5;
}

function reportStatus(score: number): WebDesignQualityReport["status"] {
  if (score >= 90) return "strong";
  if (score >= 78) return "good";
  return "review";
}

export function critiqueWebDesign(
  input: EditableSite,
  strategy: WebDesignStrategy
): WebDesignQualityResult {
  const draft: EditableSite = {
    ...input,
    sectionOrder: [...input.sectionOrder],
    hiddenSections: [...input.hiddenSections],
    variants: { ...input.variants },
    services: input.services.map((item) => ({ ...item })),
    benefits: input.benefits.map((item) => ({ ...item })),
    gallery: input.gallery.map((item) => ({ ...item })),
    process: input.process.map((item) => ({ ...item })),
    faq: input.faq.map((item) => ({ ...item })),
  };

  const issues: WebDesignQualityIssue[] = [];

  const textContrast = contrastRatio(draft.textColor, draft.background);
  if (textContrast !== null && textContrast < 4.5) {
    draft.textColor = preferredTextColor(draft.background);
    issues.push({
      code: "LOW_TEXT_CONTRAST",
      severity: "warning",
      message: "Contrastul textului principal a fost corectat automat.",
      autoFixed: true,
    });
  }

  const normalizedCta = normalize(draft.cta);
  if (
    GENERIC_CTA.has(normalizedCta) &&
    strategy.primaryAction !== "contact"
  ) {
    draft.cta = ACTION_CTA[strategy.primaryAction];
    issues.push({
      code: "GENERIC_CTA",
      severity: "info",
      message: "CTA-ul generic a fost aliniat obiectivului principal.",
      autoFixed: true,
    });
  }

  if (draft.headline.length > 92 && draft.headlineSize === "large") {
    draft.headlineSize = "normal";
    issues.push({
      code: "HEADLINE_MOBILE_RISK",
      severity: "info",
      message: "Dimensiunea headline-ului a fost redusă pentru a limita overflow-ul pe mobil.",
      autoFixed: true,
    });
  }

  const visibleCount = visibleSectionCount(draft);
  if (visibleCount >= 7 && draft.density === "compact") {
    draft.density = "balanced";
    issues.push({
      code: "OVERDENSE_STRUCTURE",
      severity: "info",
      message: "Densitatea a fost echilibrată pentru o pagină cu multe secțiuni.",
      autoFixed: true,
    });
  }

  if (visibleCount < 4) {
    issues.push({
      code: "WEAK_VISIBLE_STRUCTURE",
      severity: "warning",
      message: "Pagina are prea puține secțiuni vizibile pentru un traseu complet.",
      autoFixed: false,
    });
  }

  if (repeatedCopy(draft)) {
    issues.push({
      code: "REDUNDANT_COPY",
      severity: "info",
      message: "Există copy repetat între zone; merită rafinat într-o iterație următoare.",
      autoFixed: false,
    });
  }

  const score = Math.max(
    0,
    Math.min(
      100,
      100 - issues.reduce((total, issue) => total + issuePenalty(issue), 0)
    )
  );

  return {
    draft,
    report: {
      score,
      status: reportStatus(score),
      fixesApplied: issues.filter((issue) => issue.autoFixed).length,
      issues,
    },
  };
}
