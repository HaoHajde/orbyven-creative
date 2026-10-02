import { createBillingServiceClient, type BillingActor } from "@/lib/billing/supabase-server";
import type { IntelligenceAction, IntelligenceResponse } from "@/lib/ai/intelligence-types";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  assignee: string | null;
  client_id: string | null;
  scheduled_at: string | null;
  due_at: string | null;
  created_at: string;
};

type LeadRow = {
  id: string;
  name: string;
  stage: string;
  next_follow_up_at: string | null;
};

type EstimateRow = {
  id: string;
  reference: string;
  title: string;
  status: string;
  valid_until: string | null;
  client_id: string | null;
  task_id: string | null;
  updated_at: string;
};

type CalendarRow = {
  id: string;
  title: string;
  status: string;
  start_at: string;
  client_id: string | null;
  task_id: string | null;
};

type FocusLevel = "urgent" | "attention" | "upcoming";

type FocusCandidate = {
  key: string;
  level: FocusLevel;
  rank: number;
  sortAt: string;
  title: string;
  meta: string;
  action: IntelligenceAction;
};

const OPEN_TASKS = new Set(["done", "cancelled"]);
const OPEN_LEADS = new Set(["won", "lost"]);
const DAY_MS = 86400000;
const TIME_ZONE = "Europe/Bucharest";

function localDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function levelOrder(level: FocusLevel) {
  return level === "urgent" ? 0 : level === "attention" ? 1 : 2;
}

