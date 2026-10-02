/**
 * Typed, bounded website draft.
 * AI returns data, never executable code. Generative output is validated here before rendering.
 * Presets are starting points only and do not modify pilot websites.
 */
export type SitePresetId = "studio" | "instalatii" | "detailing" | "florarie";
export type SiteLayout = "split" | "centered" | "editorial";
export type SiteSectionId =
  | "hero"
  | "services"
  | "benefits"
  | "about"
  | "gallery"
  | "process"
  | "faq"
  | "contact";
export type SiteVisualTone = "minimal" | "editorial" | "luxury" | "technical" | "warm" | "bold";
export type SiteDensity = "airy" | "balanced" | "compact";
export type SiteRadius = "soft" | "rounded" | "sharp";

export const SECTION_IDS: SiteSectionId[] = [
  "hero",
  "services",
  "benefits",
  "about",
  "gallery",
  "process",
  "faq",
  "contact",
];

export const SECTION_LABELS: Record<SiteSectionId, string> = {
  hero: "Hero",
  services: "Servicii",
  benefits: "Beneficii",
  about: "Despre",
  gallery: "Galerie",
  process: "Proces",
  faq: "Întrebări",
  contact: "Contact",
};

export type SiteSectionVariants = {
  hero: "split" | "centered" | "editorial";
  services: "cards" | "list" | "spotlight";
  benefits: "cards" | "strip";
  about: "split" | "story";
  gallery: "grid" | "mosaic";
  process: "steps" | "timeline";
  faq: "stack" | "columns";
  contact: "split" | "compact";
};

export type SiteContentItem = {
  title: string;
  description: string;
};

export type SiteFaqItem = {
  question: string;
  answer: string;
};

export type EditableSite = {
  preset: SitePresetId;
  layout: SiteLayout;
  headlineSize: "normal" | "large";
  visualTone: SiteVisualTone;
  density: SiteDensity;
  radius: SiteRadius;
  sectionOrder: SiteSectionId[];
  hiddenSections: SiteSectionId[];
  variants: SiteSectionVariants;

  brand: string;
  eyebrow: string;
  headline: string;
  description: string;
  cta: string;

  servicesTitle: string;
  services: SiteContentItem[];
  benefitsTitle: string;
  benefits: SiteContentItem[];
  aboutTitle: string;
  aboutDescription: string;
  galleryTitle: string;
  gallery: SiteContentItem[];
  processTitle: string;
  process: SiteContentItem[];
  faqTitle: string;
  faq: SiteFaqItem[];
  contactTitle: string;
  contactDescription: string;

  accent: string;
  background: string;
  surface: string;
  textColor: string;
};

export const SITE_PRESET_LABELS: Record<SitePresetId, string> = {
  studio: "Studio / servicii",
  instalatii: "Instalații",
  detailing: "Detailing auto",
  florarie: "Florărie",
};

const DEFAULT_VARIANTS: SiteSectionVariants = {
  hero: "split",
  services: "cards",
  benefits: "cards",
  about: "split",
  gallery: "grid",
  process: "steps",
  faq: "stack",
  contact: "split",
};

