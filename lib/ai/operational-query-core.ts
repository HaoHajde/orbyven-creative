export type OperationalQueryKind =
  | "overdue_tasks"
  | "blocked_tasks"
  | "unassigned_tasks"
  | "urgent_tasks"
  | "unscheduled_tasks"
  | "today"
  | "tomorrow"
  | "week"
  | "lead_followups"
  | "estimate_followups"
  | "briefing";

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

  if (/\b(briefing\w*|focus|prioritatile mele|prioritatile de azi|cu ce incep|ce rezolv prima data|ce trebuie sa rezolv acum|ce e cel mai important acum)\b/.test(value)) return "briefing";

  if (/\b(blocat|blocate|blocata|blocaj|blocaje)\b/.test(value)) return "blocked_tasks";
  if (/\b(fara responsabil|fara asignare|nealocat|nealocate|neasignat|neasignate|neatribuit|neatribuite)\b/.test(value)) {
    return "unassigned_tasks";
  }
  if (
    /\b(urgent|urgente|prioritate mare|prioritate ridicata|high priority)\b/.test(value) &&
    /\b(lucrar|task|sarcin|comand)\w*/.test(value)
  ) {
    return "urgent_tasks";
  }
  if (
    /\b(neprogramat|neprogramate|fara programare|fara data|de programat)\b/.test(value) &&
    /\b(lucrar|task|sarcin|comand)\w*/.test(value)
  ) {
    return "unscheduled_tasks";
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
    /\b(maine)\b/.test(value) &&
    /\b(ce am|programar|calendar|lucrar|task|sarcin|agenda|de facut|fac)\w*/.test(value)
  ) {
    return "tomorrow";
  }
  if (
    /\b(saptamana asta|saptamana urmatoare|urmatoarele 7 zile|7 zile)\b/.test(value) &&
    /\b(ce am|programar|calendar|lucrar|task|sarcin|agenda|de facut|urmeaza)\w*/.test(value)
  ) {
    return "week";
  }
  if (
    /\b(azi|astazi)\b/.test(value) &&
    /\b(ce am|programar|calendar|lucrar|task|sarcin|agenda|de facut|fac azi)\w*/.test(value)
  ) {
    return "today";
  }
  return null;
}
