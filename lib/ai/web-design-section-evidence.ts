import type { EditableSite, SiteSectionId } from "./site-editor.ts";
import type { WebDesignInterviewFact } from "./web-design-interview.ts";
import type {
  WebDesignPrimaryAction,
  WebDesignPrimaryGoal,
  WebDesignStrategy,
} from "./web-design-intent.ts";

export type WebDesignVerifiedSectionPlan = {
  strategy: WebDesignStrategy;
  supportedSections: SiteSectionId[];
  unavailableSections: SiteSectionId[];
  appliedFacts: string[];
  changed: boolean;
};

const FACT_SECTION: Partial<
  Record<WebDesignInterviewFact["id"], SiteSectionId>
> = {
  hero_offer: "hero",
  services_real: "services",
  gallery_real: "gallery",
  about_real: "about",
  process_real: "process",
  faq_real: "faq",
  contact_real: "contact",
};

const OPTIONAL_NEGATIVE_SECTIONS = new Set<SiteSectionId>([
  "gallery",
  "about",
  "process",
  "faq",
]);

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNegativeAnswer(value: string) {
  const normalized = normalize(value);
  return /^(nu|nu am|nu avem|nu exista|nu folosim|fara|nimic|none|no|not applicable|n\/a)\b/.test(
    normalized
  );
}

function goalFromAnswer(
  value: string
): { goal: WebDesignPrimaryGoal; action: WebDesignPrimaryAction } | null {
  const normalized = normalize(value);

  if (/\b(programare|programeaza|rezervare|rezerva|booking|appointment)\b/.test(normalized)) {
    return { goal: "booking", action: "book" };
  }
  if (/\b(comanda|cumpara|vanzare|vinde|checkout|cos|buy|order)\b/.test(normalized)) {
    return { goal: "direct_sale", action: "buy" };
  }
  if (/\b(oferta|deviz|estimare|cotatie|quote)\b/.test(normalized)) {
    return { goal: "lead_generation", action: "request_quote" };
  }
  if (/\b(portofoliu|proiecte|lucrari|portfolio|gallery)\b/.test(normalized)) {
    return { goal: "showcase", action: "view_work" };
  }
  if (/\b(incredere|credibilitate|autoritate|expertiza|trust)\b/.test(normalized)) {
    return { goal: "trust", action: "contact" };
  }
  if (/\b(contact|mesaj|telefon|whatsapp|email|discutie|inquiry)\b/.test(normalized)) {
    return { goal: "inquiry", action: "contact" };
  }

  return null;
}

function orderForGoal(
  goal: WebDesignPrimaryGoal,
  visible: SiteSectionId[],
  current: EditableSite
) {
  const candidates: Record<WebDesignPrimaryGoal, SiteSectionId[]> = {
    lead_generation: ["hero", "services", "benefits", "process", "about", "faq", "contact", "gallery"],
    booking: ["hero", "services", "benefits", "gallery", "process", "faq", "contact", "about"],
    direct_sale: ["hero", "services", "gallery", "benefits", "faq", "contact", "about", "process"],
    trust: ["hero", "about", "benefits", "services", "process", "faq", "contact", "gallery"],
    showcase: ["hero", "gallery", "services", "about", "benefits", "contact", "process", "faq"],
    inquiry: ["hero", "services", "benefits", "about", "process", "contact", "gallery", "faq"],
  };

  const preferred = candidates[goal];
  return [
    ...preferred.filter((section) => visible.includes(section)),
    ...current.sectionOrder.filter(
      (section) => visible.includes(section) && !preferred.includes(section)
    ),
  ];
}

function uniqueSections(items: SiteSectionId[]) {
  return items.filter((item, index) => items.indexOf(item) === index);
}

export function applyVerifiedSectionEvidence(
  strategy: WebDesignStrategy,
  facts: WebDesignInterviewFact[],
  current: EditableSite
): WebDesignVerifiedSectionPlan {
  if (!facts.length || strategy.mode === "refine") {
    return {
      strategy,
      supportedSections: [],
      unavailableSections: [],
      appliedFacts: [],
      changed: false,
    };
  }

  const supported = new Set<SiteSectionId>();
  const unavailable = new Set<SiteSectionId>();
  const appliedFacts: string[] = [];
  let primaryGoal = strategy.primaryGoal;
  let primaryAction = strategy.primaryAction;

  for (const fact of facts.slice(-8)) {
    if (fact.id === "conversion_goal") {
      const resolved = goalFromAnswer(fact.answer);
      if (resolved) {
        primaryGoal = resolved.goal;
        primaryAction = resolved.action;
        appliedFacts.push(fact.id);
      }
      continue;
    }

    const section = FACT_SECTION[fact.id];
    if (!section) continue;

    if (isNegativeAnswer(fact.answer) && OPTIONAL_NEGATIVE_SECTIONS.has(section)) {
      unavailable.add(section);
      supported.delete(section);
      appliedFacts.push(fact.id);
      continue;
    }

    if (!isNegativeAnswer(fact.answer)) {
      supported.add(section);
      unavailable.delete(section);
      appliedFacts.push(fact.id);
    }
  }

  const visible = uniqueSections([
    ...strategy.visibleSections.filter((section) => !unavailable.has(section)),
    ...Array.from(supported).filter(
      (section) => !strategy.visibleSections.includes(section)
    ),
  ]);

  if (!visible.includes("hero")) visible.unshift("hero");
  if (!visible.includes("contact")) visible.push("contact");

  const visibleOrder = orderForGoal(primaryGoal, visible, current);
  const hidden = current.sectionOrder.filter(
    (section) => section !== "hero" && !visible.includes(section)
  );

  const allSections = uniqueSections([
    ...visibleOrder,
    ...current.sectionOrder.filter((section) => !visible.includes(section)),
  ]);

  const next: WebDesignStrategy = {
    ...strategy,
    primaryGoal,
    primaryAction,
    confidence:
      appliedFacts.length > 0 && strategy.confidence === "low"
        ? "medium"
        : strategy.confidence,
    visibleSections: visibleOrder,
    hiddenSections: hidden,
    sectionOrder: allSections,
    priorities:
      appliedFacts.length > 0
        ? [
            ...strategy.priorities,
            "Folosește răspunsurile Smart Interview confirmate ca sursă de adevăr pentru secțiunile relevante.",
          ].slice(0, 5)
        : strategy.priorities,
  };

  const changed =
    JSON.stringify(next.sectionOrder) !== JSON.stringify(strategy.sectionOrder) ||
    JSON.stringify(next.hiddenSections) !== JSON.stringify(strategy.hiddenSections) ||
    next.primaryGoal !== strategy.primaryGoal ||
    next.primaryAction !== strategy.primaryAction ||
    next.confidence !== strategy.confidence;

  return {
    strategy: next,
    supportedSections: Array.from(supported),
    unavailableSections: Array.from(unavailable),
    appliedFacts,
    changed,
  };
}