export const SITE_PRESETS: Record<SitePresetId, EditableSite> = {
  studio: {
    preset: "studio",
    layout: "split",
    headlineSize: "normal",
    visualTone: "minimal",
    density: "balanced",
    radius: "rounded",
    sectionOrder: [...SECTION_IDS],
    hiddenSections: ["gallery", "faq"],
    variants: { ...DEFAULT_VARIANTS },
    brand: "Atelier Studio",
    eyebrow: "BINE AI VENIT",
    headline: "Un site care spune povestea afacerii tale.",
    description: "Un spațiu digital elegant, construit în jurul serviciilor și clienților tăi.",
    cta: "Cere o ofertă",
    servicesTitle: "Ce oferim",
    services: [
      { title: "Serviciu principal", description: "Explică pe scurt serviciul care aduce cea mai mare valoare clienților." },
      { title: "Serviciu complementar", description: "Prezintă o a doua soluție relevantă, într-un limbaj simplu." },
      { title: "Suport", description: "Arată ce se întâmplă după prima discuție sau după livrare." },
    ],
    benefitsTitle: "De ce să lucrăm împreună",
    benefits: [
      { title: "Claritate", description: "Proces simplu și pași ușor de urmărit." },
      { title: "Adaptare", description: "Soluția se construiește în jurul nevoii reale." },
      { title: "Comunicare", description: "Contact direct și informații ușor de găsit." },
    ],
    aboutTitle: "Despre noi",
    aboutDescription: "Fiecare proiect începe cu o conversație și o idee bună.",
    galleryTitle: "Selecție vizuală",
    gallery: [
      { title: "Exemplu vizual 01", description: "Spațiu rezervat pentru o imagine sau un proiect real." },
      { title: "Exemplu vizual 02", description: "Înlocuiește cu material real înainte de publicare." },
      { title: "Exemplu vizual 03", description: "Conținut demonstrativ, fără afirmații comerciale inventate." },
    ],
    processTitle: "Cum lucrăm",
    process: [
      { title: "Discuție", description: "Clarificăm nevoia și obiectivul." },
      { title: "Propunere", description: "Alegem direcția și pașii potriviți." },
      { title: "Livrare", description: "Finalizăm și verificăm rezultatul." },
    ],
    faqTitle: "Întrebări frecvente",
    faq: [
      { question: "Cum începem?", answer: "Trimite-ne câteva detalii, iar următorul pas se stabilește împreună." },
      { question: "Pot cere o ofertă?", answer: "Da. Formularul de contact poate fi adaptat pentru cereri de ofertă." },
    ],
    contactTitle: "Hai să vorbim",
    contactDescription: "Spune-ne ce ai în minte și discutăm pașii următori.",
    accent: "#6058e8",
    background: "#f6f5f2",
    surface: "#ffffff",
    textColor: "#24242a",
  },
  instalatii: {
    preset: "instalatii",
    layout: "split",
    headlineSize: "normal",
    visualTone: "technical",
    density: "balanced",
    radius: "soft",
    sectionOrder: [...SECTION_IDS],
    hiddenSections: ["gallery", "faq"],
    variants: { ...DEFAULT_VARIANTS, services: "list", process: "timeline" },
    brand: "Atelier Instalații",
    eyebrow: "INSTALAȚII ȘI CONFORT",
    headline: "Mai mult confort, de la proiect la ultimul detaliu.",
    description: "Soluții pentru instalații termice și sanitare. Descoperă serviciile și cere o ofertă adaptată proiectului.",
    cta: "Solicită o ofertă",
    servicesTitle: "Serviciile noastre",
    services: [
      { title: "Instalații termice", description: "Prezentare clară a lucrărilor și soluțiilor oferite." },
      { title: "Instalații sanitare", description: "Servicii explicate pe înțelesul clientului final." },
      { title: "Mentenanță", description: "Intervenții și suport prezentate fără promisiuni neverificate." },
    ],
    benefitsTitle: "O lucrare mai ușor de înțeles",
    benefits: [
      { title: "Pași clari", description: "Clientul vede ce urmează înainte de începerea lucrării." },
      { title: "Ofertare", description: "Site-ul poate direcționa rapid către cererea de ofertă." },
      { title: "Contact", description: "Datele importante rămân ușor accesibile." },
    ],
    aboutTitle: "Lucrăm cu grijă pentru confortul tău",
    aboutDescription: "Soluții pentru lucrări termice și sanitare, adaptate spațiului tău.",
    galleryTitle: "Lucrări",
    gallery: [
      { title: "Lucrare 01", description: "Adaugă aici o fotografie reală și o descriere verificată." },
      { title: "Lucrare 02", description: "Spațiu pentru portofoliu real." },
      { title: "Lucrare 03", description: "Spațiu pentru portofoliu real." },
    ],
    processTitle: "De la cerere la lucrare",
    process: [
      { title: "Detalii", description: "Clientul descrie lucrarea." },
      { title: "Evaluare", description: "Se clarifică soluția potrivită." },
      { title: "Programare", description: "Se stabilește următorul pas." },
    ],
    faqTitle: "Întrebări frecvente",
    faq: [
      { question: "Cum cer o ofertă?", answer: "Trimite detaliile lucrării prin formularul de contact." },
      { question: "Pot trimite fotografii?", answer: "Fluxul poate fi extins cu încărcare de fișiere atunci când este necesar." },
    ],
    contactTitle: "Cere o ofertă",
    contactDescription: "Descrie proiectul și vom discuta detaliile lucrării.",
    accent: "#176c79",
    background: "#f4f7f7",
    surface: "#ffffff",
    textColor: "#162b31",
  },
  detailing: {
    preset: "detailing",
    layout: "editorial",
    headlineSize: "large",
    visualTone: "luxury",
    density: "airy",
    radius: "rounded",
    sectionOrder: [...SECTION_IDS],
    hiddenSections: ["faq"],
    variants: { ...DEFAULT_VARIANTS, hero: "editorial", gallery: "mosaic", benefits: "strip" },
    brand: "Hao's Customs",
    eyebrow: "DETAILING PROFESIONIST",
    headline: "Fiecare detaliu schimbă totul.",
    description: "Îngrijire atentă pentru interiorul și exteriorul mașinii tale. Explorează serviciile și alege serviciul potrivit.",
    cta: "Vezi serviciile",
    servicesTitle: "Servicii detailing",
    services: [
      { title: "Exterior", description: "Prezintă serviciile exterioare într-un format vizual și ușor de comparat." },
      { title: "Interior", description: "Grupează clar operațiunile pentru interior." },
      { title: "Protecție", description: "Descrie opțiunile disponibile fără promisiuni tehnice neverificate." },
    ],
    benefitsTitle: "Experiență simplă",
    benefits: [
      { title: "Servicii clare", description: "Clientul înțelege rapid ce poate alege." },
      { title: "Portofoliu", description: "Rezultatele reale pot fi puse în centrul paginii." },
      { title: "Programare", description: "CTA-ul principal poate conduce direct către programare." },
    ],
    aboutTitle: "Pasiune pentru fiecare detaliu",
    aboutDescription: "Îngrijim fiecare suprafață cu atenție la rezultat.",
    galleryTitle: "Before / After",
    gallery: [
      { title: "Transformare 01", description: "Înlocuiește cu imagini reale înainte de publicare." },
      { title: "Transformare 02", description: "Spațiu pentru portofoliu real." },
      { title: "Transformare 03", description: "Spațiu pentru portofoliu real." },
    ],
    processTitle: "Simplu de programat",
    process: [
      { title: "Alegi serviciul", description: "Selectezi tipul de intervenție dorit." },
      { title: "Stabilim detaliile", description: "Confirmăm nevoia și intervalul disponibil." },
      { title: "Predare", description: "Lucrarea se finalizează conform serviciului agreat." },
    ],
    faqTitle: "Întrebări",
    faq: [
      { question: "Cum aleg serviciul?", answer: "Poți porni de la starea actuală a mașinii și rezultatul pe care îl urmărești." },
      { question: "Cum mă programez?", answer: "Folosește butonul principal sau formularul de contact." },
    ],
    contactTitle: "Programează o discuție",
    contactDescription: "Spune-ne ce mașină ai și ce servicii te interesează.",
    accent: "#d4af37",
    background: "#101113",
    surface: "#1a1b1f",
    textColor: "#f7f5f0",
  },
  florarie: {
    preset: "florarie",
    layout: "centered",
    headlineSize: "large",
    visualTone: "warm",
    density: "airy",
    radius: "rounded",
    sectionOrder: [...SECTION_IDS],
    hiddenSections: ["process", "faq"],
    variants: { ...DEFAULT_VARIANTS, hero: "centered", gallery: "mosaic", contact: "compact" },
    brand: "Maison Fleur",
    eyebrow: "FLORI PENTRU MOMENTELE TALE",
    headline: "Un gest mic. O emoție care rămâne.",
    description: "Buchete și aranjamente florale pregătite cu atenție pentru fiecare ocazie.",
    cta: "Descoperă buchetele",
    servicesTitle: "Descoperă colecțiile",
    services: [
      { title: "Buchete", description: "Colecții prezentate vizual și ușor de explorat." },
      { title: "Aranjamente", description: "Spațiu pentru categorii și ocazii." },
      { title: "Comenzi speciale", description: "Direcționează clientul către personalizare." },
    ],
    benefitsTitle: "Creat pentru moment",
    benefits: [
      { title: "Alegere simplă", description: "Produsele importante rămân ușor de găsit." },
      { title: "Personalizare", description: "Clientul poate descrie ocazia și preferințele." },
      { title: "Comandă rapidă", description: "CTA-urile pot conduce către coș sau contact." },
    ],
    aboutTitle: "Flori alese cu grijă",
    aboutDescription: "Aranjamente create pentru momentele care merită să rămână în amintire.",
    galleryTitle: "Colecții",
    gallery: [
      { title: "Colecție 01", description: "Înlocuiește cu produs sau fotografie reală." },
      { title: "Colecție 02", description: "Spațiu vizual pentru selecția curentă." },
      { title: "Colecție 03", description: "Spațiu vizual pentru selecția curentă." },
    ],
    processTitle: "Cum comanzi",
    process: [
      { title: "Alegi", description: "Selectezi produsul sau direcția dorită." },
      { title: "Personalizezi", description: "Completezi detaliile necesare." },
      { title: "Confirmi", description: "Continui către comandă sau contact." },
    ],
    faqTitle: "Întrebări frecvente",
    faq: [
      { question: "Pot personaliza?", answer: "Da, fluxul poate include preferințe și un mesaj pentru comandă." },
      { question: "Cum comand?", answer: "CTA-ul principal poate deschide direct fluxul de comandă." },
    ],
    contactTitle: "Scrie-ne",
    contactDescription: "Povestește-ne pentru ce ocazie pregătim florile.",
    accent: "#a44975",
    background: "#fff8f9",
    surface: "#ffffff",
    textColor: "#34232e",
  },
};

