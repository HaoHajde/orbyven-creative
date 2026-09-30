export type LanguagePolicyResponse = {
  specialist: string;
  actions: Array<{ kind: string }>;
};

const LANGUAGE_TRIGGER =
  /\b(explica|analiz\w*|rezum\w*|priorit\w*|recomand\w*|de ce|cum ar trebui|ce inseamna|ajuta-ma|interpreteaz\w*|pe scurt)\b/;

const MUTATION_VERB =
  /\b(creeaza|adauga|inregistreaza|programeaza)\b/;

function normalizePrompt(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function shouldUseLanguageLayer(
  prompt: string,
  response: LanguagePolicyResponse
) {
  const normalized = normalizePrompt(prompt);
  if (MUTATION_VERB.test(normalized)) return false;
  if (response.specialist === "web_design") return false;
  if (response.actions.some((action) =>
    action.kind === "confirm_proposal" || action.kind === "review_plan"
  )) return false;
  return response.specialist === "general" || LANGUAGE_TRIGGER.test(normalized);
}

function normalizedNumbers(value: string) {
  const tokens = value.match(/\d[\d.,]*/g) ?? [];
  return new Set(tokens.map((token) => {
    const digits = token.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    return digits || "0";
  }));
}

export function languageOutputPreservesNumbers(
  output: string,
  canonicalInput: string
) {
  const allowed = normalizedNumbers(canonicalInput);
  for (const token of normalizedNumbers(output)) {
    if (!allowed.has(token)) return false;
  }
  return true;
}

const EXECUTION_CLAIM =
  /\b(am|ai|a|au|este|sunt|a fost|au fost)\s+(creat\w*|modificat\w*|trimis\w*|platit\w*|plătit\w*|sters\w*|șters\w*|programat\w*|inregistrat\w*|înregistrat\w*)\b/i;

export function languageOutputPreservesExecutionClaims(
  output: string,
  canonicalInput: string
) {
  return !EXECUTION_CLAIM.test(output) || EXECUTION_CLAIM.test(canonicalInput);
}
