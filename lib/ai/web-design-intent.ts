import {
  SECTION_IDS,
  SITE_PRESETS,
  type EditableSite,
  type SiteSectionId,
} from "./site-editor.ts";

export type WebDesignRequestMode = "compose" | "refine" | "alternative";
export type WebDesignBusinessArchetype =
  | "local_service"
  | "professional_service"
  | "retail"
  | "hospitality"
  | "creative"
  | "b2b"
  | "event"
  | "general";

export type WebDesignPrimaryGoal =
  | "lead_generation"
  | "booking"
  | "direct_sale"
  | "trust"
  | "showcase"
  | "inquiry";

export type WebDesignPrimaryAction =
  | "request_quote"
  | "book"
  | "buy"
  | "contact"
  | "view_work";

export type WebDesignStrategy = {
  mode: WebDesignRequestMode;
  archetype: WebDesignBusinessArchetype;
  primaryGoal: WebDesignPrimaryGoal;
  primaryAction: WebDesignPrimaryAction;
  confidence: "low" | "medium" | "high";
  sectionOrder: SiteSectionId[];
  visibleSections: SiteSectionId[];
  hiddenSections: SiteSectionId[];
  priorities: string[];
};

const SECTION_TERMS: Record<SiteSectionId, string[]> = {
  hero: ["hero"],
  services: ["servicii", "serviciu", "services", "produse", "products"],
  benefits: ["beneficii", "benefits", "avantaje"],
  about: ["despre", "about", "poveste", "story"],
  gallery: ["galerie", "gallery", "portofoliu", "portfolio", "lucrari", "proiecte"],
  process: ["proces", "process", "cum lucram", "cum functioneaza", "steps", "pasi"],
  faq: ["faq", "intrebari", "intrebari frecvente", "questions"],
  contact: ["contact", "formular", "form", "programare", "rezervare"],
};

const ARCHETYPE_TERMS: Record<WebDesignBusinessArchetype, string[]> = {
  local_service: [
    "instalatii",
    "instalator",
    "electrician",
    "asfaltari",
    "constructii",
    "renovari",
    "service auto",
    "detailing",
    "curatenie",
    "mentenanta",
    "reparatii",
    "service local",
  ],
  professional_service: [
    "avocat",
    "avocatura",
    "contabil",
    "contabilitate",
    "consultanta",
    "consultant",
    "arhitect",
    "cabinet",
    "clinica",
    "terapie",
    "agentie",
    "servicii profesionale",
  ],
  retail: [
    "magazin",
    "shop",
    "ecommerce",
    "e-commerce",
    "florarie",
    "flori",
    "produse",
    "catalog",
    "comenzi online",
    "cos",
    "checkout",
  ],
  hospitality: [
    "restaurant",
    "cafenea",
    "cafe",
    "hotel",
    "pensiune",
    "salon",
    "bar",
    "rezervari",
    "rezervare masa",
  ],
  creative: [
    "fotograf",
    "fotografie",
    "videograf",
    "designer",
    "studio creativ",
    "artist",
    "portfolio",
    "portofoliu",
    "branding",
  ],
  b2b: [
    "b2b",
    "saas",
    "software",
    "platforma",
    "furnizor",
    "distributie",
    "industrial",
    "producator",
    "enterprise",
  ],
  event: [
    "nunta",
    "botez",
    "majorat",
    "eveniment",
    "event",
    "rsvp",
    "invitatie",
  ],
  general: [],
};