export const DEFAULT_SITE: EditableSite = SITE_PRESETS.studio;

const TEXT_LIMITS = {
  brand: 70,
  eyebrow: 90,
  headline: 140,
  description: 420,
  cta: 45,
  servicesTitle: 80,
  benefitsTitle: 90,
  aboutTitle: 100,
  aboutDescription: 420,
  galleryTitle: 90,
  processTitle: 90,
  faqTitle: 90,
  contactTitle: 100,
  contactDescription: 420,
} as const;

const TEXT_FIELDS = Object.keys(TEXT_LIMITS) as Array<keyof typeof TEXT_LIMITS>;
const COLOR_FIELDS = ["accent", "background", "surface", "textColor"] as const;
const PRESET_IDS = Object.keys(SITE_PRESETS) as SitePresetId[];
const LAYOUTS: SiteLayout[] = ["split", "centered", "editorial"];
const VISUAL_TONES: SiteVisualTone[] = ["minimal", "editorial", "luxury", "technical", "warm", "bold"];
const DENSITIES: SiteDensity[] = ["airy", "balanced", "compact"];
const RADII: SiteRadius[] = ["soft", "rounded", "sharp"];

const VARIANT_OPTIONS = {
  hero: ["split", "centered", "editorial"],
  services: ["cards", "list", "spotlight"],
  benefits: ["cards", "strip"],
  about: ["split", "story"],
  gallery: ["grid", "mosaic"],
  process: ["steps", "timeline"],
  faq: ["stack", "columns"],
  contact: ["split", "compact"],
} as const;

