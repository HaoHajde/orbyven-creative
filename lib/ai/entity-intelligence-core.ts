export type EntityIntelligenceQuery =
  | { kind: "client"; value: string }
  | { kind: "work"; value: string };

const QUERY_HINT =
  /\b(arata|arată|cauta|caută|gaseste|găsește|detalii|rezumat|situatia|situația|statusul|status|ce stii|ce știi|ce se intampla|ce se întâmplă|ce am facut|ce am făcut|istoric|despre|cum stam|cum stăm)\b/i;

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ro-RO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function cleanEntityValue(value: string | undefined) {
  const clean = value
    ?.trim()
    .replace(/^["„”'\s]+|["„”'\s?!.]+$/g, "")
    .replace(/\s+/g, " ");
  if (!clean || clean.length < 2 || clean.length > 160) return null;
  return clean;
}

function explicitField(prompt: string, label: "client" | "lucrare") {
  const pattern = new RegExp(
    "(?:^|[;\\n]\\s*)" + label + "\\s*:\\s*([^;\\n]+)",
    "i"
  );
  return cleanEntityValue(prompt.match(pattern)?.[1]);
}

export function detectEntityIntelligenceQuery(
  prompt: string
): EntityIntelligenceQuery | null {
  const cleanPrompt = prompt.trim();
  const normalizedPrompt = normalize(cleanPrompt);
  if (!cleanPrompt || cleanPrompt.length > 2400 || !QUERY_HINT.test(normalizedPrompt)) return null;

  const explicitWork = explicitField(cleanPrompt, "lucrare");
  if (explicitWork) return { kind: "work", value: explicitWork };

  const explicitClient = explicitField(cleanPrompt, "client");
  if (explicitClient) return { kind: "client", value: explicitClient };

  const workMatch = cleanPrompt.match(
    /(?:lucrarea|lucrare)\s+["„”']?([^,;\n?]+?)["„”']?(?=\s*(?:\?|$|;))/i
  );
  const work = cleanEntityValue(workMatch?.[1]);
  if (work && !/^(aceea|aceasta|asta|de mai sus|anterioara|precedenta)$/i.test(normalize(work))) {
    return { kind: "work", value: work };
  }

  const clientMatch = cleanPrompt.match(
    /(?:clientul|client)\s+["„”']?([^,;\n?]+?)["„”']?(?=\s*(?:\?|$|;))/i
  );
  const client = cleanEntityValue(clientMatch?.[1]);
  if (client && !/^(acela|acesta|asta|de mai sus|anterior|precedent)$/i.test(normalize(client))) {
    return { kind: "client", value: client };
  }

  return null;
}
