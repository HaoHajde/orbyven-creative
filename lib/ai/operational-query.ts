import { createBillingServiceClient, type BillingActor } from "@/lib/billing/supabase-server";
import type { IntelligenceResponse } from "@/lib/ai/intelligence-types";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

export type OperationalQueryKind =
  | "overdue_tasks"
  | "blocked_tasks"
  | "unassigned_tasks"
  | "today"
  | "lead_followups"
  | "estimate_followups";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  assignee: string | null;
  client_id: string | null;
  scheduled_at: string | null;
  due_at: string | null;
};

type LeadRow = {
  id: string;
  name: string;
  next_follow_up_at: string | null;
};

type EstimateRow = {
  id: string;
  reference: string;
  title: string;
  valid_until: string | null;
  client_id: string | null;
  task_id: string | null;
  updated_at: string;
};

type CalendarRow = {
  id: string;
  title: string;
  start_at: string;
  client_id: string | null;
  task_id: string | null;
};

const OPEN_TASKS = new Set(["done", "cancelled"]);
const OPEN_LEADS = new Set(["won", "lost"]);
const TIME_ZONE = "Europe/Bucharest";
const DAY_MS = 86400000;

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

  if (/\b(blocat|blocate|blocata|blocate|blocaj|blocaje)\b/.test(value)) {
    return "blocked_tasks";
  }
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
    /\b(expir|expira|expira|urmar|trimis|trimise|astept|asteapta|follow.?up|valabil)\w*/.test(value)
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

function timezoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour"),
    read("minute"),
    read("second")
  ) - date.getTime();
}

function localDateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function localMidnightIso(dateKey: string, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const localUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  let instant = new Date(localUtc);
  for (let index = 0; index < 3; index += 1) {
    instant = new Date(localUtc - timezoneOffsetMs(instant, timeZone));
  }
  return instant.toISOString();
}

