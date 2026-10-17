import { detectAgendaQuery } from "./operational-agenda-query.ts";
import { detectTaskQuery } from "./operational-task-query.ts";
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
  | "estimate_followups";

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

const QUESTION = /(?:^|\b)(ce|care|cate|cati|cine|arata|spune|lista|listeaza|vezi|am|exista)\b/;
const MUTATION = /\b(marcheaza|seteaza|schimba|muta|actualizeaza|creeaza|adauga|sterge|asigneaza|programeaza|trimite|accepta|respinge|anuleaza)\w*/;

export function detectOperationalQuery(prompt: string): OperationalQueryKind | null {
  const value = normalize(prompt);
  if (!value || value.length > 1200 || MUTATION.test(value)) return null;

  const task = detectTaskQuery(prompt);
  if (task) return `${task.kind}_tasks` as OperationalQueryKind;
  const agenda = detectAgendaQuery(prompt);
  if (agenda) return agenda.period === "seven_days" ? "week" : agenda.period;
  if (
    /\b(follow.?up|contactez|contactat|sunat|lead|leaduri|clienti de contactat)\b/.test(value) &&
    /\b(azi|astazi|restant|restante|trebuie|cine|care|ce|de facut|urgent)\b/.test(value)
  ) {
    return "lead_followups";
  }
  if (
    QUESTION.test(value) &&
    /\b(ofert|oferte|deviz|devize)\w*/.test(value) &&
    /\b(expir|expira|urmar|trimis|trimise|astept|asteapta|follow.?up|valabil)\w*/.test(value)
  ) {
    return "estimate_followups";
  }
  return null;
}
