export type OperationalQueryKind =
  | "overdue_tasks"
  | "blocked_tasks"
  | "unassigned_tasks"
  | "today"
  | "lead_followups"
  | "estimate_followups";

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function detectOperationalQuery(prompt: string): OperationalQueryKind | null {
  const value = normalize(prompt);
  if (!value || value.length > 1200) return null;

  if (/\b(blocat|blocate|blocata|blocaj|blocaje)\b/.test(value)) return "blocked_tasks";
  if (/\b(fara responsabil|fara asignare|nealocat|nealocate|neasignat|neasignate|neatribuit|neatribuite)\b/.test(value)) {
    return "unassigned_tasks";
  }
  if (
    /\b(intarziat|intarziate|restant|restante|depasit|depasite|termen depasit|scadent)\b/.test(value) &&
    /\b(lucrar|task|sarcin|comand|operational|ce|care)\w*/.test(value)
  ) {
    return "overdue_tasks";
  }
  if (
    /\b(follow.?up|contactez|contactat|sunat|lead|leaduri|clienti de contactat)\b/.test(value) &&
    /\b(azi|astazi|restant|restante|trebuie|cine|care|de facut|urgent)\b/.test(value)
  ) {
    return "lead_followups";
  }
  if (
    /\b(ofert|oferte|deviz|devize)\w*/.test(value) &&
    /\b(expir|expira|urmar|trimis|trimise|astept|asteapta|follow.?up|valabil)\w*/.test(value)
  ) {
    return "estimate_followups";
  }
  if (
    /\b(azi|astazi)\b/.test(value) &&
    /\b(ce am|programar|calendar|lucrar|task|sarcin|agenda|de facut|fac azi)\w*/.test(value)
  ) {
    return "today";
  }
  return null;
}
