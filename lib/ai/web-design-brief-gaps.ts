import type { EditableSite, SiteSectionId } from "./site-editor.ts";
import type { WebDesignStrategy } from "./web-design-intent.ts";
import type { WebDesignReadinessReport } from "./web-design-readiness.ts";
import type {
  WebDesignEvidenceConcept,
  WebDesignEvidenceGuardReport,
} from "./web-design-evidence.ts";

export type WebDesignBriefGapId =
  | "brand_name"
  | "hero_offer"
  | "services_real"
  | "gallery_real"
  | "about_real"
  | "process_real"
  | "faq_real"
  | "contact_real"
  | "conversion_goal"
  | "claim_evidence";

export type WebDesignBriefGap = {
  id: WebDesignBriefGapId;
  label: string;
  question: string;
  priority: 1 | 2 | 3;
  sections: SiteSectionId[];
};

export type WebDesignBriefGapReport = {
  count: number;
  completionScore: number;
  labels: string[];
  gaps: WebDesignBriefGap[];
};

const SECTION_GAPS: Partial<
  Record<SiteSectionId, Omit<WebDesignBriefGap, "sections">>
> = {
  hero: {
    id: "hero_offer",
    label: "oferta principală",
    question:
      "Care este oferta principală pe care vrei să o înțeleagă clientul imediat?",
    priority: 1,
  },
  services: {
    id: "services_real",
    label: "servicii/produse reale",
    question: "Care sunt serviciile sau produsele reale pe care vrei să le afișăm?",
    priority: 1,
  },
  gallery: {
    id: "gallery_real",
    label: "proiecte/produse reale",
    question: "Ce proiecte, produse sau exemple reale vrei să apară în galerie?",
    priority: 2,
  },
  about: {
    id: "about_real",
    label: "descriere reală firmă",
    question: "Cum ai descrie firma în 1–2 propoziții, fără formulări de marketing?",
    priority: 2,
  },
  process: {
    id: "process_real",
    label: "proces real de lucru",
    question: "Care sunt pașii reali prin care trece un client de la cerere la rezultat?",
    priority: 2,
  },
  faq: {
    id: "faq_real",
    label: "întrebări reale",
    question: "Care sunt întrebările pe care le primești cel mai des de la clienți?",
    priority: 3,
  },
  contact: {
    id: "contact_real",
    label: "traseu de contact",
    question: "Cum vrei să continue clientul: mesaj, ofertă, programare sau comandă?",
    priority: 1,
  },
};

const CLAIM_LABELS: Record<WebDesignEvidenceConcept, string> = {
  credentials: "autorizări/certificări",
  guarantee: "garanție",
  free_delivery: "livrare gratuită",
  nonstop: "program non-stop",
  market_leader: "poziționare lider de piață",
  free_consultation: "consultație gratuită",
  same_day: "livrare în aceeași zi",
  insured: "asigurare profesională",
  official_partner: "parteneriat oficial",
  emergency_service: "serviciu de urgență",
  money_back: "garanție money-back",
};

function dedupeGaps(gaps: WebDesignBriefGap[]) {
  const seen = new Set<string>();
  return gaps.filter((gap) => {
    const key = `${gap.id}:${gap.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function deriveWebDesignBriefGaps(
  draft: EditableSite,
  strategy: WebDesignStrategy,
  readiness: WebDesignReadinessReport,
  evidence: WebDesignEvidenceGuardReport
): WebDesignBriefGapReport {
  const gaps: WebDesignBriefGap[] = [];

  const demoBrand = readiness.blockers.some(
    (blocker) => blocker.code === "DEMO_BRAND"
  );
  if (demoBrand) {
    gaps.push({
      id: "brand_name",
      label: "nume brand real",
      question: "Care este numele real al brandului sau firmei?",
      priority: 1,
      sections: ["hero"],
    });
  }

  const placeholderSections = new Set(
    readiness.blockers
      .filter((blocker) => blocker.code === "PLACEHOLDER_COPY")
      .flatMap((blocker) => blocker.sections)
  );

  for (const section of placeholderSections) {
    const template = SECTION_GAPS[section];
    if (!template) continue;
    gaps.push({
      ...template,
      sections: [section],
    });
  }

  if (strategy.confidence === "low") {
    gaps.push({
      id: "conversion_goal",
      label: "obiectiv principal",
      question:
        "Care este acțiunea principală dorită: ofertă, programare, vânzare, contact sau portofoliu?",
      priority: 1,
      sections: ["hero", "contact"],
    });
  }

  if (evidence.unsupportedConcepts.length > 0) {
    const labels = evidence.unsupportedConcepts
      .slice(0, 3)
      .map((concept) => CLAIM_LABELS[concept])
      .join(", ");
    gaps.push({
      id: "claim_evidence",
      label: "dovezi pentru afirmații",
      question: `Poți confirma că sunt reale următoarele afirmații: ${labels}?`,
      priority: 2,
      sections: [],
    });
  }

  const unique = dedupeGaps(gaps)
    .sort((left, right) => left.priority - right.priority)
    .slice(0, 6);

  const penalty = unique.reduce(
    (total, gap) => total + (gap.priority === 1 ? 12 : gap.priority === 2 ? 7 : 4),
    0
  );

  return {
    count: unique.length,
    completionScore: Math.max(0, Math.min(100, 100 - penalty)),
    labels: unique.map((gap) => gap.label).slice(0, 4),
    gaps: unique,
  };
}
