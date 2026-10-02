import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { requireOrbyvenSession } from "@/lib/orbyven-session";
import { readAllPages } from "@/lib/modules/paged-read";

export type OverviewLead = {
  id: string;
  name: string;
  kind: "lead" | "client";
  stage: string;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  converted_at: string | null;
  created_at: string;
};

export type OverviewTask = {
  id: string;
  title: string;
  kind: "task" | "work" | "order";
  status: string;
  priority: string;
  assignee: string | null;
  client_id: string | null;
  due_at: string | null;
  scheduled_at: string | null;
  created_at: string;
};

export type OverviewEvent = {
  id: string;
  title: string;
  status: string;
  start_at: string;
  end_at: string | null;
  assignee: string | null;
  client_id: string | null;
  task_id: string | null;
};

export type OverviewEstimate = {
  id: string;
  reference: string;
  title: string;
  status: string;
  total_cents: number;
  currency: string;
  valid_until: string | null;
  client_id: string | null;
  task_id: string | null;
  updated_at: string;
  created_at: string;
};

export type OverviewSnapshot = {
  /** Only recent records and actionable candidates, never the entire CRM/task history. */
  leads: OverviewLead[];
  tasks: OverviewTask[];
  events: OverviewEvent[];
  estimates: OverviewEstimate[];
  activeLeadsCount: number;
  openTasksCount: number;
  sentEstimatesCount: number;
  taskStages: Record<"planned" | "in_progress" | "blocked" | "done" | "cancelled", number>;
  trendDates: { leads: string[]; tasks: string[]; estimates: string[] };
  monthExpensesCents: number;
  monthIncomeCents: number;
  attentionHasMore: boolean;
  documentCount: number;
  activeTeamCount: number;
  inactiveTeamNames: string[];
};

const ATTENTION_LIMIT = 16;
const DAY_MS = 86400000;
const OPEN_TASKS = '("done","cancelled")';
const OPEN_LEADS = '("won","lost")';

/**
 * Range through result sets whose complete contents affect a financial sum or
 * a seven-day trend. Supabase/PostgREST silently caps unbounded selects at the
 * project's max rows; relying on the default would corrupt business metrics.
 */
async function countRows(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>
): Promise<number> {
  const { count, error } = await query;
  if (error) throw error;
  if (count === null) throw new Error("Overview count unavailable.");
  return count;
}

