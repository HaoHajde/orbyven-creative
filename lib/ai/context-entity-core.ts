export type ContextEntityKind = "client" | "work";

export type ContextFactMessage = {
  role: "user" | "assistant";
  facts: Array<{ label: string; value: string }>;
  createdAt: string;
};

const MAX_ENTITY_CONTEXT_AGE_MS = 30 * 60 * 1000;
const CLIENT_REF =
  /\bclient(?:ul|ului)\s+(?:acela|acesta|asta|respectiv(?:ul)?|de mai sus|anterior|precedent|despre care (?:vorbeam|am vorbit))\b/;
const WORK_REF =
  /\b(?:lucrarea|lucrarii)\s+(?:aceea|aceasta|asta|respectiv(?:a)?|de mai sus|anterioara|precedenta|despre care (?:vorbeam|am vorbit))\b/;

const IMPLICIT_FOLLOW_UP_PREFIX =
  /^(?:si|iar|dar|atunci|ok|bine|bun|acum)\b/;
const IMPLICIT_FOLLOW_UP_TOPIC =
  /\b(?:incas|plat|factur|cost|cheltu|financ|bani|ofert|deviz|programar|calendar|cand|urmator|document|fisier|atasament|istoric|activitat|contact|status|progres)\w*/;
const EXPLICIT_CLIENT = /(?:^|[,;\n]\s*)client\s*:/;
const EXPLICIT_WORK = /(?:^|[,;\n]\s*)lucrare\s*:/;

export function normalizeContextEntityText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ro-RO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function factValue(message: ContextFactMessage, label: string): string | null {
  const normalizedLabel = normalizeContextEntityText(label);
  const match = message.facts.find(
    (fact) => normalizeContextEntityText(fact.label) === normalizedLabel
  );
  return match?.value?.trim() || null;
}

function candidatesFromMessage(
  message: ContextFactMessage,
  kind: ContextEntityKind
): string[] {
  if (message.role !== "assistant") return [];

  if (kind === "client") {
    const direct = factValue(message, "Client");
    if (direct) return [direct];

    const type = normalizeContextEntityText(factValue(message, "Tip") || "");
    const name = factValue(message, "Nume");
    if (type === "client" && name) return [name];
    return [];
  }

  const direct = factValue(message, "Lucrare");
  if (direct) return [direct];

  const type = normalizeContextEntityText(factValue(message, "Tip") || "");
  const title = factValue(message, "Titlu");
  if (type === "lucrare" && title) return [title];
  return [];
}

export function findLatestContextEntityCandidate(
  messages: ContextFactMessage[],
  kind: ContextEntityKind,
  now: Date
): { value: string | null; stale: boolean } {
  const recent = messages.slice(-10);

  for (let index = recent.length - 1; index >= 0; index -= 1) {
    const message = recent[index];
    const values = [
      ...new Set(
        candidatesFromMessage(message, kind)
          .map((value) => value.trim())
          .filter(Boolean)
      ),
    ];
    if (!values.length) continue;

    const age = now.getTime() - new Date(message.createdAt).getTime();
    const stale =
      !Number.isFinite(age) ||
      age < 0 ||
      age > MAX_ENTITY_CONTEXT_AGE_MS;

    if (values.length !== 1) return { value: null, stale };
    return { value: values[0], stale };
  }

  return { value: null, stale: false };
}

export function detectContextEntityReferences(prompt: string) {
  const normalized = normalizeContextEntityText(prompt);
  return {
    client: CLIENT_REF.test(normalized) && !EXPLICIT_CLIENT.test(normalized),
    work: WORK_REF.test(normalized) && !EXPLICIT_WORK.test(normalized),
  };
}

export function detectImplicitEntityFollowUp(prompt: string) {
  const normalized = normalizeContextEntityText(prompt);
  return (
    IMPLICIT_FOLLOW_UP_PREFIX.test(normalized) &&
    IMPLICIT_FOLLOW_UP_TOPIC.test(normalized) &&
    !EXPLICIT_CLIENT.test(normalized) &&
    !EXPLICIT_WORK.test(normalized) &&
    !CLIENT_REF.test(normalized) &&
    !WORK_REF.test(normalized)
  );
}
