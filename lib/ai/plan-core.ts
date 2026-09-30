export type PlanBindings = {
  clientName?: string;
  workTitle?: string;
  orderTitle?: string;
  lastEntity?: "client" | "work" | "order";
};

const MUTATION_START =
  "(?:creeaz[ăa]|adaug[ăa]|inregistreaz[ăa]|deschide|programeaz[ăa]|programeaz-o|pregateste|pregătește)";

export function splitPlanClauses(prompt: string) {
  const source = prompt.trim();
  if (!source) return [];

  const separator = new RegExp(
    "(?:[.;\\n]+|\\b(?:apoi|dup[ăa]\\s+aceea)\\b|\\b(?:și|si)\\b)\\s*(?=" + MUTATION_START + "\\b)",
    "gi"
  );

  return source
    .split(separator)
    .map((value) => value.trim().replace(/^[,;.\s]+|[,;.\s]+$/g, ""))
    .filter(Boolean)
    .slice(0, 8);
}

function cleanContextPhrase(value: string) {
  return value
    .replace(/\s+(?:pentru|la)\s+(?:el|ea)\b/giu, "")
    .replace(/\s+pentru\s+(?:clientul|lucrarea)\s+(?:respectiv[ăa]?|creat[ăa]?|de mai sus)\b/giu, "")
    .trim();
}

export function applyPlanBindings(clause: string, bindings: PlanBindings) {
  let next = clause.trim();
  const normalized = next
    .toLocaleLowerCase("ro-RO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const operationTitle =
    bindings.lastEntity === "order" ? bindings.orderTitle :
    bindings.lastEntity === "work" ? bindings.workTitle :
    bindings.workTitle || bindings.orderTitle;
  const operationField = bindings.lastEntity === "order" ? "comanda" : "lucrare";

  if (/^programeaza?-?o\b/.test(normalized) && operationTitle) {
    next = next.replace(/^programeaz(?:[ăa])?-?o\b/i, "Programează programare " + operationTitle);
    next = next + "; " + operationField + ": " + operationTitle;
    if (bindings.clientName) next += "; client: " + bindings.clientName;
    return next;
  }

  if (/^pregateste\s+(?:un\s+|o\s+)?deviz(?:ul)?\b/.test(normalized) && operationTitle) {
    next = next.replace(
      /^preg[ăa]te[șs]te\s+(?:un\s+|o\s+)?deviz(?:ul)?\b/i,
      "Creează deviz Deviz " + operationTitle
    );
    next = next + "; " + operationField + ": " + operationTitle;
    if (bindings.clientName) next += "; client: " + bindings.clientName;
    return next;
  }

  const pronounReference = /\b(?:pentru|la)\s+(?:el|ea)\b/i.test(next);
  const clientReference = /\bclient(?:ul|ului)\s+(?:respectiv|respectivul|creat|de mai sus)\b/i.test(next);
  const workReference = /\blucrare(?:a|ii)\s+(?:respectiva|respectivă|creata|creată|de mai sus)\b/i.test(next);
  const orderReference = /\bcomand(?:a|ei|ă)\s+(?:respectiva|respectivă|creata|creată|de mai sus)\b/i.test(next);

  if (workReference && bindings.workTitle) {
    next = cleanContextPhrase(next);
    next += "; lucrare: " + bindings.workTitle;
    if (bindings.clientName) next += "; client: " + bindings.clientName;
    return next;
  }

  if (orderReference && bindings.orderTitle) {
    next = cleanContextPhrase(next);
    next += "; comanda: " + bindings.orderTitle;
    if (bindings.clientName) next += "; client: " + bindings.clientName;
    return next;
  }

  if ((clientReference || (pronounReference && bindings.lastEntity === "client")) && bindings.clientName) {
    next = cleanContextPhrase(next);
    next += "; client: " + bindings.clientName;
    return next;
  }

  if (pronounReference && bindings.lastEntity === "work" && bindings.workTitle) {
    next = cleanContextPhrase(next);
    next += "; lucrare: " + bindings.workTitle;
    if (bindings.clientName) next += "; client: " + bindings.clientName;
  } else if (pronounReference && bindings.lastEntity === "order" && bindings.orderTitle) {
    next = cleanContextPhrase(next);
    next += "; comanda: " + bindings.orderTitle;
    if (bindings.clientName) next += "; client: " + bindings.clientName;
  }

  return next;
}

export function looksLikePlanPrompt(prompt: string) {
  return splitPlanClauses(prompt).length >= 2;
}