function validOrder(value: unknown): value is SiteSectionId[] {
  return (
    Array.isArray(value) &&
    value.length === SECTION_IDS.length &&
    value[0] === "hero" &&
    new Set(value).size === SECTION_IDS.length &&
    value.every((id) => SECTION_IDS.includes(id))
  );
}

function migrateLegacyOrder(value: unknown): SiteSectionId[] | null {
  if (!Array.isArray(value)) return null;
  const legacy = ["hero", "services", "about", "contact"];
  return value.length === legacy.length && value.every((item, index) => item === legacy[index])
    ? [...SECTION_IDS]
    : null;
}

function validHidden(value: unknown): value is SiteSectionId[] {
  return (
    Array.isArray(value) &&
    value.length <= SECTION_IDS.length - 1 &&
    new Set(value).size === value.length &&
    value.every((id) => id !== "hero" && SECTION_IDS.includes(id))
  );
}

function isHex(value: unknown): value is string {
  return typeof value === "string" && /^#[a-fA-F0-9]{6}$/.test(value);
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function readableText(background: string): string {
  return luminance(background) < 0.18 ? "#fafafa" : "#17171a";
}

function contrast(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function readVariants(value: unknown, fallback: SiteSectionVariants): SiteSectionVariants {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...fallback };
  const record = value as Record<string, unknown>;
  const next = { ...fallback };
  for (const key of Object.keys(VARIANT_OPTIONS) as Array<keyof SiteSectionVariants>) {
    const candidate = record[key];
    if ((VARIANT_OPTIONS[key] as readonly string[]).includes(candidate as string)) {
      next[key] = candidate as never;
    }
  }
  return next;
}

function cleanContentItems(value: unknown, fallback: SiteContentItem[]): SiteContentItem[] {
  if (!Array.isArray(value)) return fallback.map((item) => ({ ...item }));
  const items = value.slice(0, 6).flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = item as Record<string, unknown>;
    const title = typeof row.title === "string" ? row.title.trim().slice(0, 100) : "";
    const description = typeof row.description === "string" ? row.description.trim().slice(0, 360) : "";
    return title && description ? [{ title, description }] : [];
  });
  return items.length ? items : fallback.map((item) => ({ ...item }));
}