function nextDateKey(dateKey: string, days = 1) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days, 12));
  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function formatShortDate(value: string | null) {
  if (!value) return "fără termen";
  return new Intl.DateTimeFormat("ro-RO", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function taskActions(rows: TaskRow[]) {
  return rows.slice(0, 3).map((row) => ({
    kind: "open_module" as const,
    label: row.title,
    moduleId: "tasks" as const,
    recordId: row.id,
    clientId: row.client_id ?? undefined,
    taskId: row.id,
  }));
}

function unavailable(label: string): IntelligenceResponse {
  return {
    specialist: "operations",
    answer: `Nu pot răspunde exact la această întrebare deoarece modulul ${label} nu este activ în workspace.`,
    facts: [],
    actions: [{ kind: "open_module", label: "Vezi modulele active", moduleId: "overview" }],
    generatedBy: "orbyven_core",
  };
}

async function taskQuery(
  actor: BillingActor,
  kind: Extract<OperationalQueryKind, "overdue_tasks" | "blocked_tasks" | "unassigned_tasks">
): Promise<IntelligenceResponse> {
  const client = createBillingServiceClient(actor);
  const now = Date.now();
  const { data, error } = await client
    .from("ops_tasks")
    .select("id,title,status,priority,assignee,client_id,scheduled_at,due_at")
    .eq("organization_id", actor.organizationId)
    .order("updated_at", { ascending: false })
    .limit(120);
  if (error) throw error;

  const open = ((data ?? []) as TaskRow[]).filter((row) => !OPEN_TASKS.has(row.status));
  let rows: TaskRow[] = [];
  let answer = "";
  let label = "";

  if (kind === "blocked_tasks") {
    rows = open.filter((row) => row.status === "blocked");
    label = "Blocate";
    answer = rows.length
      ? `Am găsit ${rows.length} lucrări blocate. Le-am pus primele pe cele mai recent actualizate.`
      : "Nu există lucrări marcate ca blocate în acest moment.";
  } else if (kind === "unassigned_tasks") {
    rows = open.filter((row) => !row.assignee?.trim());
    label = "Fără responsabil";
    answer = rows.length
      ? `Am găsit ${rows.length} lucrări fără responsabil. Acestea sunt cele care riscă cel mai ușor să rămână fără ownership.`
      : "Toate lucrările deschise au un responsabil asociat.";
  } else {
    rows = open
      .filter((row) => row.due_at && new Date(row.due_at).getTime() < now)
      .sort((a, b) => new Date(a.due_at || 0).getTime() - new Date(b.due_at || 0).getTime());
    label = "Întârziate";
    answer = rows.length
      ? `Am găsit ${rows.length} lucrări cu termen depășit. Cea mai veche este „${rows[0].title}”, cu termen ${formatShortDate(rows[0].due_at)}.`
      : "Nu există lucrări deschise cu termen depășit.";
  }

  return {
    specialist: "operations",
    answer,
    facts: [
      { label, value: String(rows.length) },
      ...(rows[0]
        ? [
            { label: "Prima", value: rows[0].title.slice(0, 80) },
            { label: "Responsabil", value: rows[0].assignee?.trim() || "Nealocat" },
          ]
        : []),
    ],
    actions: taskActions(rows),
    generatedBy: "orbyven_core",
  };
}

async function todayQuery(actor: BillingActor): Promise<IntelligenceResponse> {
  const client = createBillingServiceClient(actor);
  const today = localDateKey(new Date(), TIME_ZONE);
  const tomorrow = nextDateKey(today);
  const startIso = localMidnightIso(today, TIME_ZONE);
  const endIso = localMidnightIso(tomorrow, TIME_ZONE);

  const [taskResult, calendarResult] = await Promise.all([
    client
      .from("ops_tasks")
      .select("id,title,status,priority,assignee,client_id,scheduled_at,due_at")
      .eq("organization_id", actor.organizationId)
      .gte("scheduled_at", startIso)
      .lt("scheduled_at", endIso)
      .order("scheduled_at")
      .limit(40),
    client
      .from("calendar_events")
      .select("id,title,start_at,client_id,task_id")
      .eq("organization_id", actor.organizationId)
      .neq("status", "cancelled")
      .gte("start_at", startIso)
      .lt("start_at", endIso)
      .order("start_at")
      .limit(40),
  ]);
  if (taskResult.error) throw taskResult.error;
  if (calendarResult.error) throw calendarResult.error;

  const tasks = ((taskResult.data ?? []) as TaskRow[]).filter((row) => !OPEN_TASKS.has(row.status));
  const events = (calendarResult.data ?? []) as CalendarRow[];
  const firstTask = tasks[0];
  const firstEvent = events[0];

  const actions = [
    ...taskActions(tasks).slice(0, 2),
    ...events.slice(0, Math.max(0, 3 - Math.min(tasks.length, 2))).map((row) => ({
      kind: "open_module" as const,
      label: `${formatTime(row.start_at)} · ${row.title}`,
      moduleId: "calendar" as const,
      recordId: row.id,
      clientId: row.client_id ?? undefined,
      taskId: row.task_id ?? undefined,
    })),
  ];

  const nextItem =
    firstEvent && (!firstTask || firstEvent.start_at <= (firstTask.scheduled_at || ""))
      ? `Următorul eveniment este „${firstEvent.title}” la ${formatTime(firstEvent.start_at)}.`
      : firstTask
        ? `Prima lucrare programată este „${firstTask.title}” la ${formatTime(firstTask.scheduled_at || startIso)}.`
        : "";

  return {
    specialist: "operations",
    answer:
      tasks.length || events.length
        ? `Astăzi ai ${tasks.length} lucrări programate și ${events.length} evenimente în calendar. ${nextItem}`.trim()
        : "Nu ai lucrări programate sau evenimente în calendar pentru astăzi.",
    facts: [
      { label: "Lucrări azi", value: String(tasks.length) },
      { label: "Calendar azi", value: String(events.length) },
    ],
    actions,
    generatedBy: "orbyven_core",
  };
}

async function leadFollowupQuery(actor: BillingActor): Promise<IntelligenceResponse> {
  const client = createBillingServiceClient(actor);
  const today = localDateKey(new Date(), TIME_ZONE);
  const endIso = localMidnightIso(nextDateKey(today), TIME_ZONE);
  const { data, error } = await client
    .from("crm_leads")
    .select("id,name,stage,next_follow_up_at")
    .eq("organization_id", actor.organizationId)
    .eq("kind", "lead")
    .not("next_follow_up_at", "is", null)
    .lt("next_follow_up_at", endIso)
    .order("next_follow_up_at")
    .limit(40);
  if (error) throw error;

  const rows = ((data ?? []) as Array<LeadRow & { stage: string }>)
    .filter((row) => !OPEN_LEADS.has(row.stage));
  const now = Date.now();
  const overdue = rows.filter((row) => row.next_follow_up_at && new Date(row.next_follow_up_at).getTime() < now);

  return {
    specialist: "operations",
    answer: rows.length
      ? `Ai ${rows.length} follow-up-uri de lead de făcut până la finalul zilei, dintre care ${overdue.length} sunt deja restante.`
      : "Nu ai follow-up-uri de lead scadente până la finalul zilei.",
    facts: [
      { label: "De contactat", value: String(rows.length) },
      { label: "Restante", value: String(overdue.length) },
    ],
    actions: rows.slice(0, 3).map((row) => ({
      kind: "open_module" as const,
      label: row.name,
      moduleId: "leads" as const,
      recordId: row.id,
    })),
    generatedBy: "orbyven_core",
  };
}

async function estimateFollowupQuery(actor: BillingActor): Promise<IntelligenceResponse> {
  const client = createBillingServiceClient(actor);
  const today = localDateKey(new Date(), TIME_ZONE);
  const inSevenDays = nextDateKey(today, 7);
  const { data, error } = await client
    .from("sales_estimates")
    .select("id,reference,title,status,valid_until,client_id,task_id,updated_at")
    .eq("organization_id", actor.organizationId)
    .eq("status", "sent")
    .order("updated_at", { ascending: false })
    .limit(80);
  if (error) throw error;

  const all = (data ?? []) as EstimateRow[];
  const expiring = all
    .filter((row) => row.valid_until && row.valid_until <= inSevenDays)
    .sort((a, b) => String(a.valid_until).localeCompare(String(b.valid_until)));
  const rows = expiring.length ? expiring : all;

  return {
    specialist: "operations",
    answer: all.length
      ? expiring.length
        ? `Ai ${all.length} oferte trimise fără răspuns final; ${expiring.length} expiră în următoarele 7 zile sau sunt deja expirate.`
        : `Ai ${all.length} oferte trimise fără răspuns final. Niciuna nu expiră în următoarele 7 zile.`
      : "Nu există oferte trimise care așteaptă un răspuns final.",
    facts: [
      { label: "Trimise", value: String(all.length) },
      { label: "Expiră ≤ 7 zile", value: String(expiring.length) },
    ],
    actions: rows.slice(0, 3).map((row) => ({
      kind: "open_module" as const,
      label: `${row.reference} · ${row.title}`,
      moduleId: "estimates" as const,
      recordId: row.id,
      clientId: row.client_id ?? undefined,
      taskId: row.task_id ?? undefined,
      estimateId: row.id,
    })),
    generatedBy: "orbyven_core",
  };
}

export async function answerOperationalQuery(
  actor: BillingActor,
  available: Set<OrbyvenModuleId>,
  prompt: string
): Promise<IntelligenceResponse | null> {
  const kind = detectOperationalQuery(prompt);
  if (!kind) return null;

  if (kind === "lead_followups") {
    if (!available.has("leads")) return unavailable("Lead-uri");
    return leadFollowupQuery(actor);
  }
  if (kind === "estimate_followups") {
    if (!available.has("estimates")) return unavailable("Devize");
    return estimateFollowupQuery(actor);
  }
  if (kind === "today") {
    if (!available.has("tasks") && !available.has("calendar")) {
      return unavailable("Lucrări / Calendar");
    }
    if (!available.has("tasks") || !available.has("calendar")) {
      return unavailable("Lucrări / Calendar");
    }
    return todayQuery(actor);
  }

  if (!available.has("tasks")) return unavailable("Lucrări");
  return taskQuery(actor, kind);
}
