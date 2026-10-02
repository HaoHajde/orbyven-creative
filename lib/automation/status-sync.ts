import { orbyvenSupabase } from "@/lib/orbyven-supabase";

type WorkTaskStatus = "planned" | "in_progress" | "blocked" | "done" | "cancelled";

type CalendarWorkEvent = {
  id: string;
  event_type: "appointment" | "work" | "follow_up" | "internal";
  status: "scheduled" | "completed" | "cancelled";
  task_id: string | null;
  start_at: string;
  end_at: string;
};

function requireOrganizationId(organizationId: string) {
  if (!organizationId.trim()) throw new Error("organization_id is required.");
}

export async function syncTaskAfterWorkScheduled(
  organizationId: string,
  event: CalendarWorkEvent
) {
  requireOrganizationId(organizationId);
  if (event.event_type !== "work" || !event.task_id) {
    return { taskUpdated: false as const };
  }

  const { data: task, error: taskError } = await orbyvenSupabase
    .from("ops_tasks")
    .select("id,status,scheduled_at")
    .eq("organization_id", organizationId)
    .eq("id", event.task_id)
    .single();

  if (taskError || !task) {
    throw taskError ?? new Error("Lucrarea programată nu a putut fi încărcată.");
  }
  if (task.status === "cancelled" || task.status === "done" || task.scheduled_at) {
    return { taskUpdated: false as const };
  }

  const { error } = await orbyvenSupabase
    .from("ops_tasks")
    .update({ scheduled_at: event.start_at })
    .eq("organization_id", organizationId)
    .eq("id", event.task_id)
    .is("scheduled_at", null);

  if (error) throw error;
  return { taskUpdated: true as const };
}

export async function syncTaskAfterWorkEventCompleted(
  organizationId: string,
  event: CalendarWorkEvent
) {
  requireOrganizationId(organizationId);
  if (
    event.event_type !== "work" ||
    event.status !== "completed" ||
    !event.task_id
  ) {
    return { taskUpdated: false as const };
  }

  const { data: task, error: taskError } = await orbyvenSupabase
    .from("ops_tasks")
    .select("id,status")
    .eq("organization_id", organizationId)
    .eq("id", event.task_id)
    .single();

  if (taskError || !task) {
    throw taskError ?? new Error("Lucrarea programării nu a putut fi încărcată.");
  }

  if ((task.status as WorkTaskStatus) !== "planned") {
    return { taskUpdated: false as const };
  }

  const { error } = await orbyvenSupabase
    .from("ops_tasks")
    .update({ status: "in_progress" })
    .eq("organization_id", organizationId)
    .eq("id", event.task_id)
    .eq("status", "planned");

  if (error) throw error;
  return { taskUpdated: true as const };
}

export async function completeElapsedWorkEventsForTask(
  organizationId: string,
  taskId: string,
  nowIso = new Date().toISOString()
) {
  requireOrganizationId(organizationId);
  if (!taskId.trim()) throw new Error("task_id is required.");

  const { data, error } = await orbyvenSupabase
    .from("calendar_events")
    .update({ status: "completed" })
    .eq("organization_id", organizationId)
    .eq("task_id", taskId)
    .eq("event_type", "work")
    .eq("status", "scheduled")
    .lte("end_at", nowIso)
    .select("id");

  if (error) throw error;
  return { completedEvents: (data ?? []).length };
}