function formatShort(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function taskAction(row: TaskRow, label: string): IntelligenceAction {
  return {
    kind: "open_module",
    label,
    moduleId: "tasks",
    recordId: row.id,
    clientId: row.client_id ?? undefined,
    taskId: row.id,
  };
}

function candidateActionLabel(candidate: FocusCandidate) {
  return candidate.action.kind === "open_module" ? candidate.action.label : candidate.title;
}

function rankCandidates(candidates: FocusCandidate[]) {
  const seen = new Set<string>();
  return candidates
    .sort((left, right) => {
      const byLevel = levelOrder(left.level) - levelOrder(right.level);
      if (byLevel) return byLevel;
      const byRank = left.rank - right.rank;
      if (byRank) return byRank;
      const byTime = left.sortAt.localeCompare(right.sortAt);
      if (byTime) return byTime;
      return left.key.localeCompare(right.key);
    })
    .filter((candidate) => {
      if (seen.has(candidate.key)) return false;
      seen.add(candidate.key);
      return true;
    });
}

export async function answerBusinessBriefing(
  actor: BillingActor,
  available: Set<OrbyvenModuleId>
): Promise<IntelligenceResponse> {
  const client = createBillingServiceClient(actor);
  const now = new Date();
  const nowIso = now.toISOString();
  const tomorrowIso = new Date(now.getTime() + DAY_MS).toISOString();
  const twoDaysDate = localDateKey(new Date(now.getTime() + 2 * DAY_MS));
  const staleEstimateBefore = new Date(now.getTime() - 3 * DAY_MS).toISOString();
  const staleTaskBefore = new Date(now.getTime() - DAY_MS).toISOString();

  const [tasksResult, leadsResult, estimatesResult, calendarResult] = await Promise.all([
    available.has("tasks")
      ? client
          .from("ops_tasks")
          .select("id,title,status,priority,assignee,client_id,scheduled_at,due_at,created_at")
          .eq("organization_id", actor.organizationId)
          .order("updated_at", { ascending: false })
          .limit(120)
      : Promise.resolve({ data: [], error: null }),
    available.has("leads")
      ? client
          .from("crm_leads")
          .select("id,name,stage,next_follow_up_at")
          .eq("organization_id", actor.organizationId)
          .eq("kind", "lead")
          .not("next_follow_up_at", "is", null)
          .lte("next_follow_up_at", tomorrowIso)
          .order("next_follow_up_at")
          .limit(40)
      : Promise.resolve({ data: [], error: null }),
    available.has("estimates")
      ? client
          .from("sales_estimates")
          .select("id,reference,title,status,valid_until,client_id,task_id,updated_at")
          .eq("organization_id", actor.organizationId)
          .eq("status", "sent")
          .order("updated_at", { ascending: false })
          .limit(80)
      : Promise.resolve({ data: [], error: null }),
    available.has("calendar")
      ? client
          .from("calendar_events")
          .select("id,title,status,start_at,client_id,task_id")
          .eq("organization_id", actor.organizationId)
          .neq("status", "cancelled")
          .gte("start_at", nowIso)
          .lte("start_at", tomorrowIso)
          .order("start_at")
          .limit(40)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const result of [tasksResult, leadsResult, estimatesResult, calendarResult]) {
    if (result.error) throw result.error;
  }

  const tasks = ((tasksResult.data ?? []) as TaskRow[]).filter((row) => !OPEN_TASKS.has(row.status));
  const leads = ((leadsResult.data ?? []) as LeadRow[]).filter((row) => !OPEN_LEADS.has(row.stage));
  const estimates = (estimatesResult.data ?? []) as EstimateRow[];
  const events = (calendarResult.data ?? []) as CalendarRow[];
  const candidates: FocusCandidate[] = [];

  for (const task of tasks) {
    if (task.status === "blocked") {
      candidates.push({
        key: "task:" + task.id,
        level: "urgent",
        rank: 0,
        sortAt: task.due_at ?? task.created_at,
        title: "Deblochează · " + task.title,
        meta: task.due_at && task.due_at < nowIso ? "Blocat și cu termen depășit" : "Lucrarea este oprită",
        action: taskAction(task, "Deblochează · " + task.title),
      });
      continue;
    }

    if (task.due_at && task.due_at < nowIso) {
      candidates.push({
        key: "task:" + task.id,
        level: "urgent",
        rank: 1,
        sortAt: task.due_at,
        title: "Termen depășit · " + task.title,
        meta: "Scadent " + formatShort(task.due_at),
        action: taskAction(task, "Deschide · " + task.title),
      });
      continue;
    }

    if (task.priority === "urgent" || task.priority === "high") {
      candidates.push({
        key: "task:" + task.id,
        level: task.priority === "urgent" ? "urgent" : "attention",
        rank: 2,
        sortAt: task.due_at ?? task.scheduled_at ?? task.created_at,
        title: (task.priority === "urgent" ? "Urgent · " : "Prioritate ridicată · ") + task.title,
        meta: task.assignee?.trim() ? "Responsabil: " + task.assignee.trim() : "Fără responsabil",
        action: taskAction(task, "Deschide · " + task.title),
      });
    }

    if (!task.assignee?.trim() && (task.status === "in_progress" || (task.scheduled_at && task.scheduled_at <= tomorrowIso))) {
      candidates.push({
        key: "task-owner:" + task.id,
        level: "urgent",
        rank: 3,
        sortAt: task.scheduled_at ?? task.created_at,
        title: "Fără responsabil · " + task.title,
        meta: task.status === "in_progress" ? "Este deja în lucru" : "Este programată în următoarele 24h",
        action: taskAction(task, "Alocă · " + task.title),
      });
    }

    if (!task.scheduled_at && !task.due_at && task.created_at <= staleTaskBefore) {
      candidates.push({
        key: "task-plan:" + task.id,
        level: "attention",
        rank: 7,
        sortAt: task.created_at,
        title: "Fără programare · " + task.title,
        meta: "Deschisă de peste 24h fără termen",
        action: taskAction(task, "Programează · " + task.title),
      });
    }
  }

  for (const lead of leads) {
    if (!lead.next_follow_up_at) continue;
    const overdue = lead.next_follow_up_at < nowIso;
    candidates.push({
      key: "lead:" + lead.id,
      level: overdue ? "urgent" : "attention",
      rank: 4,
      sortAt: lead.next_follow_up_at,
      title: "Follow-up lead · " + lead.name,
      meta: overdue ? "Follow-up restant" : "Scadent până mâine",
      action: {
        kind: "open_module",
        label: "Contactează · " + lead.name,
        moduleId: "leads",
        recordId: lead.id,
      },
    });
  }

  for (const estimate of estimates) {
    const expiring = Boolean(estimate.valid_until && estimate.valid_until <= twoDaysDate);
    const stale = estimate.updated_at <= staleEstimateBefore;
    if (!expiring && !stale) continue;
    candidates.push({
      key: "estimate:" + estimate.id,
      level: expiring && Boolean(estimate.valid_until && estimate.valid_until < localDateKey(now)) ? "urgent" : "attention",
      rank: 5,
      sortAt: estimate.valid_until ? estimate.valid_until + "T12:00:00.000Z" : estimate.updated_at,
      title: (expiring ? "Ofertă de urmărit · " : "Ofertă fără răspuns · ") + estimate.reference,
      meta: estimate.title,
      action: {
        kind: "open_module",
        label: "Follow-up · " + estimate.reference,
        moduleId: "estimates",
        recordId: estimate.id,
        clientId: estimate.client_id ?? undefined,
        taskId: estimate.task_id ?? undefined,
        estimateId: estimate.id,
      },
    });
  }

  for (const event of events) {
    candidates.push({
      key: "event:" + event.id,
      level: "upcoming",
      rank: 8,
      sortAt: event.start_at,
      title: "Programare · " + event.title,
      meta: formatShort(event.start_at),
      action: {
        kind: "open_module",
        label: "Calendar · " + event.title,
        moduleId: "calendar",
        recordId: event.id,
        clientId: event.client_id ?? undefined,
        taskId: event.task_id ?? undefined,
      },
    });
  }

  const ranked = rankCandidates(candidates);
  const urgent = ranked.filter((candidate) => candidate.level === "urgent");
  const attention = ranked.filter((candidate) => candidate.level === "attention");
  const upcoming = ranked.filter((candidate) => candidate.level === "upcoming");
  const top = ranked.slice(0, 3);
  const next = top[0];

  const answer = next
    ? `Ai ${urgent.length} priorități urgente și ${attention.length} care cer atenție. Începe cu „${next.title}”.`
    : upcoming.length
      ? `Nu văd blocaje sau restanțe urgente. Ai ${upcoming.length} programări în următoarele 24 de ore.`
      : "Nu văd priorități operaționale urgente în datele disponibile acum.";

  return {
    specialist: "operations",
    answer,
    facts: [
      { label: "Urgente", value: String(urgent.length) },
      { label: "Necesită atenție", value: String(attention.length) },
      { label: "Programări ≤ 24h", value: String(upcoming.length) },
      ...(next ? [{ label: "Focus #1", value: next.title.slice(0, 90) }] : []),
    ],
    actions: top.map((candidate) => ({
      ...candidate.action,
      label: candidateActionLabel(candidate),
    })),
    generatedBy: "orbyven_core",
  };
}
