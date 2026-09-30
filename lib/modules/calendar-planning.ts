export type CalendarPlanningEvent = {
  id: string;
  title: string;
  status: "scheduled" | "completed" | "cancelled";
  start_at: string;
  end_at: string;
  assignee: string | null;
  task_id: string | null;
};

export type CalendarConflictReason = "assignee" | "task" | "both";

export type CalendarConflict = {
  event: CalendarPlanningEvent;
  reason: CalendarConflictReason;
};

export type CalendarConflictInput = {
  startAt: string;
  endAt: string;
  assignee?: string | null;
  taskId?: string | null;
  excludeEventId?: string | null;
};

export type CalendarAvailabilityInput = {
  dayStartAt: string;
  dayEndAt: string;
  durationMinutes: number;
  assignee?: string | null;
  taskId?: string | null;
  stepMinutes?: number;
  limit?: number;
};

export type CalendarAvailabilitySlot = {
  startAt: string;
  endAt: string;
};

function timestamp(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("Interval de calendar invalid.");
  return parsed;
}

function normalizedAssignee(value?: string | null) {
  return value?.trim().toLocaleLowerCase("ro-RO") || "";
}

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB;
}

export function findCalendarConflicts(
  events: readonly CalendarPlanningEvent[],
  input: CalendarConflictInput
): CalendarConflict[] {
  const start = timestamp(input.startAt);
  const end = timestamp(input.endAt);
  if (end <= start) throw new Error("Sfârșitul programării trebuie să fie după început.");

  const assignee = normalizedAssignee(input.assignee);
  const taskId = input.taskId?.trim() || "";

  if (!assignee && !taskId) return [];

  return events
    .filter((event) => {
      if (event.id === input.excludeEventId || event.status !== "scheduled") return false;
      return overlaps(start, end, timestamp(event.start_at), timestamp(event.end_at));
    })
    .flatMap((event) => {
      const sameAssignee = Boolean(
        assignee && normalizedAssignee(event.assignee) === assignee
      );
      const sameTask = Boolean(taskId && event.task_id === taskId);
      if (!sameAssignee && !sameTask) return [];

      return [{
        event,
        reason: sameAssignee && sameTask
          ? "both"
          : sameAssignee
            ? "assignee"
            : "task",
      } satisfies CalendarConflict];
    })
    .sort((left, right) => left.event.start_at.localeCompare(right.event.start_at));
}

export function buildAvailabilitySuggestions(
  events: readonly CalendarPlanningEvent[],
  input: CalendarAvailabilityInput
): CalendarAvailabilitySlot[] {
  const dayStart = timestamp(input.dayStartAt);
  const dayEnd = timestamp(input.dayEndAt);
  const durationMinutes = Math.max(1, Math.round(input.durationMinutes));
  const stepMinutes = Math.max(5, Math.round(input.stepMinutes ?? 30));
  const limit = Math.max(1, Math.round(input.limit ?? 3));

  if (dayEnd <= dayStart) throw new Error("Intervalul zilei este invalid.");
  if (!normalizedAssignee(input.assignee) && !input.taskId?.trim()) return [];

  const durationMs = durationMinutes * 60_000;
  const stepMs = stepMinutes * 60_000;
  const result: CalendarAvailabilitySlot[] = [];

  for (
    let candidateStart = dayStart;
    candidateStart + durationMs <= dayEnd && result.length < limit;
    candidateStart += stepMs
  ) {
    const candidateEnd = candidateStart + durationMs;
    const startAt = new Date(candidateStart).toISOString();
    const endAt = new Date(candidateEnd).toISOString();
    if (!findCalendarConflicts(events, {
      startAt,
      endAt,
      assignee: input.assignee,
      taskId: input.taskId,
    }).length) {
      result.push({ startAt, endAt });
    }
  }

  return result;
}
