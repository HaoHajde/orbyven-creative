import { applySitePatch, type EditableSite } from "./site-editor.ts";
import { applySectionCommand } from "./site-sections-controls.ts";

export type DesignEngineResult = {
  draft: EditableSite;
  message: string;
};

const CREATIVE_TRIGGER =
  /\b(genereaza|creeaza|propune|inventeaza|rescrie|reformuleaza|fa-l|fa l|mai premium|mai profesionist|mai profesional|brand voice|public tinta|audienta|conversion|conversie|landing completa|site complet|alta varianta|alta propunere)\b/;

/**
 * Heuristic used only to decide whether a request needs the generative server layer.
 * Business/design output is still validated by site-editor.ts.
 */
export function shouldUseGenerativeWebDesign(request: string) {
  const normalized = request
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return CREATIVE_TRIGGER.test(normalized) || normalized.length > 220;
}

/**
 * Free, deterministic design interpretation.
 * Pure client-side logic: NO API call, NO provider credentials, NO AI quota.
 * Never guesses business facts or generates marketing claims.
 */
export function applyLocalPreviewCommand(
  site: EditableSite,
  request: string
): DesignEngineResult | null {
  const prompt = request
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const sectionChange = applySectionCommand(site, request);
  if (sectionChange) return sectionChange;

  // Prefer no operation over confidently doing the opposite of a negation.
  if (/\b(nu vreau|nu pune|nu face|fara|elimina|scoate|renunta la)\b/.test(prompt)) {
    return null;
  }

  const patch: Partial<EditableSite> = {};
  const changed: string[] = [];
  const has = (pattern: RegExp) => pattern.test(prompt);

  const dark = has(/\b(negru|neagra|black|dark|intunecat[ae]?)\b/);
  const light = has(/\b(alb|alba|white|light|luminos|luminoasa)\b/);
  const isBackground = has(/\b(fundal|background|tema|tematica|site|design|stil|paleta)\b/);
  if (dark) {
    patch.background = "#101113";
    patch.surface = "#1a1b1f";
    patch.textColor = "#f7f5f0";
    changed.push("temă închisă");
  } else if (light && (isBackground || has(/\bwhite background\b/))) {
    patch.background = "#f6f5f2";
    patch.surface = "#ffffff";
    patch.textColor = "#24242a";
    changed.push("temă deschisă");
  }

  const accents: { pattern: RegExp; color: string; label: string }[] = [
    { pattern: /\b(auriu|aurie|aurii|gold|golden)\b/, color: "#d4af37", label: "auriu" },
    { pattern: /\b(mov|violet|purple)\b/, color: "#6058e8", label: "mov" },
    { pattern: /\b(albastru|albastra|blue)\b/, color: "#176cba", label: "albastru" },
    { pattern: /\b(verde|green)\b/, color: "#16805d", label: "verde" },
    { pattern: /\b(roz|pink)\b/, color: "#a44975", label: "roz" },
    { pattern: /\b(rosu|rosie|red)\b/, color: "#bf4447", label: "roșu" },
  ];
  for (const item of accents) {
    if (has(item.pattern)) {
      patch.accent = item.color;
      changed.push("accent " + item.label);
      break;
    }
  }

  const accentHex = prompt.match(/\b(?:accent|culoare accent)\s*(?:culoarea|color|este|:)?\s*(#[0-9a-f]{6})\b/i);
  if (accentHex) {
    patch.accent = accentHex[1];
    changed.push("accent personalizat");
  }
  const backgroundHex = prompt.match(/\b(?:fundal|background)\s*(?::|culoare|este)?\s*(#[0-9a-f]{6})\b/i);
  if (backgroundHex) {
    patch.background = backgroundHex[1];
    changed.push("fundal personalizat");
  }

  if (has(/\b(editorial|revista)\b/)) {
    patch.layout = "editorial";
    patch.visualTone = "editorial";
    changed.push("layout editorial");
  } else if (has(/\b(centrat|centrata|centereaza|centreaza|centered|centru)\b/)) {
    patch.layout = "centered";
    changed.push("layout centrat");
  } else if (has(/\b(impartit|split|doua coloane)\b/)) {
    patch.layout = "split";
    changed.push("layout împărțit");
  }

  if (has(/\b(luxury|lux|luxos|luxoasa|premium)\b/)) {
    patch.visualTone = "luxury";
    changed.push("ton luxury");
  } else if (has(/\b(tehnic|tehnica|industrial)\b/)) {
    patch.visualTone = "technical";
    changed.push("ton tehnic");
  } else if (has(/\b(cald|calda|warm|organic)\b/)) {
    patch.visualTone = "warm";
    changed.push("ton cald");
  } else if (has(/\b(bold|puternic|puternica|impact)\b/)) {
    patch.visualTone = "bold";
    changed.push("ton bold");
  } else if (has(/\b(minimal|minimalist|minimalista)\b/)) {
    patch.visualTone = "minimal";
    changed.push("ton minimalist");
  }

  if (has(/\b(aerisit|aerisita|airy|mult spatiu|mai mult spatiu)\b/)) {
    patch.density = "airy";
    changed.push("spațiere aerisită");
  } else if (has(/\b(compact|dens|densa)\b/)) {
    patch.density = "compact";
    changed.push("spațiere compactă");
  }

  if (has(/\b(colturi drepte|sharp|patrat|patrate)\b/)) {
    patch.radius = "sharp";
    changed.push("colțuri drepte");
  } else if (has(/\b(foarte rotunjit|rotunjite|rounded)\b/)) {
    patch.radius = "rounded";
    changed.push("colțuri rotunjite");
  }

  if (has(/\b(scris|titlu|headline|text)\s+(?:mai\s+)?(mare|marit|marita|large|big)\b/)) {
    patch.headlineSize = "large";
    changed.push("titlu mărit");
  } else if (has(/\b(titlu|headline)\s+(?:mai\s+)?(normal|mic|initial)\b/)) {
    patch.headlineSize = "normal";
    changed.push("dimensiune standard titlu");
  }

  // Explicit copy is provided verbatim by the user; no invented claims.
  const copyFields: {
    pattern: RegExp;
    field: "headline" | "description" | "cta" | "brand" | "eyebrow";
    label: string;
  }[] = [
    { pattern: /\b(?:titlu|headline)\s*:\s*["„]?([^\n"”]{3,140})["”]?/i, field: "headline", label: "titlu specificat" },
    { pattern: /\b(?:descriere|description)\s*:\s*["„]?([^\n"”]{3,420})["”]?/i, field: "description", label: "descriere specificată" },
    { pattern: /\b(?:buton|cta)\s*:\s*["„]?([^\n"”]{3,45})["”]?/i, field: "cta", label: "text buton specificat" },
    { pattern: /\b(?:brand|nume firma|numele firmei)\s*:\s*["„]?([^\n"”]{3,70})["”]?/i, field: "brand", label: "nume firmă specificat" },
    { pattern: /\b(?:eyebrow|supratitlu)\s*:\s*["„]?([^\n"”]{3,90})["”]?/i, field: "eyebrow", label: "supratitlu specificat" },
  ];
  for (const field of copyFields) {
    const match = request.match(field.pattern);
    if (match?.[1]) {
      patch[field.field] = match[1].trim();
      changed.push(field.label);
    }
  }

  if (changed.length === 0) return null;
  const next = applySitePatch(site, patch);
  if (JSON.stringify(next) === JSON.stringify(site)) {
    return {
      draft: site,
      message: "Design Engine gratuit: setările cerute sunt deja aplicate. Nu am apelat niciun model AI.",
    };
  }

  return {
    draft: next,
    message:
      "Design Engine gratuit, fără AI/API: am aplicat " +
      changed.join(", ") +
      ". Modificarea apare imediat în preview și poate fi anulată cu Undo.",
  };
}
