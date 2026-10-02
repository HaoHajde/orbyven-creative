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

export async function syncTaskCalendarSchedule(
  organizationId: string,
  taskId: string
) {
  requireOrganizationId(organizationId);
  if (!taskId.trim()) throw new Error("task_id is required.");

  const [{ data: task, error: taskError }, { data: nextEvent, error: eventError }] =
    await Promise.all([
      orbyvenSupabase
        .from("ops_tasks")
        .select("id,status,scheduled_at")
        .eq("organization_id", organizationId)
        .eq("id", taskId)
        .single(),
      orbyvenSupabase
        .from("calendar_events")
        .select("id,start_at")
        .eq("organization_id", organizationId)
        .eq("task_id", taskId)
        .eq("event_type", "work")
        .eq("status", "scheduled")
        .order("start_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  if (taskError || !task) {
    throw taskError ?? new Error("Lucrarea programată nu a putut fi încărcată.");
  }
  if (eventError) throw eventError;
  if (task.status === "cancelled" || task.status === "done") {
    return {
      taskUpdated: false as const,
      nextScheduledAt: nextEvent?.start_at ?? null,
    };
  }

  const nextScheduledAt = nextEvent?.start_at ?? null;
  if ((task.scheduled_at ?? null) === nextScheduledAt) {
    return { taskUpdated: false as const, nextScheduledAt };
  }

  const { error } = await orbyvenSupabase
    .from("ops_tasks")
    .update({ scheduled_at: nextScheduledAt })
    .eq("organization_id", organizationId)
    .eq("id", taskId);

  if (error) throw error;
  return { taskUpdated: true as const, nextScheduledAt };
}

export async function syncTaskAfterWorkScheduled(
  organizationId: string,
  event: CalendarWorkEvent
) {
  requireOrganizationId(organizationId);
  if (event.event_type !== "work" || !event.task_id) {
    return { taskUpdated: false as const, nextScheduledAt: null };
  }
  return syncTaskCalendarSchedule(organizationId, event.task_id);
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
    return {
      taskUpdated: false as const,
      scheduleUpdated: false as const,
      nextScheduledAt: null,
    };
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

  let taskUpdated = false;
  if ((task.status as WorkTaskStatus) === "planned") {
    const { error } = await orbyvenSupabase
      .from("ops_tasks")
      .update({ status: "in_progress" })
      .eq("organization_id", organizationId)
      .eq("id", event.task_id)
      .eq("status", "planned");

    if (error) throw error;
    taskUpdated = true;
  }

  const schedule = await syncTaskCalendarSchedule(organizationId, event.task_id);
  return {
    taskUpdated,
    scheduleUpdated: schedule.taskUpdated,
    nextScheduledAt: schedule.nextScheduledAt,
  };
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

  const { count: futureScheduled, error: futureError } = await orbyvenSupabase
    .from("calendar_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("task_id", taskId)
    .eq("event_type", "work")
    .eq("status", "scheduled")
    .gt("end_at", nowIso);

  if (futureError) throw futureError;
  return {
    completedEvents: (data ?? []).length,
    futureScheduled: futureScheduled ?? 0,
  };
}


export async function syncCrmAfterEstimateCreated(
  organizationId: string,
  clientId: string,
  estimateReference?: string | null
) {
  requireOrganizationId(organizationId);
  if (!clientId.trim()) {
    return { updated: false as const, reason: "missing_client" as const };
  }

  const { data: lead, error: leadError } = await orbyvenSupabase
    .from("crm_leads")
    .select("id,kind,stage")
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .single();

  if (leadError || !lead) {
    throw leadError ?? new Error("Clientul devizului nu a putut fi încărcat.");
  }
  if (lead.kind === "client") {
    return { updated: false as const, reason: "already_client" as const };
  }
  if (lead.stage === "won" || lead.stage === "lost") {
    return { updated: false as const, reason: "terminal_stage" as const, stage: lead.stage };
  }
  if (lead.stage === "proposal") {
    return { updated: false as const, reason: "already_proposal" as const };
  }

  const { data: updated, error: updateError } = await orbyvenSupabase
    .from("crm_leads")
    .update({ stage: "proposal" })
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .eq("kind", "lead")
    .in("stage", ["new", "contacted", "qualified"])
    .select("id")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updated) {
    return { updated: false as const, reason: "state_changed" as const };
  }

  const label = estimateReference?.trim()
    ? ` pentru ${estimateReference.trim()}`
    : "";
  const { error: activityError } = await orbyvenSupabase
    .from("crm_lead_activities")
    .insert({
      organization_id: organizationId,
      lead_id: clientId,
      kind: "status",
      body: "Stadiu mutat automat în Propunere după crearea devizului" + label + ".",
      occurred_at: new Date().toISOString(),
    });

  return {
    updated: true as const,
    activityLogged: !activityError,
  };
}

export async function syncCrmAfterEstimateSent(
  organizationId: string,
  clientId: string,
  estimateReference?: string | null
) {
  requireOrganizationId(organizationId);
  if (!clientId.trim()) {
    return { updated: false as const, reason: "missing_client" as const };
  }

  const { data: lead, error: leadError } = await orbyvenSupabase
    .from("crm_leads")
    .select("id,kind,stage")
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .single();

  if (leadError || !lead) {
    throw leadError ?? new Error("Clientul devizului nu a putut fi încărcat.");
  }
  if (lead.stage === "lost") {
    return { updated: false as const, reason: "lost_conflict" as const };
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { last_contact_at: now };
  if (lead.kind === "lead" && ["new", "contacted", "qualified"].includes(lead.stage)) {
    patch.stage = "proposal";
  }

  const { data: updated, error: updateError } = await orbyvenSupabase
    .from("crm_leads")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .neq("stage", "lost")
    .select("id")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updated) {
    return { updated: false as const, reason: "state_changed" as const };
  }

  const label = estimateReference?.trim()
    ? ` ${estimateReference.trim()}`
    : "";
  const { error: activityError } = await orbyvenSupabase
    .from("crm_lead_activities")
    .insert({
      organization_id: organizationId,
      lead_id: clientId,
      kind: "status",
      body: "Devizul" + label + " a fost marcat trimis; ultima interacțiune CRM a fost sincronizată.",
      occurred_at: now,
    });

  return {
    updated: true as const,
    activityLogged: !activityError,
  };
}

export async function syncCrmAfterEstimateClosedWithoutAcceptance(
  organizationId: string,
  clientId: string,
  status: "rejected" | "expired",
  estimateReference?: string | null
) {
  requireOrganizationId(organizationId);
  if (!clientId.trim()) {
    return { updated: false as const, reason: "missing_client" as const };
  }

  const { data: lead, error: leadError } = await orbyvenSupabase
    .from("crm_leads")
    .select("id,kind,stage")
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .single();

  if (leadError || !lead) {
    throw leadError ?? new Error("Clientul devizului nu a putut fi încărcat.");
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await orbyvenSupabase
    .from("crm_leads")
    .update({ last_contact_at: now })
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .select("id")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updated) {
    return { updated: false as const, reason: "state_changed" as const };
  }

  const label = estimateReference?.trim() ? " " + estimateReference.trim() : "";
  const outcome = status === "rejected" ? "respins" : "expirat";
  const { error: activityError } = await orbyvenSupabase
    .from("crm_lead_activities")
    .insert({
      organization_id: organizationId,
      lead_id: clientId,
      kind: "status",
      body:
        "Devizul" +
        label +
        " a fost marcat " +
        outcome +
        ". Stadiul CRM a fost păstrat pentru decizie manuală.",
      occurred_at: now,
    });

  return {
    updated: true as const,
    activityLogged: !activityError,
    preservedStage: lead.stage,
    preservedKind: lead.kind,
  };
}

export async function syncCrmAfterAcceptedEstimate(
  organizationId: string,
  clientId: string,
  estimateReference?: string | null
) {
  requireOrganizationId(organizationId);
  if (!clientId.trim()) {
    return { converted: false as const, reason: "missing_client" as const };
  }

  const { data: lead, error: leadError } = await orbyvenSupabase
    .from("crm_leads")
    .select("id,kind,stage")
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .single();

  if (leadError || !lead) {
    throw leadError ?? new Error("Clientul devizului nu a putut fi încărcat.");
  }
  if (lead.kind === "client") {
    return { converted: false as const, reason: "already_client" as const };
  }
  if (lead.stage === "lost") {
    return { converted: false as const, reason: "lost_conflict" as const };
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await orbyvenSupabase
    .from("crm_leads")
    .update({
      kind: "client",
      stage: "won",
      converted_at: now,
    })
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .eq("kind", "lead")
    .neq("stage", "lost")
    .select("id")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updated) {
    return { converted: false as const, reason: "state_changed" as const };
  }

  const label = estimateReference?.trim()
    ? ` după acceptarea ${estimateReference.trim()}`
    : " după acceptarea devizului";
  const { error: activityError } = await orbyvenSupabase
    .from("crm_lead_activities")
    .insert({
      organization_id: organizationId,
      lead_id: clientId,
      kind: "status",
      body: "Convertit automat în client" + label + ".",
      occurred_at: now,
    });

  return {
    converted: true as const,
    activityLogged: !activityError,
  };
}
