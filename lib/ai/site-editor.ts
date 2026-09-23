/**
 * Typed, bounded website draft. The AI returns data, never executable code.
 * Presets are demonstrators and DO NOT change the actual pilot websites.
 */
export type SitePresetId = "studio" | "instalatii" | "detailing" | "florarie";
export type SiteLayout = "split" | "centered" | "editorial";

export type EditableSite = {
  preset: SitePresetId;
  layout: SiteLayout;
  brand: string;
  eyebrow: string;
  headline: string;
  description: string;
  cta: string;
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

export const SITE_PRESETS: Record<SitePresetId, EditableSite> = {
  studio: {
    preset: "studio", layout: "split", brand: "Atelier Studio",
    eyebrow: "BINE AI VENIT", headline: "Un site care spune povestea afacerii tale.",
    description: "Un spațiu digital elegant, construit în jurul serviciilor și clienților tăi.",
    cta: "Cere o ofertă", accent: "#6058e8",
    background: "#f6f5f2", surface: "#ffffff", textColor: "#24242a",
  },
  instalatii: {
    preset: "instalatii", layout: "split", brand: "Atelier Instalații",
    eyebrow: "INSTALAȚII ȘI CONFORT", headline: "Mai mult confort, de la proiect la ultimul detaliu.",
    description: "Soluții pentru instalații termice și sanitare. Descoperă serviciile și cere o ofertă adaptată proiectului.",
    cta: "Solicită o ofertă", accent: "#176c79",
    background: "#f4f7f7", surface: "#ffffff", textColor: "#162b31",
  },
  detailing: {
    preset: "detailing", layout: "editorial", brand: "Hao's Customs",
    eyebrow: "DETAILING PROFESIONIST", headline: "Fiecare detaliu schimbă totul.",
    description: "Îngrijire atentă pentru interiorul și exteriorul mașinii tale. Explorează lucrările și alege serviciul potrivit.",
    cta: "Vezi serviciile", accent: "#d4af37",
    background: "#101113", surface: "#1a1b1f", textColor: "#f7f5f0",
  },
  florarie: {
    preset: "florarie", layout: "centered", brand: "Maison Fleur",
    eyebrow: "FLORI PENTRU MOMENTELE TALE", headline: "Un gest mic. O emoție care rămâne.",
    description: "Buchete și aranjamente florale pregătite cu atenție pentru fiecare ocazie.",
    cta: "Descoperă buchetele", accent: "#a44975",
    background: "#fff8f9", surface: "#ffffff", textColor: "#34232e",
  },
};

export const DEFAULT_SITE: EditableSite = SITE_PRESETS.studio;

const TEXT_LIMITS = {
  brand: 70, eyebrow: 90, headline: 140, description: 420, cta: 45,
} as const;
const TEXT_FIELDS = ["brand", "eyebrow", "headline", "description", "cta"] as const;
const COLOR_FIELDS = ["accent", "background", "surface", "textColor"] as const;
const PRESET_IDS = Object.keys(SITE_PRESETS) as SitePresetId[];
const LAYOUTS: SiteLayout[] = ["split", "centered", "editorial"];

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

/** Accept existing local drafts from the previous Alpha without losing text. */
export function readSiteDraft(value: unknown): EditableSite | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const preset = record.preset === undefined ? "studio" : record.preset;
  const layout = record.layout === undefined ? "split" : record.layout;
  if (!PRESET_IDS.includes(preset as SitePresetId) || !LAYOUTS.includes(layout as SiteLayout)) return null;
  const draft: EditableSite = { ...SITE_PRESETS[preset as SitePresetId], layout: layout as SiteLayout };
  for (const field of TEXT_FIELDS) {
    const text = record[field];
    if (typeof text !== "string" || !text.trim() || text.length > TEXT_LIMITS[field]) return null;
    draft[field] = text.trim();
  }
  for (const field of COLOR_FIELDS) {
    if (!isHex(record[field])) return null;
    draft[field] = record[field];
  }
  if (contrast(draft.background, draft.textColor) < 4.5) {
    draft.textColor = readableText(draft.background);
  }
  return draft;
}

/** Unknown AI-suggested fields are dropped. Invalid values leave the draft unchanged. */
export function applySitePatch(current: EditableSite, value: unknown): EditableSite {
  if (!value || typeof value !== "object" || Array.isArray(value)) return current;
  const patch = value as Record<string, unknown>;
  const next = { ...current };
  for (const field of TEXT_FIELDS) {
    const text = patch[field];
    if (typeof text === "string" && text.trim() && text.length <= TEXT_LIMITS[field]) next[field] = text.trim();
  }
  for (const field of COLOR_FIELDS) {
    if (isHex(patch[field])) next[field] = patch[field];
  }
  if (LAYOUTS.includes(patch.layout as SiteLayout)) next.layout = patch.layout as SiteLayout;
  if (contrast(next.background, next.textColor) < 4.5) next.textColor = readableText(next.background);
  return next;
}
