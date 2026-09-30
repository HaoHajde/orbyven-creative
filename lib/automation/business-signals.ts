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
  clientId: string | null;
  taskId: string | null;
};

export type AutomationSignal = {
  key: string;
  rule:
    | "operation_overdue"
    | "operation_due_soon"
    | "operation_unplanned"
    | "accepted_estimate_needs_schedule"
    | "estimate_expiring"
    | "appointment_upcoming";
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
}): AutomationSignal[] {
  const nowIso = input.now.toISOString();
  const tomorrowIso = new Date(input.now.getTime() + DAY_MS).toISOString();
  const staleBefore = new Date(input.now.getTime() - DAY_MS).toISOString();
  const twoDaysDate = new Date(input.now.getTime() + 2 * DAY_MS).toISOString().slice(0, 10);
  const operations = new Map(input.operations.map((operation) => [operation.id, operation]));
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
  }

  for (const operation of input.operations) {
    if (operation.status === "done" || operation.status === "cancelled") continue;
    const noun = operationNoun(operation.kind);

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