const GOAL_TERMS: Record<WebDesignPrimaryGoal, string[]> = {
  lead_generation: [
    "cere oferta",
    "cerere oferta",
    "solicita oferta",
    "oferta",
    "lead",
    "formular",
    "deviz",
    "estimare",
    "cotatie",
  ],
  booking: [
    "programare",
    "programeaza",
    "rezervare",
    "rezerva",
    "booking",
    "appointment",
  ],
  direct_sale: [
    "cumpara",
    "comanda",
    "vanzare",
    "vinde",
    "checkout",
    "cos",
    "ecommerce",
    "e-commerce",
    "produse",
  ],
  trust: [
    "incredere",
    "credibilitate",
    "autoritate",
    "expertiza",
    "despre noi",
    "cine suntem",
  ],
  showcase: [
    "portofoliu",
    "portfolio",
    "galerie",
    "gallery",
    "proiecte",
    "lucrari",
    "before after",
    "before / after",
  ],
  inquiry: [
    "contact",
    "discutie",
    "mesaj",
    "scrie-ne",
    "vorbim",
    "consulta",
  ],
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

function keywordScore(value: string, terms: string[]) {
  return terms.reduce((score, term) => score + (value.includes(term) ? 1 : 0), 0);
}

function uniqueSections(items: SiteSectionId[]) {
  return items.filter((item, index) => items.indexOf(item) === index);
}

function currentSiteContext(current: EditableSite) {
  return [
    current.brand,
    current.eyebrow,
    current.headline,
    current.description,
    current.cta,
    current.servicesTitle,
    ...current.services.flatMap((item) => [item.title, item.description]),
    current.benefitsTitle,
    ...current.benefits.flatMap((item) => [item.title, item.description]),
    current.aboutTitle,
    current.aboutDescription,
    current.galleryTitle,
    current.processTitle,
    current.faqTitle,
    current.contactTitle,
    current.contactDescription,
  ].join("\n");
}

export function inferWebDesignRequestMode(prompt: string): WebDesignRequestMode {
  const value = normalize(prompt);

  if (
    /\b(alta propunere|alta varianta|o alta varianta|versiune diferita|varianta diferita|alternative|another version|another proposal|different version)\b/.test(
      value
    )
  ) {
    return "alternative";
  }

  if (
    /\b(schimba|modifica|ajusteaza|rafineaza|rescrie|pastreaza|ascunde|arata|adauga|scoate|elimina|reduce|mareste|micsoreaza|fa(?:-l|-o| l| o)? mai)\b/.test(
      value
    )
  ) {
    return "refine";
  }

  return "compose";
}

function inferArchetype(prompt: string) {
  const value = normalize(prompt);
  let best: WebDesignBusinessArchetype = "general";
  let bestScore = 0;

  for (const [archetype, terms] of Object.entries(ARCHETYPE_TERMS) as Array<
    [WebDesignBusinessArchetype, string[]]
  >) {
    const score = keywordScore(value, terms);
    if (score > bestScore) {
      best = archetype;
      bestScore = score;
    }
  }

  return { archetype: best, score: bestScore };
}

function defaultGoalForArchetype(
  archetype: WebDesignBusinessArchetype
): WebDesignPrimaryGoal {
  if (archetype === "retail") return "direct_sale";
  if (archetype === "hospitality") return "booking";
  if (archetype === "creative") return "showcase";
  if (archetype === "event") return "inquiry";
  if (archetype === "local_service" || archetype === "b2b") return "lead_generation";
  return "inquiry";
}

function inferGoal(prompt: string, archetype: WebDesignBusinessArchetype) {
  const value = normalize(prompt);
  let best: WebDesignPrimaryGoal = defaultGoalForArchetype(archetype);
  let bestScore = 0;

  for (const [goal, terms] of Object.entries(GOAL_TERMS) as Array<
    [WebDesignPrimaryGoal, string[]]
  >) {
    const score = keywordScore(value, terms);
    if (score > bestScore) {
      best = goal;
      bestScore = score;
    }
  }

  return { goal: best, score: bestScore };
}

function actionForGoal(goal: WebDesignPrimaryGoal): WebDesignPrimaryAction {
  if (goal === "lead_generation") return "request_quote";
  if (goal === "booking") return "book";
  if (goal === "direct_sale") return "buy";
  if (goal === "showcase") return "view_work";
  return "contact";
}

function baseVisibleSections(
  goal: WebDesignPrimaryGoal,
  archetype: WebDesignBusinessArchetype
): SiteSectionId[] {
  if (goal === "direct_sale") {
    return ["hero", "services", "gallery", "benefits", "faq", "contact"];
  }
  if (goal === "booking") {
    return ["hero", "services", "benefits", "gallery", "process", "faq", "contact"];
  }
  if (goal === "showcase") {
    return ["hero", "gallery", "services", "about", "benefits", "contact"];
  }
  if (goal === "trust") {
    return ["hero", "about", "benefits", "services", "process", "faq", "contact"];
  }
  if (goal === "lead_generation") {
    return ["hero", "services", "benefits", "process", "about", "faq", "contact"];
  }

  if (archetype === "event") {
    return ["hero", "gallery", "about", "benefits", "faq", "contact"];
  }
  return ["hero", "services", "benefits", "about", "process", "contact"];
}

function explicitSectionRules(prompt: string) {
  const value = normalize(prompt);
  const show = new Set<SiteSectionId>();
  const hide = new Set<SiteSectionId>();

  const hideWords = ["ascunde", "scoate", "elimina", "fara", "hide", "remove"];
  const showWords = ["adauga", "arata", "include", "pastreaza", "show", "add", "keep"];

  for (const id of SECTION_IDS) {
    for (const term of SECTION_TERMS[id]) {
      let offset = 0;
      while (offset < value.length) {
        const index = value.indexOf(term, offset);
        if (index < 0) break;

        const prefix = value.slice(Math.max(0, index - 24), index).trim();
        const nearestWord = prefix.split(/\s+/).slice(-4).join(" ");
        if (hideWords.some((word) => nearestWord.includes(word))) hide.add(id);
        if (showWords.some((word) => nearestWord.includes(word))) show.add(id);

        offset = index + term.length;
      }
    }
  }

  hide.delete("hero");
  show.add("hero");

  for (const id of show) hide.delete(id);
  return { show, hide };
}

function hasNonDemoContext(current: EditableSite) {
  const preset = SITE_PRESETS[current.preset];
  return (
    current.brand !== preset.brand ||
    current.headline !== preset.headline ||
    current.description !== preset.description ||
    current.cta !== preset.cta ||
    JSON.stringify(current.services) !== JSON.stringify(preset.services)
  );
}

function alternateVisibleOrder(visible: SiteSectionId[], current: EditableSite) {
  const visibleCurrent = current.sectionOrder.filter((id) => visible.includes(id));
  const candidates: SiteSectionId[][] = [
    ["hero", "benefits", "services", "gallery", "process", "about", "faq", "contact"],
    ["hero", "gallery", "services", "benefits", "about", "process", "faq", "contact"],
    ["hero", "services", "process", "benefits", "gallery", "about", "faq", "contact"],
  ];

  const projected = candidates
    .map((candidate) => candidate.filter((id) => visible.includes(id)))
    .find(
      (candidate) =>
        candidate.length === visibleCurrent.length &&
        candidate.some((id, index) => id !== visibleCurrent[index])
    );

  return projected ?? visible;
}

function strategyPriorities(
  goal: WebDesignPrimaryGoal,
  archetype: WebDesignBusinessArchetype
) {
  const priorities = [
    "Păstrează un singur CTA principal și repetă-l doar unde ajută traseul utilizatorului.",
    "Primele două ecrane trebuie să explice rapid ce oferă business-ul și ce acțiune trebuie făcută.",
    "Pe mobil, informația esențială și CTA-ul trebuie să apară înaintea secțiunilor secundare.",
  ];

  if (goal === "lead_generation") {
    priorities.push("Reduce fricțiunea până la cererea de ofertă și explică suficient serviciile înainte de contact.");
  } else if (goal === "booking") {
    priorities.push("Fă programarea sau rezervarea ușor de găsit după prezentarea ofertei.");
  } else if (goal === "direct_sale") {
    priorities.push("Pune oferta sau produsele înaintea poveștii de brand și menține traseul spre comandă clar.");
  } else if (goal === "showcase") {
    priorities.push("Portofoliul real trebuie să apară devreme; nu inventa proiecte sau rezultate.");
  } else if (goal === "trust") {
    priorities.push("Prioritizează explicația, procesul și dovezile reale; nu inventa testimoniale sau certificări.");
  } else {
    priorities.push("Păstrează traseul spre contact scurt și evită secțiunile care repetă aceeași idee.");
  }

  if (archetype === "local_service") {
    priorities.push("Serviciile și procesul trebuie să fie ușor de scanat, fără jargon inutil.");
  } else if (archetype === "retail") {
    priorities.push("Conținutul vizual și oferta trebuie să domine înaintea secțiunii despre brand.");
  } else if (archetype === "b2b") {
    priorities.push("Clarifică problema rezolvată și procesul înainte de detaliile de companie.");
  }

  return priorities.slice(0, 5);
}

export function buildWebDesignStrategy(
  prompt: string,
  current: EditableSite
): WebDesignStrategy {
  const mode = inferWebDesignRequestMode(prompt);
  const context = currentSiteContext(current);

  const promptArchetype = inferArchetype(prompt);
  const contextArchetype = inferArchetype(context);
  const archetypeResult =
    promptArchetype.score > 0 ? promptArchetype : contextArchetype;

  const promptGoal = inferGoal(prompt, archetypeResult.archetype);
  const contextGoal = inferGoal(context, archetypeResult.archetype);
  const goalResult = promptGoal.score > 0 ? promptGoal : contextGoal;

  const explicit = explicitSectionRules(prompt);

  let visible =
    mode === "refine"
      ? current.sectionOrder.filter((id) => !current.hiddenSections.includes(id))
      : baseVisibleSections(goalResult.goal, archetypeResult.archetype);

  visible = uniqueSections([
    ...visible.filter((id) => !explicit.hide.has(id)),
    ...SECTION_IDS.filter((id) => explicit.show.has(id) && !visible.includes(id)),
  ]);

  if (!visible.includes("hero")) visible.unshift("hero");
  if (!visible.includes("contact") && !explicit.hide.has("contact")) visible.push("contact");

  if (mode === "alternative") {
    visible = alternateVisibleOrder(visible, current);
  }

  const hidden = SECTION_IDS.filter((id) => !visible.includes(id) || explicit.hide.has(id));
  const orderedVisible = visible.filter((id) => !hidden.includes(id));
  const sectionOrder = uniqueSections([
    ...orderedVisible,
    ...current.sectionOrder.filter((id) => hidden.includes(id)),
    ...SECTION_IDS,
  ]).slice(0, SECTION_IDS.length);

  const promptEvidenceScore = promptArchetype.score + promptGoal.score;
  const contextEvidenceScore = hasNonDemoContext(current)
    ? contextArchetype.score + contextGoal.score
    : 0;
  const evidenceScore = Math.max(promptEvidenceScore, contextEvidenceScore);
  const confidence =
    evidenceScore >= 3 ? "high" : evidenceScore >= 1 ? "medium" : "low";

  return {
    mode,
    archetype: archetypeResult.archetype,
    primaryGoal: goalResult.goal,
    primaryAction: actionForGoal(goalResult.goal),
    confidence,
    sectionOrder,
    visibleSections: orderedVisible,
    hiddenSections: hidden,
    priorities: strategyPriorities(goalResult.goal, archetypeResult.archetype),
  };
}

export function applyWebDesignStrategy(
  draft: EditableSite,
  strategy: WebDesignStrategy
): EditableSite {
  if (strategy.mode === "refine") return draft;

  return {
    ...draft,
    sectionOrder: [...strategy.sectionOrder],
    hiddenSections: [...strategy.hiddenSections],
  };
}

export function webDesignStrategyInstruction(strategy: WebDesignStrategy) {
  return [
    "ORBYVEN Site Strategy:",
    `request_mode=${strategy.mode}`,
    `business_archetype=${strategy.archetype}`,
    `primary_goal=${strategy.primaryGoal}`,
    `primary_action=${strategy.primaryAction}`,
    `strategy_confidence=${strategy.confidence}`,
    `visible_sections=${strategy.visibleSections.join(",")}`,
    `hidden_sections=${strategy.hiddenSections.join(",") || "none"}`,
    `section_order=${strategy.sectionOrder.join(">")}`,
    ...strategy.priorities.map((item, index) => `priority_${index + 1}=${item}`),
  ].join("\n");
}
