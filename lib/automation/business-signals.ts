import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";

export type AutomationSignalLevel = "urgent" | "attention" | "upcoming";
export type AutomationOperationKind = "task" | "work" | "order";

export type AutomationOperation = {
  id: string;
  title: string;
  kind: AutomationOperationKind;
  status: "planned" | "in_progress" | "blocked" | "done" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  assignee: string | null;
  clientId: string | null;
  scheduledAt: string | null;
  dueAt: string | null;
  createdAt: string;
};

export type AutomationEstimate = {
  id: string;
  reference: string;
  title: string;
  status: string;
  validUntil: string | null;
  clientId: string | null;
  taskId: string | null;
  updatedAt: string;
};

export type AutomationEvent = {
  id: string;
  title: string;
  status: string;
  startAt: string;
  endAt: string | null;
  assignee: string | null;
  clientId: string | null;
  taskId: string | null;
};

export type AutomationSignal = {
  key: string;
  rule:
    | "operation_overdue"
    | "operation_due_soon"
    | "operation_unplanned"
    | "operation_blocked"
    | "operation_unassigned"
    | "operation_assignee_inactive"
    | "execution_without_accepted_estimate"
    | "accepted_estimate_needs_schedule"
    | "estimate_expiring"
    | "estimate_follow_up"
    | "appointment_upcoming"
    | "calendar_conflict";
  module: OrbyvenModuleId;
  title: string;
  meta: string;
  level: AutomationSignalLevel;
  sortAt: string;
  actionLabel: string;
  open: WorkspaceOpenOptions;
};

const DAY_MS = 86_400_000;

function operationNoun(kind: AutomationOperationKind) {
  if (kind === "order") return "Comandă";
  if (kind === "work") return "Lucrare";
  return "Task";
}

function overdueTitle(operation: AutomationOperation) {
  const noun = operationNoun(operation.kind);
  const adjective = operation.kind === "task" ? "întârziat" : "întârziată";
  return noun + " " + adjective + " · " + operation.title;
}