function cleanFaqItems(value: unknown, fallback: SiteFaqItem[]): SiteFaqItem[] {
  if (!Array.isArray(value)) return fallback.map((item) => ({ ...item }));
  const items = value.slice(0, 6).flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = item as Record<string, unknown>;
    const question = typeof row.question === "string" ? row.question.trim().slice(0, 140) : "";
    const answer = typeof row.answer === "string" ? row.answer.trim().slice(0, 420) : "";
    return question && answer ? [{ question, answer }] : [];
  });
  return items.length ? items : fallback.map((item) => ({ ...item }));
}

/** Accept previous Alpha drafts and migrate them into the current bounded schema. */
export function readSiteDraft(value: unknown): EditableSite | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const preset = record.preset === undefined ? "studio" : record.preset;
  if (!PRESET_IDS.includes(preset as SitePresetId)) return null;

  const template = SITE_PRESETS[preset as SitePresetId];
  const layout = record.layout === undefined ? template.layout : record.layout;
  const headlineSize = record.headlineSize === undefined ? template.headlineSize : record.headlineSize;
  const visualTone = record.visualTone === undefined ? template.visualTone : record.visualTone;
  const density = record.density === undefined ? template.density : record.density;
  const radius = record.radius === undefined ? template.radius : record.radius;

  if (
    !LAYOUTS.includes(layout as SiteLayout) ||
    !["normal", "large"].includes(headlineSize as string) ||
    !VISUAL_TONES.includes(visualTone as SiteVisualTone) ||
    !DENSITIES.includes(density as SiteDensity) ||
    !RADII.includes(radius as SiteRadius)
  ) return null;

  const migratedLegacyOrder = migrateLegacyOrder(record.sectionOrder);
  const order = record.sectionOrder === undefined
    ? [...template.sectionOrder]
    : migratedLegacyOrder ?? record.sectionOrder;
  if (!validOrder(order)) return null;

  const legacyHidden = migratedLegacyOrder
    ? ["benefits", "gallery", "process", "faq"] satisfies SiteSectionId[]
    : null;
  const hidden = record.hiddenSections === undefined
    ? [...template.hiddenSections]
    : legacyHidden
      ? [...new Set([...(record.hiddenSections as SiteSectionId[]), ...legacyHidden])]
      : record.hiddenSections;
  if (!validHidden(hidden)) return null;

  const draft: EditableSite = {
    ...template,
    layout: layout as SiteLayout,
    headlineSize: headlineSize as "normal" | "large",
    visualTone: visualTone as SiteVisualTone,
    density: density as SiteDensity,
    radius: radius as SiteRadius,
    sectionOrder: [...order],
    hiddenSections: [...hidden],
    variants: readVariants(record.variants, template.variants),
    services: cleanContentItems(record.services, template.services),
    benefits: cleanContentItems(record.benefits, template.benefits),
    gallery: cleanContentItems(record.gallery, template.gallery),
    process: cleanContentItems(record.process, template.process),
    faq: cleanFaqItems(record.faq, template.faq),
  };

  for (const field of TEXT_FIELDS) {
    const candidate = record[field] === undefined ? template[field] : record[field];
    if (typeof candidate !== "string" || !candidate.trim() || candidate.length > TEXT_LIMITS[field]) return null;
    (draft[field] as string) = candidate.trim();
  }

  for (const field of COLOR_FIELDS) {
    const candidate = record[field] === undefined ? template[field] : record[field];
    if (!isHex(candidate)) return null;
    draft[field] = candidate;
  }

  if (contrast(draft.background, draft.textColor) < 4.5) {
    draft.textColor = readableText(draft.background);
  }
  return draft;
}

