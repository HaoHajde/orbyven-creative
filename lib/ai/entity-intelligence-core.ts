export type EntityIntelligenceQuery =
  | { kind: "client"; value: string }
  | { kind: "work"; value: string };

export type EntityQuestionScope =
  | "overview"
  | "estimates"
  | "calendar"
  | "documents"
  | "history";

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

const READ_HINT = /\b(ce|care|cate|cati|arata|spune|lista|listeaza|detalii|rezumat|situatia|status|despre|istoric|ofert|deviz|document|fisier|programar|calendar|cand|urmator)\w*/;
const MUTATION = /\b(marcheaza|seteaza|schimba|muta|actualizeaza|creeaza|adauga|sterge|asigneaza|programeaza|trimite|accepta|respinge|anuleaza)\w*/;

function cleanEntityValue(value: string | undefined) {
  const clean = value
    ?.trim()
    .replace(/^["„”'\s]+|["„”'\s?!.]+$/g, "")
    .replace(/\s+/g, " ");
  if (!clean || clean.length < 2 || clean.length > 160) return null;
  return clean;
}

function explicitField(prompt: string, label: "client" | "lucrare") {
  const pattern = new RegExp(`(?:^|[;\\n]\\s*)${label}\\s*:\\s*([^;\\n]+)`, "i");
  return cleanEntityValue(prompt.match(pattern)?.[1]);
}

export function detectEntityIntelligenceQuery(prompt: string): EntityIntelligenceQuery | null {
  const clean = prompt.trim();
  const normalized = normalize(clean);
  if (!clean || clean.length > 2400 || MUTATION.test(normalized) || !READ_HINT.test(normalized)) return null;

  const explicitWork = explicitField(clean, "lucrare");
  if (explicitWork) return { kind: "work", value: explicitWork };

  const explicitClient = explicitField(clean, "client");
  if (explicitClient) return { kind: "client", value: explicitClient };

  const work = cleanEntityValue(
    clean.match(/(?:lucrarea|lucrare)\s+["„”']?([^,;\n?]+?)["„”']?(?=\s*(?:\?|$|;))/i)?.[1],
  );
  if (work && !/^(aceea|aceasta|asta|de mai sus|anterioara|precedenta)$/i.test(normalize(work))) {
    return { kind: "work", value: work };
  }

  const client = cleanEntityValue(
    clean.match(/(?:clientul|client)\s+["„”']?([^,;\n?]+?)["„”']?(?=\s*(?:\?|$|;))/i)?.[1],
  );
  if (client && !/^(acela|acesta|asta|de mai sus|anterior|precedent)$/i.test(normalize(client))) {
    return { kind: "client", value: client };
  }

  return null;
}

export function detectEntityQuestionScope(prompt: string): EntityQuestionScope {
  const value = normalize(prompt);
  if (/\b(ofert|deviz)\w*/.test(value)) return "estimates";
  if (/\b(programar|calendar|cand|urmator|intalnir|vizit)\w*/.test(value)) return "calendar";
  if (/\b(document|fisier|atasament)\w*/.test(value)) return "documents";
  if (/\b(istoric|activitat|contactat|contact)\w*/.test(value)) return "history";
  return "overview";
}