export function buildBusinessAutomationSignals(input: {
  operations: AutomationOperation[];
  estimates: AutomationEstimate[];
  events: AutomationEvent[];
  now: Date;
  locale: string;
  timeZone: string;
  inactiveAssigneeNames?: string[];
}): AutomationSignal[] {
  const nowIso = input.now.toISOString();
  const tomorrowIso = new Date(input.now.getTime() + DAY_MS).toISOString();
  const staleBefore = new Date(input.now.getTime() - DAY_MS).toISOString();
  const estimateFollowUpBefore = new Date(input.now.getTime() - 3 * DAY_MS).toISOString();
  const twoDaysDate = new Date(input.now.getTime() + 2 * DAY_MS).toISOString().slice(0, 10);
  const conflictHorizonIso = new Date(input.now.getTime() + 7 * DAY_MS).toISOString();
  const executionHorizonIso = conflictHorizonIso;
  const normalizeName = (value: string | null | undefined) =>
    (value || "").trim().toLocaleLowerCase("ro-RO").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const inactiveAssignees = new Set((input.inactiveAssigneeNames ?? []).map(normalizeName).filter(Boolean));
  const operations = new Map(input.operations.map((operation) => [operation.id, operation]));
  const estimateStateByTask = new Map<string, { sent: number; accepted: number }>();
  const scheduledTaskIds = new Set(
    input.events
      .filter((event) => event.status !== "cancelled" && event.taskId && event.startAt >= nowIso)
      .map((event) => event.taskId as string)
  );
  const acceptedNeedingSchedule = new Set<string>();
  const signals: AutomationSignal[] = [];

  const dateLabel = (value: string) =>
    new Intl.DateTimeFormat(input.locale, {
      day: "2-digit",
      month: "short",
      hour: value.includes("T") ? "2-digit" : undefined,
      minute: value.includes("T") ? "2-digit" : undefined,
      timeZone: input.timeZone,
    }).format(new Date(value.includes("T") ? value : value + "T12:00:00"));

  for (const estimate of input.estimates) {
    if (estimate.taskId) {
      const state = estimateStateByTask.get(estimate.taskId) ?? { sent: 0, accepted: 0 };
      if (estimate.status === "sent") state.sent += 1;
      if (estimate.status === "accepted") state.accepted += 1;
      estimateStateByTask.set(estimate.taskId, state);
    }

    if (estimate.status === "accepted" && estimate.taskId) {
      const operation = operations.get(estimate.taskId);
      if (
        operation &&
        operation.status !== "done" &&
        operation.status !== "cancelled" &&
        (operation.kind === "work" || operation.kind === "order") &&
        !operation.scheduledAt &&
        !scheduledTaskIds.has(operation.id)
      ) {
        acceptedNeedingSchedule.add(operation.id);
        signals.push({
          key: "automation:accepted:" + estimate.id,
          rule: "accepted_estimate_needs_schedule",
          module: "calendar",
          title: "Ofertă acceptată · programează " + operationNoun(operation.kind).toLocaleLowerCase("ro-RO"),
          meta: estimate.reference + " · " + operation.title,
          level: "attention",
          sortAt: estimate.updatedAt,
          actionLabel: "Programează",
          open: {
            create: true,
            taskId: operation.id,
            clientId: operation.clientId ?? estimate.clientId ?? undefined,
            estimateId: estimate.id,
          },
        });
      }
    }

    if (estimate.status === "sent" && estimate.validUntil && estimate.validUntil <= twoDaysDate) {
      const expired = estimate.validUntil < nowIso.slice(0, 10);
      signals.push({
        key: "estimate:" + estimate.id,
        rule: "estimate_expiring",
        module: "estimates",
        title: expired
          ? "Ofertă expirată · " + estimate.reference
          : "Oferta expiră curând · " + estimate.reference,
        meta: estimate.title,
        level: expired ? "urgent" : "attention",
        sortAt: estimate.validUntil + "T12:00:00.000Z",
        actionLabel: "Deschide",
        open: {
          recordId: estimate.id,
          clientId: estimate.clientId ?? undefined,
          taskId: estimate.taskId ?? undefined,
          estimateId: estimate.id,
        },
      });
    }

    if (
      estimate.status === "sent" &&
      estimate.updatedAt <= estimateFollowUpBefore &&
      (!estimate.validUntil || estimate.validUntil > twoDaysDate)
    ) {
      const ageDays = Math.max(
        3,
        Math.floor((input.now.getTime() - new Date(estimate.updatedAt).getTime()) / DAY_MS)
      );
      signals.push({
        key: "automation:estimate-follow-up:" + estimate.id,
        rule: "estimate_follow_up",
        module: "estimates",
        title: "Ofertă fără răspuns · " + estimate.reference,
        meta: estimate.title + " · trimisă de " + ageDays + " zile",
        level: "attention",
        sortAt: estimate.updatedAt,
        actionLabel: "Fă follow-up",
        open: {
          recordId: estimate.id,
          clientId: estimate.clientId ?? undefined,
          taskId: estimate.taskId ?? undefined,
          estimateId: estimate.id,
        },
      });
    }
  }

  for (const operation of input.operations) {
    if (operation.status === "done" || operation.status === "cancelled") continue;
    const noun = operationNoun(operation.kind);

    if (operation.status === "blocked") {
      signals.push({
        key: "automation:blocked:" + operation.id,
        rule: "operation_blocked",
        module: "tasks",
        title: noun + " blocat" + (operation.kind === "task" ? "" : "ă") + " · " + operation.title,
        meta: operation.dueAt && operation.dueAt < nowIso
          ? "Blocat și cu termen depășit " + dateLabel(operation.dueAt)
          : "Necesită o decizie înainte de continuare",
        level: "urgent",
        sortAt: operation.dueAt ?? operation.createdAt,
        actionLabel: "Deblochează",
        open: {
          recordId: operation.id,
          clientId: operation.clientId ?? undefined,
          taskId: operation.id,
        },
      });
      continue;
    }

    const operationalKind = operation.kind === "work" || operation.kind === "order";
    const scheduledWithinHorizon =
      Boolean(operation.scheduledAt && operation.scheduledAt >= nowIso && operation.scheduledAt <= executionHorizonIso);
    const dueWithinHorizon =
      Boolean(operation.dueAt && operation.dueAt <= executionHorizonIso);
    const executionRelevant =
      operationalKind && (operation.status === "in_progress" || scheduledWithinHorizon || dueWithinHorizon);

    if (executionRelevant && !operation.assignee?.trim()) {
      const immediate =
        operation.status === "in_progress" ||
        Boolean(operation.scheduledAt && operation.scheduledAt <= tomorrowIso) ||
        Boolean(operation.dueAt && operation.dueAt <= tomorrowIso);
      signals.push({
        key: "automation:unassigned:" + operation.id,
        rule: "operation_unassigned",
        module: "tasks",
        title: noun + " fără responsabil · " + operation.title,
        meta: operation.status === "in_progress"
          ? "Execuția este în lucru fără responsabil alocat"
          : "Execuția este apropiată, dar responsabilul nu este stabilit",
        level: immediate ? "urgent" : "attention",
        sortAt: operation.scheduledAt ?? operation.dueAt ?? operation.createdAt,
        actionLabel: "Alocă responsabil",
        open: {
          recordId: operation.id,
          clientId: operation.clientId ?? undefined,
          taskId: operation.id,
        },
      });
    } else if (
      executionRelevant &&
      operation.assignee?.trim() &&
      inactiveAssignees.has(normalizeName(operation.assignee))
    ) {
      const immediate =
        operation.status === "in_progress" ||
        Boolean(operation.scheduledAt && operation.scheduledAt <= tomorrowIso) ||
        Boolean(operation.dueAt && operation.dueAt <= tomorrowIso);
      signals.push({
        key: "automation:inactive-assignee:" + operation.id,
        rule: "operation_assignee_inactive",
        module: "tasks",
        title: "Responsabil inactiv · " + operation.title,
        meta: operation.assignee.trim() + " este marcat inactiv în Team",
        level: immediate ? "urgent" : "attention",
        sortAt: operation.scheduledAt ?? operation.dueAt ?? operation.createdAt,
        actionLabel: "Realocă",
        open: {
          recordId: operation.id,
          clientId: operation.clientId ?? undefined,
          taskId: operation.id,
        },
      });
    }

    const estimateState = estimateStateByTask.get(operation.id);
    if (
      operationalKind &&
      operation.status === "in_progress" &&
      estimateState &&
      estimateState.sent > 0 &&
      estimateState.accepted === 0
    ) {
      signals.push({
        key: "automation:commercial-risk:" + operation.id,
        rule: "execution_without_accepted_estimate",
        module: "tasks",
        title: "Execuție pornită · ofertă neacceptată",
        meta: operation.title + " · " + estimateState.sent + " ofertă/oferte încă în așteptare",
        level: "attention",
        sortAt: operation.scheduledAt ?? operation.createdAt,
        actionLabel: "Verifică dosarul",
        open: {
          recordId: operation.id,
          clientId: operation.clientId ?? undefined,
          taskId: operation.id,
        },
      });
    }

    if (operation.dueAt && operation.dueAt <= tomorrowIso) {
      const overdue = operation.dueAt < nowIso;
      signals.push({
        key: "task:" + operation.id,
        rule: overdue ? "operation_overdue" : "operation_due_soon",
        module: "tasks",
        title: overdue
          ? overdueTitle(operation)
          : "Termen apropiat · " + operation.title,
        meta:
          (overdue ? "Termen depășit " : "Scadent ") +
          dateLabel(operation.dueAt),
        level: overdue || operation.priority === "urgent" ? "urgent" : "attention",
        sortAt: operation.dueAt,
        actionLabel: "Deschide",
        open: {
          recordId: operation.id,
          clientId: operation.clientId ?? undefined,
          taskId: operation.id,
        },
      });
      continue;
    }

    if (
      (operation.kind === "work" || operation.kind === "order") &&
      !operation.scheduledAt &&
      !operation.dueAt &&
      !scheduledTaskIds.has(operation.id) &&
      operation.createdAt <= staleBefore &&
      !acceptedNeedingSchedule.has(operation.id)
    ) {
      signals.push({
        key: "automation:unplanned:" + operation.id,
        rule: "operation_unplanned",
        module: "tasks",
        title: noun + " fără termen · " + operation.title,
        meta: "Creată de peste 24h fără programare sau termen",
        level: "attention",
        sortAt: operation.createdAt,
        actionLabel: "Rezolvă",
        open: {
          recordId: operation.id,
          clientId: operation.clientId ?? undefined,
          taskId: operation.id,
        },
      });
    }
  }

  const conflictCandidates = input.events
    .filter((event) =>
      event.status !== "cancelled" &&
      event.startAt >= nowIso &&
      event.startAt <= conflictHorizonIso &&
      Boolean(event.endAt) &&
      Boolean(event.assignee?.trim())
    )
    .sort((left, right) => left.startAt.localeCompare(right.startAt));

  for (let leftIndex = 0; leftIndex < conflictCandidates.length; leftIndex += 1) {
    const left = conflictCandidates[leftIndex];
    for (let rightIndex = leftIndex + 1; rightIndex < conflictCandidates.length; rightIndex += 1) {
      const right = conflictCandidates[rightIndex];
      if (right.startAt >= (left.endAt as string)) break;
      if (left.assignee?.trim().toLocaleLowerCase("ro-RO") !== right.assignee?.trim().toLocaleLowerCase("ro-RO")) continue;
      if (!right.endAt || left.startAt >= right.endAt) continue;

      const conflictAt = right.startAt > left.startAt ? right.startAt : left.startAt;
      signals.push({
        key: "automation:calendar-conflict:" + left.id + ":" + right.id,
        rule: "calendar_conflict",
        module: "calendar",
        title: "Conflict calendar · " + left.assignee!.trim(),
        meta: left.title + " ↔ " + right.title + " · " + dateLabel(conflictAt),
        level: conflictAt <= tomorrowIso ? "urgent" : "attention",
        sortAt: conflictAt,
        actionLabel: "Rezolvă conflictul",
        open: {
          recordId: left.id,
          clientId: left.clientId ?? undefined,
          taskId: left.taskId ?? undefined,
        },
      });
    }
  }

  for (const event of input.events) {
    if (event.status === "cancelled" || event.startAt < nowIso || event.startAt > tomorrowIso) continue;
    signals.push({
      key: "event:" + event.id,
      rule: "appointment_upcoming",
      module: "calendar",
      title: "Programare · " + event.title,
      meta: dateLabel(event.startAt),
      level: "upcoming",
      sortAt: event.startAt,
      actionLabel: "Deschide",
      open: {
        recordId: event.id,
        clientId: event.clientId ?? undefined,
        taskId: event.taskId ?? undefined,
      },
    });
  }

  const rank: Record<AutomationSignalLevel, number> = {
    urgent: 0,
    attention: 1,
    upcoming: 2,
  };
  return signals.sort((left, right) => {
    const byLevel = rank[left.level] - rank[right.level];
    return byLevel || left.sortAt.localeCompare(right.sortAt);
  });
}