/** Unknown AI-suggested fields are dropped. Invalid values leave the existing field unchanged. */
export function applySitePatch(current: EditableSite, value: unknown): EditableSite {
  if (!value || typeof value !== "object" || Array.isArray(value)) return current;
  const patch = value as Record<string, unknown>;
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

  for (const field of TEXT_FIELDS) {
    const candidate = patch[field];
    if (typeof candidate === "string" && candidate.trim() && candidate.length <= TEXT_LIMITS[field]) {
      (next[field] as string) = candidate.trim();
    }
  }
  for (const field of COLOR_FIELDS) {
    if (isHex(patch[field])) next[field] = patch[field] as string;
  }

  if (LAYOUTS.includes(patch.layout as SiteLayout)) next.layout = patch.layout as SiteLayout;
  if (patch.headlineSize === "normal" || patch.headlineSize === "large") next.headlineSize = patch.headlineSize;
  if (VISUAL_TONES.includes(patch.visualTone as SiteVisualTone)) next.visualTone = patch.visualTone as SiteVisualTone;
  if (DENSITIES.includes(patch.density as SiteDensity)) next.density = patch.density as SiteDensity;
  if (RADII.includes(patch.radius as SiteRadius)) next.radius = patch.radius as SiteRadius;
  if (validOrder(patch.sectionOrder)) next.sectionOrder = [...patch.sectionOrder];
  if (validHidden(patch.hiddenSections)) next.hiddenSections = [...patch.hiddenSections];

  next.variants = readVariants(patch.variants, next.variants);
  if (patch.services !== undefined) next.services = cleanContentItems(patch.services, next.services);
  if (patch.benefits !== undefined) next.benefits = cleanContentItems(patch.benefits, next.benefits);
  if (patch.gallery !== undefined) next.gallery = cleanContentItems(patch.gallery, next.gallery);
  if (patch.process !== undefined) next.process = cleanContentItems(patch.process, next.process);
  if (patch.faq !== undefined) next.faq = cleanFaqItems(patch.faq, next.faq);

  if (contrast(next.background, next.textColor) < 4.5) {
    next.textColor = readableText(next.background);
  }
  return next;
}
