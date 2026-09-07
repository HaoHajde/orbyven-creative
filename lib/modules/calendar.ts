import { orbyvenSupabase } from "@/lib/orbyven-supabase";

export type CalendarEventType = "appointment" | "work" | "follow_up" | "internal";
export type CalendarEventStatus = "scheduled" | "completed" | "cancelled";

export type CalendarEvent = {
  id: string;
  organization_id: string;
  event_type: CalendarEventType;
  status: CalendarEventStatus;
  title: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  client_id: string | null;
  task_id: string | null;
  assignee: string | null;
  location: string | null;
  notes: string | null;
  reminder_minutes: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarClient = {
  id: string;
  name: string;
  company: string | null;
  kind: "lead" | "client";
};

export type CalendarTask = {
  id: string;
  title: string;
  status: "planned" | "in_progress" | "blocked" | "done" | "cancelled";
  client_id: string | null;
};

export type CreateCalendarEventInput = {
  title: string;
  eventType?: CalendarEventType;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  clientId?: string | null;
  taskId?: string | null;
  assignee?: string;
  location?: string;
  notes?: string;
  reminderMinutes?: number | null;
};

export type UpdateCalendarEventInput = Partial<{
  title: string;
  event_type: CalendarEventType;
  status: CalendarEventStatus;
  start_at: string;
  end_at: string;
  all_day: boolean;
  client_id: string | null;
  task_id: string | null;
  assignee: string | null;
  location: string | null;
  notes: string | null;
  reminder_minutes: number | null;
}>;

const EVENT_FIELDS =
  "id,organization_id,event_type,status,title,start_at,end_at,all_day,client_id,task_id,assignee,location,notes,reminder_minutes,created_by,created_at,updated_at";

function requireOrganizationId(organizationId: string) {
  if (!organizationId.trim()) {
    throw new Error("organization_id is required for every Calendar module operation.");
  }
}

function requireEventId(eventId: string) {
  if (!eventId.trim()) throw new Error("calendar_event_id is required.");
}

function cleanOptional(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeReminder(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : null;
}

export async function listCalendarEvents(
  organizationId: string,
  rangeStart: string,
  rangeEnd: string
): Promise<CalendarEvent[]> {
  requireOrganizationId(organizationId);

  const { data, error } = await orbyvenSupabase
    .from("calendar_events")
    .select(EVENT_FIELDS)
    .eq("organization_id", organizationId)
    .lt("start_at", rangeEnd)
    .gt("end_at", rangeStart)
    .order("start_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CalendarEvent[];
}

export async function listCalendarClients(
  organizationId: string
): Promise<CalendarClient[]> {
  requireOrganizationId(organizationId);

  const { data, error } = await orbyvenSupabase
    .from("crm_leads")
    .select("id,name,company,kind")
    .eq("organization_id", organizationId)
    .order("kind", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CalendarClient[];
}

export async function listCalendarTasks(
  organizationId: string
): Promise<CalendarTask[]> {
  requireOrganizationId(organizationId);

  const { data, error } = await orbyvenSupabase
    .from("ops_tasks")
    .select("id,title,status,client_id")
    .eq("organization_id", organizationId)
    .neq("status", "cancelled")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CalendarTask[];
}

export async function createCalendarEvent(
  organizationId: string,
  input: CreateCalendarEventInput
): Promise<CalendarEvent> {
  requireOrganizationId(organizationId);

  const title = input.title.trim();
  if (!title) throw new Error("Event title is required.");

  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime())) {
    throw new Error("A valid start and end time are required.");
  }
  if (endAt <= startAt) throw new Error("Event end must be after start.");

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { data, error } = await orbyvenSupabase
    .from("calendar_events")
    .insert({
      organization_id: organizationId,
      event_type: input.eventType ?? "appointment",
      title,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      all_day: input.allDay ?? false,
      client_id: input.clientId || null,
      task_id: input.taskId || null,
      assignee: cleanOptional(input.assignee),
      location: cleanOptional(input.location),
      notes: cleanOptional(input.notes),
      reminder_minutes: normalizeReminder(input.reminderMinutes),
      created_by: authData.user?.id ?? null,
    })
    .select(EVENT_FIELDS)
    .single();

  if (error) throw error;
  return data as CalendarEvent;
}

export async function updateCalendarEvent(
  organizationId: string,
  eventId: string,
  patch: UpdateCalendarEventInput
): Promise<CalendarEvent> {
  requireOrganizationId(organizationId);
  requireEventId(eventId);

  const nextPatch = { ...patch };
  if (typeof nextPatch.title === "string") {
    nextPatch.title = nextPatch.title.trim();
    if (!nextPatch.title) throw new Error("Event title cannot be empty.");
  }
  if (typeof nextPatch.assignee === "string") {
    nextPatch.assignee = cleanOptional(nextPatch.assignee);
  }
  if (typeof nextPatch.location === "string") {
    nextPatch.location = cleanOptional(nextPatch.location);
  }
  if (typeof nextPatch.notes === "string") {
    nextPatch.notes = cleanOptional(nextPatch.notes);
  }
  if (typeof nextPatch.reminder_minutes === "number") {
    nextPatch.reminder_minutes = normalizeReminder(nextPatch.reminder_minutes);
  }

  const startAt = nextPatch.start_at ? new Date(nextPatch.start_at) : null;
  const endAt = nextPatch.end_at ? new Date(nextPatch.end_at) : null;
  if (startAt && !Number.isFinite(startAt.getTime())) throw new Error("Invalid start time.");
  if (endAt && !Number.isFinite(endAt.getTime())) throw new Error("Invalid end time.");
  if (startAt) nextPatch.start_at = startAt.toISOString();
  if (endAt) nextPatch.end_at = endAt.toISOString();

  const { data, error } = await orbyvenSupabase
    .from("calendar_events")
    .update(nextPatch)
    .eq("organization_id", organizationId)
    .eq("id", eventId)
    .select(EVENT_FIELDS)
    .single();

  if (error) throw error;
  return data as CalendarEvent;
}

export async function setCalendarEventStatus(
  organizationId: string,
  eventId: string,
  status: CalendarEventStatus
) {
  return updateCalendarEvent(organizationId, eventId, { status });
}

export async function deleteCalendarEvent(organizationId: string, eventId: string) {
  requireOrganizationId(organizationId);
  requireEventId(eventId);

  const { error } = await orbyvenSupabase
    .from("calendar_events")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", eventId);

  if (error) throw error;
}
