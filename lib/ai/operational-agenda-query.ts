import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntelligenceAction, IntelligenceResponse } from "@/lib/ai/intelligence-types";

export type AgendaQuery = { period: "today" | "tomorrow" | "seven_days"; english: boolean };

/** Only complete agenda questions: never silently discard a person, filter or second request. */
export function detectAgendaQuery(prompt: string): AgendaQuery | null {
  const value = prompt.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").replace(/[?.!]$/, "");
  const ro = /^(?:ce am(?: de facut| programat)?|(?:arata(?:-mi)?|afiseaza) agenda|agenda)(?: pentru| pe)? (azi|astazi|maine|urmatoarele 7 zile)$/;
  const en = /^(?:what (?:do i have|is scheduled)|show (?:my |the )?agenda|(?:my )?agenda)(?: for)? (today|tomorrow|(?:the )?next (?:7|seven) days)$/;
  const match = value.match(ro) ?? value.match(en);
  if (!match) return null;
  return { period: /^(azi|astazi|today)$/.test(match[1]) ? "today" : /^(maine|tomorrow)$/.test(match[1]) ? "tomorrow" : "seven_days", english: en.test(value) };
}

/** Calendar-day boundaries, including midnight DST changes; never assume a day is 24h. */
export function agendaRange(now: Date, timeZone: string, period: AgendaQuery["period"]) {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const dateKey = (instant: number) => {
    const parts = formatter.formatToParts(instant);
    return ["year", "month", "day"].map(type => parts.find(part => part.type === type)!.value).join("-");
  };
  const today = dateKey(now.getTime());
  const shift = (days: number) => new Date(Date.parse(`${today}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
  const boundary = (key: string) => {
    const nominal = Date.parse(`${key}T00:00:00Z`);
    let low = nominal - 36 * 3600000, high = nominal + 36 * 3600000;
    // First instant belonging to this local date (or the next date if it was skipped).
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (dateKey(middle) < key) low = middle + 1;
      else high = middle;
    }
    return new Date(low).toISOString();
  };
  return { start: boundary(shift(period === "tomorrow" ? 1 : 0)), end: boundary(shift(period === "tomorrow" ? 2 : period === "seven_days" ? 7 : 1)) };
}

type AgendaItem = { id: string; title: string; client_id: string | null; task_id?: string | null; scheduled_at?: string; start_at?: string };
type AgendaResult = { data: AgendaItem[] | null; count: number | null; error: unknown };

/** The authenticated caller supplies the tenant and entitled modules. This path only reads. */
export async function answerAgendaQuery(
  client: Pick<SupabaseClient, "from">,
  organizationId: string,
  available: ReadonlySet<string>,
  intent: AgendaQuery,
  now = new Date(),
): Promise<IntelligenceResponse> {
  if (!organizationId.trim()) throw new Error("Organization is required.");
  const { english, period } = intent;
  const base = { specialist: "operations", generatedBy: "orbyven_core" } as const;
  const modules = (["tasks", "calendar"] as const).filter(module => available.has(module));
  if (!modules.length) return { ...base, answer: english ? "Activate Tasks or Calendar to see your agenda." : "Activează Lucrări sau Calendar pentru a vedea agenda.", facts: [], actions: [] };
  const profile = await client.from("organization_profiles").select("timezone").eq("organization_id", organizationId).maybeSingle();
  if (profile.error) throw profile.error;
  const timeZone = profile.data?.timezone || "Europe/Bucharest";
  const { start, end } = agendaRange(now, timeZone, period);
  const results = await Promise.all(modules.map(async module => {
    let query = client.from(module === "tasks" ? "ops_tasks" : "calendar_events")
      .select(module === "tasks" ? "id,title,client_id,scheduled_at" : "id,title,client_id,task_id,start_at", { count: "exact" })
      .eq("organization_id", organizationId);
    if (module === "tasks") query = query.not("status", "in", '("done","cancelled")').gte("scheduled_at", start).lt("scheduled_at", end);
    else query = query.neq("status", "cancelled").lt("start_at", end)
      .or(`end_at.gt.${start},and(end_at.is.null,start_at.gte.${start}),and(end_at.eq.${start},start_at.eq.${start})`);
    const result: AgendaResult = await query.order(module === "tasks" ? "scheduled_at" : "start_at").order("id").limit(3);
    if (result.error) throw result.error;
    if (result.count === null || result.data === null) throw new Error("Agenda results unavailable.");
    return { module, count: result.count, rows: result.data };
  }));
  const labels = english ? { tasks: "Scheduled open tasks", calendar: "Calendar events" } : { tasks: "Lucrări deschise programate", calendar: "Evenimente în calendar" };
  const periodLabel = english ? { today: "Today", tomorrow: "Tomorrow", seven_days: "Next 7 days (including today)" }[period] : { today: "Azi", tomorrow: "Mâine", seven_days: "Următoarele 7 zile (inclusiv azi)" }[period];
  const format = new Intl.DateTimeFormat(english ? "en-GB" : "ro-RO", { timeZone, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const actions: IntelligenceAction[] = results.flatMap(({ module, rows }) => rows.map(row => ({ module, row, at: row.scheduled_at ?? row.start_at! })))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.module.localeCompare(b.module) || a.row.id.localeCompare(b.row.id))
    .slice(0, 3).map(({ module, row, at }) => ({
      kind: "open_module", label: `${format.format(new Date(at))} · ${row.title}`, moduleId: module, recordId: row.id,
      taskId: module === "tasks" ? row.id : row.task_id ?? undefined, clientId: row.client_id ?? undefined,
    }));
  return {
    ...base, answer: `${periodLabel} · ${timeZone}. ${results.map(({ module, count }) => `${labels[module]}: ${count}`).join(". ")}.`,
    facts: results.map(({ module, count }) => ({ label: labels[module], value: String(count) })), actions,
  };
}