function monthRange(now: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new Error("Invalid overview timezone.");
  }
  const next = month === 12 ? [year + 1, 1] : [year, month + 1];
  const key = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}-01`;
  return [key(year, month), key(next[0], next[1])] as const;
}

function uniqueRecords<T extends { id: string }>(...groups: T[][]): T[] {
  return [...new Map(groups.flat().map((row) => [row.id, row])).values()];
}

/**
 * RLS is the database authorization boundary. Do not query finance tables
 * for roles that cannot access them (the Security Hardening II contract).
 * This read model keeps exact counts and sums, while downloading only small,
 * relevant candidate records for the Overview cards.
 */
export async function loadOverviewSnapshot(
  organizationId: string,
  canAccessFinances: boolean,
  timeZone: string,
  includeTeam = false
): Promise<OverviewSnapshot> {
  if (!organizationId.trim()) throw new Error("organization_id is required.");
  await requireOrbyvenSession();

  const now = new Date();
  const nowIso = now.toISOString();
  const trendSince = new Date(now.getTime() - 8 * DAY_MS).toISOString();
  const eventsUntil = new Date(now.getTime() + 7 * DAY_MS).toISOString();
  const nearTaskFrom = new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString();
  const nearTaskUntil = new Date(now.getTime() + 36 * 60 * 60 * 1000).toISOString();
  const staleEstimateBefore = new Date(now.getTime() - 3 * DAY_MS).toISOString();
  const reactivationBefore = new Date(now.getTime() - 90 * DAY_MS).toISOString();
  const [monthStart, nextMonthStart] = monthRange(now, timeZone);

  const [
    activeLeadsCount, openTasksCount, sentEstimatesCount,
    stageCounts,
    recentLeads, overdueLeads, staleContactClients, neverContactedClients,
    recentTasks, overdueTasks, urgentTasks,
    blockedTasks, scheduledNearTasks, dueNearTasks,
    recentEstimates, staleEstimates, leadTrend, taskTrend, estimateTrend,
    events, monthExpenseRows, monthIncomeRows, documentCount, activeTeamCount, inactiveTeamResult,
  ] = await Promise.all([
    countRows(orbyvenSupabase.from("crm_leads").select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId).eq("kind", "lead").not("stage", "in", OPEN_LEADS)),
    countRows(orbyvenSupabase.from("ops_tasks").select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId).not("status", "in", OPEN_TASKS)),
    countRows(orbyvenSupabase.from("sales_estimates").select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId).eq("status", "sent")),
    Promise.all((["planned", "in_progress", "blocked", "done", "cancelled"] as const).map((status) =>
      countRows(orbyvenSupabase.from("ops_tasks").select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId).eq("status", status))
    )),
    orbyvenSupabase.from("crm_leads")
      .select("id,name,kind,stage,last_contact_at,next_follow_up_at,converted_at,created_at")
      .eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(4),
    orbyvenSupabase.from("crm_leads")
      .select("id,name,kind,stage,last_contact_at,next_follow_up_at,converted_at,created_at")
      .eq("organization_id", organizationId)
      .not("next_follow_up_at", "is", null)
      .or("kind.eq.client,stage.not.in.(won,lost)")
      .lt("next_follow_up_at", nowIso).order("next_follow_up_at").limit(ATTENTION_LIMIT + 1),
    orbyvenSupabase.from("crm_leads")
      .select("id,name,kind,stage,last_contact_at,next_follow_up_at,converted_at,created_at")
      .eq("organization_id", organizationId)
      .eq("kind", "client")
      .is("next_follow_up_at", null)
      .not("last_contact_at", "is", null)
      .lte("last_contact_at", reactivationBefore)
      .order("last_contact_at")
      .limit(ATTENTION_LIMIT + 1),
    orbyvenSupabase.from("crm_leads")
      .select("id,name,kind,stage,last_contact_at,next_follow_up_at,converted_at,created_at")
      .eq("organization_id", organizationId)
      .eq("kind", "client")
      .is("next_follow_up_at", null)
      .is("last_contact_at", null)
      .not("converted_at", "is", null)
      .lte("converted_at", reactivationBefore)
      .order("converted_at")
      .limit(ATTENTION_LIMIT + 1),
    orbyvenSupabase.from("ops_tasks")
      .select("id,title,kind,status,priority,assignee,client_id,due_at,scheduled_at,created_at")
      .eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(4),
    orbyvenSupabase.from("ops_tasks")
      .select("id,title,kind,status,priority,assignee,client_id,due_at,scheduled_at,created_at")
      .eq("organization_id", organizationId).not("status", "in", OPEN_TASKS)
      .lt("due_at", nowIso).order("due_at").limit(ATTENTION_LIMIT + 1),
    orbyvenSupabase.from("ops_tasks")
      .select("id,title,kind,status,priority,assignee,client_id,due_at,scheduled_at,created_at")
      .eq("organization_id", organizationId).not("status", "in", OPEN_TASKS)
      .eq("priority", "urgent").order("created_at", { ascending: false }).limit(ATTENTION_LIMIT + 1),
    orbyvenSupabase.from("ops_tasks")
      .select("id,title,kind,status,priority,assignee,client_id,due_at,scheduled_at,created_at")
      .eq("organization_id", organizationId).eq("status", "blocked")
      .order("updated_at", { ascending: false }).limit(ATTENTION_LIMIT + 1),
    orbyvenSupabase.from("ops_tasks")
      .select("id,title,kind,status,priority,assignee,client_id,due_at,scheduled_at,created_at")
      .eq("organization_id", organizationId).not("status", "in", OPEN_TASKS)
      .gte("scheduled_at", nearTaskFrom).lte("scheduled_at", nearTaskUntil)
      .order("scheduled_at", { ascending: true }).limit(ATTENTION_LIMIT * 2),
    orbyvenSupabase.from("ops_tasks")
      .select("id,title,kind,status,priority,assignee,client_id,due_at,scheduled_at,created_at")
      .eq("organization_id", organizationId).not("status", "in", OPEN_TASKS)
      .gte("due_at", nearTaskFrom).lte("due_at", nearTaskUntil)
      .order("due_at", { ascending: true }).limit(ATTENTION_LIMIT * 2),
    orbyvenSupabase.from("sales_estimates")
      .select("id,reference,title,status,total_cents,currency,valid_until,client_id,task_id,updated_at,created_at")
      .eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(4),
    orbyvenSupabase.from("sales_estimates")
      .select("id,reference,title,status,total_cents,currency,valid_until,client_id,task_id,updated_at,created_at")
      .eq("organization_id", organizationId).eq("status", "sent")
      .lte("updated_at", staleEstimateBefore).order("updated_at").limit(ATTENTION_LIMIT + 1),
    readAllPages<{ created_at: string }>((from, to) =>
      orbyvenSupabase.from("crm_leads").select("created_at").eq("organization_id", organizationId)
        .eq("kind", "lead").not("stage", "in", OPEN_LEADS)
        .gte("created_at", trendSince).order("created_at").order("id").range(from, to)),
    readAllPages<{ created_at: string }>((from, to) =>
      orbyvenSupabase.from("ops_tasks").select("created_at").eq("organization_id", organizationId)
        .not("status", "in", OPEN_TASKS).gte("created_at", trendSince)
        .order("created_at").order("id").range(from, to)),
    readAllPages<{ created_at: string }>((from, to) =>
      orbyvenSupabase.from("sales_estimates").select("created_at").eq("organization_id", organizationId)
        .eq("status", "sent").gte("created_at", trendSince)
        .order("created_at").order("id").range(from, to)),
    readAllPages<OverviewEvent>((from, to) =>
      orbyvenSupabase.from("calendar_events").select("id,title,status,start_at,end_at,assignee,client_id,task_id")
        .eq("organization_id", organizationId).gte("start_at", trendSince).lte("start_at", eventsUntil)
        .order("start_at").order("id").range(from, to)),
    canAccessFinances
      ? readAllPages<{ amount_cents: number }>((from, to) =>
          orbyvenSupabase.from("finance_expenses").select("amount_cents")
            .eq("organization_id", organizationId)
            .eq("currency", "RON")
            .gte("occurred_on", monthStart).lt("occurred_on", nextMonthStart)
            .order("occurred_on").order("id").range(from, to))
      : Promise.resolve([] as { amount_cents: number }[]),
    canAccessFinances
      ? readAllPages<{ amount_cents: number }>((from, to) =>
          orbyvenSupabase.from("finance_income_entries").select("amount_cents")
            .eq("organization_id", organizationId)
            .eq("currency", "RON")
            .gte("occurred_on", monthStart).lt("occurred_on", nextMonthStart)
            .order("occurred_on").order("id").range(from, to))
      : Promise.resolve([] as { amount_cents: number }[]),
    countRows(orbyvenSupabase.from("ops_documents").select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)),
    includeTeam
      ? countRows(orbyvenSupabase.from("people_team_members").select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId).eq("status", "active"))
      : Promise.resolve(0),
    includeTeam
      ? orbyvenSupabase.from("people_team_members")
          .select("display_name,status")
          .eq("organization_id", organizationId)
          .eq("status", "inactive")
          .order("display_name")
          .limit(120)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const [planned, inProgress, blocked, done, cancelled] = stageCounts;
  for (const result of [recentLeads, overdueLeads, staleContactClients, neverContactedClients,
    recentTasks, overdueTasks, urgentTasks, blockedTasks, scheduledNearTasks, dueNearTasks,
    recentEstimates, staleEstimates, inactiveTeamResult]) {
    if (result.error) throw result.error;
  }

  return {
    leads: uniqueRecords(
      recentLeads.data ?? [],
      (overdueLeads.data ?? []).slice(0, ATTENTION_LIMIT),
      (staleContactClients.data ?? []).slice(0, ATTENTION_LIMIT),
      (neverContactedClients.data ?? []).slice(0, ATTENTION_LIMIT)
    ),
    tasks: uniqueRecords(
      recentTasks.data ?? [],
      (overdueTasks.data ?? []).slice(0, ATTENTION_LIMIT),
      (urgentTasks.data ?? []).slice(0, ATTENTION_LIMIT),
      (blockedTasks.data ?? []).slice(0, ATTENTION_LIMIT),
      scheduledNearTasks.data ?? [],
      dueNearTasks.data ?? []
    ),
    events,
    estimates: uniqueRecords(recentEstimates.data ?? [], (staleEstimates.data ?? []).slice(0, ATTENTION_LIMIT)),
    activeLeadsCount,
    openTasksCount,
    sentEstimatesCount,
    taskStages: { planned, in_progress: inProgress, blocked, done, cancelled },
    trendDates: {
      leads: leadTrend.map((row) => row.created_at),
      tasks: taskTrend.map((row) => row.created_at),
      estimates: estimateTrend.map((row) => row.created_at),
    },
    monthExpensesCents: monthExpenseRows.reduce((sum, row) => sum + Number(row.amount_cents), 0),
    monthIncomeCents: monthIncomeRows.reduce((sum, row) => sum + Number(row.amount_cents), 0),
    attentionHasMore: [overdueLeads, staleContactClients, neverContactedClients, overdueTasks, urgentTasks, blockedTasks, staleEstimates]
      .some((result) => (result.data?.length ?? 0) > ATTENTION_LIMIT),
    documentCount,
    activeTeamCount,
    inactiveTeamNames: (inactiveTeamResult.data ?? []).map((member) => member.display_name),
  };
}
