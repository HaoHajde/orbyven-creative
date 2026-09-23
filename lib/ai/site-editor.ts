export type EditableSite = {
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

export const DEFAULT_SITE: EditableSite = {
  brand: "Atelier Studio",
  eyebrow: "BINE AI VENIT",
  headline: "Un site care spune povestea afacerii tale.",
  description: "Un spațiu digital elegant, construit în jurul serviciilor și clienților tăi.",
  cta: "Cere o ofertă",
  accent: "#6058e8",
  background: "#f6f5f2",
  surface: "#ffffff",
  textColor: "#24242a",
};

const TEXT_LIMITS = {
  brand: 70,
  eyebrow: 90,
  headline: 140,
  description: 420,
  cta: 45,
} as const;

const TEXT_FIELDS = ["brand", "eyebrow", "headline", "description", "cta"] as const;
const COLOR_FIELDS = ["accent", "background", "surface", "textColor"] as const;

function validHex(value: unknown): value is string {
  return typeof value === "string" && /^#[a-fA-F0-9]{6}$/.test(value);
}

export function readSiteDraft(value: unknown): EditableSite | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const draft = { ...DEFAULT_SITE };
  for (const field of TEXT_FIELDS) {
    const current = record[field];
    if (typeof current !== "string" || !current.trim() ||
        current.length > TEXT_LIMITS[field]) return null;
    draft[field] = current.trim();
  }
  for (const field of COLOR_FIELDS) {
    if (!validHex(record[field])) return null;
    draft[field] = record[field];
  }
  return draft;
}

export function applySitePatch(current: EditableSite, value: unknown): EditableSite {
  if (!value || typeof value !== "object" || Array.isArray(value)) return current;
  const patch = value as Record<string, unknown>;
  const next = { ...current };
  for (const field of TEXT_FIELDS) {
    const text = patch[field];
    if (typeof text === "string" && text.trim() &&
        text.length <= TEXT_LIMITS[field]) next[field] = text.trim();
  }
  for (const field of COLOR_FIELDS) {
    if (validHex(patch[field])) next[field] = patch[field];
  }
  return next;
}
