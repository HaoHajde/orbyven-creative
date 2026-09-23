import {
  applySitePatch, type EditableSite, type SitePatch,
} from "@/lib/ai/site-editor";

/**
 * No model and no API calls. Small, explicit design shortcuts for Preview-only
 * fallbacks; do not label these edits as AI-generated.
 */
export function applyLocalPreviewCommand(site: EditableSite, request: string):
  {draft: EditableSite; message: string} | null {
  const prompt = request.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const patch: SitePatch = {};
  const changed: string[] = [];

  if (/\b(negru|neagra|black)\b/.test(prompt)) {
    patch.background = "#101113";
    patch.surface = "#1a1b1f";
    patch.textColor = "#f7f5f0";
    changed.push("tema închisă");
  } else if (/\b(fundal alb|tema alba|site alb|white background)\b/.test(prompt)) {
    patch.background = "#f6f5f2";
    patch.surface = "#ffffff";
    patch.textColor = "#24242a";
    changed.push("tema deschisă");
  }
  if (/\b(auriu|aurie|aurii|gold|golden)\b/.test(prompt)) {
    patch.accent = "#d4af37";
    changed.push("accent auriu");
  }
  if (/\b(editorial)\b/.test(prompt)) {
    patch.layout = "editorial";
    changed.push("layout editorial");
  } else if (/\b(centrat|centreaza|centereaza|centered)\b/.test(prompt)) {
    patch.layout = "centered";
    changed.push("layout centrat");
  } else if (/\b(impartit|split)\b/.test(prompt)) {
    patch.layout = "split";
    changed.push("layout împărțit");
  }

  // An explicit user-supplied headline is safe to apply without inventing copy.
  const explicitTitle = request.match(/(?:titlu|headline)\s*:\s*["„]?([^"\n”]{4,140})["”]?/i);
  if (explicitTitle?.[1]) {
    patch.headline = explicitTitle[1].trim();
    changed.push("titlu specificat");
  }

  if (changed.length === 0) return null;
  const next = applySitePatch(site, patch);
  if (JSON.stringify(next) === JSON.stringify(site)) {
    return {draft:site, message:"Aceste setări sunt deja aplicate. Pentru alte modificări, folosește ajustările rapide."};
  }
  return {
    draft:next,
    message:"Mod local, fără AI: am aplicat " + changed.join(", ") +
      ". Textele creative sunt disponibile după activarea AI; poți edita manual orice text în Ajustări rapide.",
  };
}
