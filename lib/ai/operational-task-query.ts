import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntelligenceResponse } from "@/lib/ai/intelligence-types";

// Selectively ported from PR #346. This path can only read and navigate.
export type TaskQueryKind = "overdue" | "blocked" | "unassigned" | "urgent" | "unscheduled";
export type TaskQuery = { kind: TaskQueryKind; english: boolean };

export function detectTaskQuery(prompt: string): TaskQuery | null {
  const value = prompt.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
  if (!value || value.length > 1200) return null;
  if (!/^(ce |care |arata|afiseaza|lista |show |list |which |what |do i have )/.test(value)) return null;
  if (!/\b(lucrari|lucrarile|lucrarilor|taskuri|taskurile|sarcini|sarcinile|comenzi|comenzile|tasks|jobs|work|orders)\b/.test(value)) return null;
  // Named entities, dates, negation and compound requests need their own resolver.
  // Do not silently answer an organization-wide query for a narrower question.
  if (/\b(pentru|client|clientul|clientului|for|assigned to|by|azi|astazi|maine|today|tomorrow|saptamana|week|nu|not|except|fara cele|create|delete|update|creeaza|sterge|modifica|finalizeaza)\b|["“”«»;]|\d/.test(value)) return null;
  const kinds: TaskQueryKind[] = [];
  if (/\b(intarziate|intarziat|restante|termen depasit|overdue|past due)\b/.test(value)) kinds.push("overdue");
  if (/\b(blocate|blocat|blocked)\b/.test(value)) kinds.push("blocked");
  if (/\b(fara responsabil|nealocate|neasignate|unassigned|without an? assignee|without owner)\b/.test(value)) kinds.push("unassigned");
  if (/\b(urgente|urgenta|urgent|high priority|prioritate ridicata|prioritate mare)\b/.test(value)) kinds.push("urgent");
  if (/\b(neprogramate|fara programare|unscheduled|not scheduled)\b/.test(value)) kinds.push("unscheduled");
  if (kinds.length !== 1) return null;
  return { kind: kinds[0], english: /^(show|list|which|what|do i have)\b/.test(value) };
}

const LABELS: Record<TaskQueryKind, [string, string]> = {
  overdue: ["Cu termen depășit", "Overdue"],
  blocked: ["Blocate", "Blocked"],
  unassigned: ["Fără responsabil", "Unassigned"],
  urgent: ["Prioritate urgentă sau ridicată", "Urgent or high priority"],
  unscheduled: ["Neprogramate", "Unscheduled"],
};

/** Client is supplied by the existing authenticated server boundary; never from user input. */
export async function answerTaskQuery(
  client: Pick<SupabaseClient, "from">,
  organizationId: string,
  available: ReadonlySet<string>,
  intent: TaskQuery,
  now = new Date(),
): Promise<IntelligenceResponse> {
  if (!organizationId.trim()) throw new Error("Organization is required.");
  const { kind, english } = intent;
  const label = LABELS[kind][english ? 1 : 0];
  if (!available.has("tasks")) return {
    specialist: "operations", generatedBy: "orbyven_core",
    answer: english ? "The Tasks module is not active in this workspace." : "Modulul Lucrări nu este activ în acest workspace.",
    facts: [], actions: [],
  };

  let query = client.from("ops_tasks")
    .select("id,title,client_id,due_at,assignee", { count: "exact" })
    .eq("organization_id", organizationId)
    .not("status", "in", '("done","cancelled")');
  if (kind === "overdue") query = query.lt("due_at", now.toISOString());
  if (kind === "blocked") query = query.eq("status", "blocked");
  // All canonical writers trim assignee and persist an empty value as NULL.
  if (kind === "unassigned") query = query.or('assignee.is.null,assignee.eq.""');
  if (kind === "urgent") query = query.in("priority", ["urgent", "high"]);
  if (kind === "unscheduled") query = query.is("scheduled_at", null);
  // Filter and count in PostgreSQL BEFORE limiting the three navigation shortcuts.
  const { data, error, count } = await query
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true }).limit(3);
  if (error) throw error;
  if (count === null || data === null) throw new Error("Task query results unavailable.");
  return {
    specialist: "operations", generatedBy: "orbyven_core",
    answer: count === 0
      ? (english ? `No open tasks match “${label}”.` : `Nu există lucrări deschise în categoria „${label}”.`)
      : (english ? `${label}: ${count} open tasks. Open a task below.` : `${label}: ${count} lucrări deschise. Deschide o lucrare de mai jos.`),
    facts: [{ label, value: String(count) }],
    actions: data.map(row => ({ kind: "open_module", label: row.title, moduleId: "tasks", recordId: row.id, taskId: row.id, clientId: row.client_id ?? undefined })),
  };
}
