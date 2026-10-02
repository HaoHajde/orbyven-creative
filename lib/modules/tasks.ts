import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { readAllPages } from "@/lib/modules/paged-read";
import { loadTaskInventoryConsumption } from "@/lib/modules/inventory";

export type WorkTaskKind = "task" | "work" | "order";
export type WorkTaskStatus = "planned" | "in_progress" | "blocked" | "done" | "cancelled";
export type WorkTaskPriority = "low" | "normal" | "high" | "urgent";

export type WorkTask = {
  id: string;
  organization_id: string;
  kind: WorkTaskKind;
  status: WorkTaskStatus;
  priority: WorkTaskPriority;
  title: string;
  description: string | null;
  client_id: string | null;
  assignee: string | null;
  location: string | null;
  scheduled_at: string | null;
  due_at: string | null;
  estimated_minutes: number | null;
  progress: number;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkTaskChecklistItem = {
  id: string;
  organization_id: string;
  task_id: string;
  title: string;
  done: boolean;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkTaskClient = {
  id: string;
  name: string;
  company: string | null;
  kind: "lead" | "client";
  next_follow_up_at?: string | null;
};

export type WorkTaskContext = {
  estimatesCount: number;
  sentEstimatesCount: number;
  acceptedEstimatesCount: number;
  latestEstimateId: string | null;
  documentsCount: number;
  eventsCount: number;
  upcomingEventsCount: number;
  expensesCount: number | null;
  expensesCents: number | null;
  inventoryMovementsCount: number | null;
  inventoryConsumedCents: number | null;
  inventoryRequiredLines: number | null;
  inventoryUntrackedLines: number | null;
  inventoryUnreadyLines: number | null;
  inventoryShortageLines: number | null;
  realOperationalCostCents: number | null;
  thermalSketch: boolean | null;
};

export type CreateWorkTaskInput = {
  title: string;
  kind?: WorkTaskKind;
  priority?: WorkTaskPriority;
  description?: string;
  clientId?: string | null;
  assignee?: string;
  location?: string;
  scheduledAt?: string | null;
  dueAt?: string | null;
  estimatedMinutes?: number | null;
};

export type UpdateWorkTaskInput = Partial<{
  title: string;
  kind: WorkTaskKind;
  status: WorkTaskStatus;
  priority: WorkTaskPriority;
  description: string | null;
  client_id: string | null;
  assignee: string | null;
  location: string | null;
  scheduled_at: string | null;
  due_at: string | null;
  estimated_minutes: number | null;
  progress: number;
  completed_at: string | null;
}>;

const TASK_FIELDS =
  "id,organization_id,kind,status,priority,title,description,client_id,assignee,location,scheduled_at,due_at,estimated_minutes,progress,completed_at,created_by,created_at,updated_at";
const CHECKLIST_FIELDS =
  "id,organization_id,task_id,title,done,position,created_by,created_at,updated_at";

function requireOrganizationId(organizationId: string) {
  if (!organizationId.trim()) {
    throw new Error("organization_id is required for every Tasks module operation.");
  }
}

function requireTaskId(taskId: string) {
  if (!taskId.trim()) throw new Error("task_id is required.");
}

function cleanOptional(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeMinutes(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : null;
}

function normalizeProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export async function listWorkTasks(organizationId: string): Promise<WorkTask[]> {
  requireOrganizationId(organizationId);

  const { data, error } = await orbyvenSupabase
    .from("ops_tasks")
    .select(TASK_FIELDS)
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as WorkTask[];
}

export async function listWorkTaskClients(
  organizationId: string
): Promise<WorkTaskClient[]> {
  requireOrganizationId(organizationId);

  const { data, error } = await orbyvenSupabase
    .from("crm_leads")
    .select("id,name,company,kind,next_follow_up_at")
    .eq("organization_id", organizationId)
    .order("kind", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as WorkTaskClient[];
}

export async function loadWorkTaskContext(
  organizationId: string,
  taskId: string,
  options: {
    canAccessFinances: boolean;
    includeEstimates: boolean;
    includeDocuments: boolean;
    includeCalendar: boolean;
    includeExpenses: boolean;
    includeInventory: boolean;
    includeThermal: boolean;
  }
): Promise<WorkTaskContext> {
  requireOrganizationId(organizationId);
  requireTaskId(taskId);

  const nowIso = new Date().toISOString();
  const [estimatesResult, documentsResult, eventsResult, expenseRows, inventoryResult, thermalResult] =
    await Promise.all([
      options.includeEstimates
        ? orbyvenSupabase
            .from("sales_estimates")
            .select("id,status,updated_at")
            .eq("organization_id", organizationId)
            .eq("task_id", taskId)
            .order("updated_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      options.includeDocuments
        ? orbyvenSupabase
            .from("ops_documents")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .eq("task_id", taskId)
        : Promise.resolve({ count: 0, error: null }),
      options.includeCalendar
        ? orbyvenSupabase
            .from("calendar_events")
            .select("id,status,start_at")
            .eq("organization_id", organizationId)
            .eq("task_id", taskId)
            .neq("status", "cancelled")
            .order("start_at", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      options.includeExpenses && options.canAccessFinances
        ? readAllPages<{ amount_cents: number }>((from, to) =>
            orbyvenSupabase
              .from("finance_expenses")
              .select("amount_cents")
              .eq("organization_id", organizationId)
              .eq("task_id", taskId)
              .is("purchase_order_id", null)
              .order("occurred_on", { ascending: true })
              .order("id", { ascending: true })
              .range(from, to)
          )
        : Promise.resolve(null),
      options.includeInventory
        ? loadTaskInventoryConsumption(organizationId, taskId)
        : Promise.resolve(null),
      options.includeThermal
        ? orbyvenSupabase
            .from("thermal_sketches")
            .select("task_id", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .eq("task_id", taskId)
        : Promise.resolve({ count: null, error: null }),
    ]);

  if (estimatesResult.error) throw estimatesResult.error;
  if (documentsResult.error) throw documentsResult.error;
  if (eventsResult.error) throw eventsResult.error;
  if (thermalResult.error) throw thermalResult.error;
  if (options.includeDocuments && documentsResult.count === null) throw new Error("Document count unavailable.");

  const estimates = estimatesResult.data ?? [];
  const events = eventsResult.data ?? [];

  const expensesCents = expenseRows
    ? expenseRows.reduce((sum, item) => sum + Number(item.amount_cents), 0)
    : null;
  const inventoryConsumedCents = inventoryResult?.costCents ?? null;
  const realOperationalCostCents = options.canAccessFinances
    ? (expensesCents ?? 0) + (inventoryConsumedCents ?? 0)
    : null;

  return {
    estimatesCount: estimates.length,
    sentEstimatesCount: estimates.filter((item) => item.status === "sent").length,
    acceptedEstimatesCount: estimates.filter((item) => item.status === "accepted").length,
    latestEstimateId: estimates[0]?.id ?? null,
    documentsCount: documentsResult.count ?? 0,
    eventsCount: events.length,
    upcomingEventsCount: events.filter((item) => item.start_at >= nowIso).length,
    expensesCount: expenseRows ? expenseRows.length : null,
    expensesCents,
    inventoryMovementsCount: inventoryResult?.count ?? null,
    inventoryConsumedCents,
    inventoryRequiredLines: inventoryResult?.requiredLines ?? null,
    inventoryUntrackedLines: inventoryResult?.untrackedLines ?? null,
    inventoryUnreadyLines: inventoryResult?.unreadyLines ?? null,
    inventoryShortageLines: inventoryResult?.shortageLines ?? null,
    realOperationalCostCents,
    thermalSketch: options.includeThermal ? (thermalResult.count ?? 0) > 0 : null,
  };
}

export async function createWorkTask(
  organizationId: string,
  input: CreateWorkTaskInput
): Promise<WorkTask> {
  requireOrganizationId(organizationId);

  const title = input.title.trim();
  if (!title) throw new Error("Task title is required.");

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { data, error } = await orbyvenSupabase
    .from("ops_tasks")
    .insert({
      organization_id: organizationId,
      title,
      kind: input.kind ?? "task",
      priority: input.priority ?? "normal",
      description: cleanOptional(input.description),
      client_id: input.clientId || null,
      assignee: cleanOptional(input.assignee),
      location: cleanOptional(input.location),
      scheduled_at: input.scheduledAt || null,
      due_at: input.dueAt || null,
      estimated_minutes: normalizeMinutes(input.estimatedMinutes),
      created_by: authData.user?.id ?? null,
    })
    .select(TASK_FIELDS)
    .single();

  if (error) throw error;
  return data as WorkTask;
}

export async function createRecurringWorkFromTask(
  organizationId: string,
  sourceTaskId: string,
  scheduledAt: string
): Promise<WorkTask> {
  requireOrganizationId(organizationId);
  requireTaskId(sourceTaskId);

  const nextDate = new Date(scheduledAt);
  if (!Number.isFinite(nextDate.getTime())) {
    throw new Error("Invalid recurring work date.");
  }

  const { data: source, error: sourceError } = await orbyvenSupabase
    .from("ops_tasks")
    .select(TASK_FIELDS)
    .eq("organization_id", organizationId)
    .eq("id", sourceTaskId)
    .single();

  if (sourceError) throw sourceError;
  const sourceTask = source as WorkTask;
  if (sourceTask.status !== "done") {
    throw new Error("Only completed work can be repeated.");
  }
  if (sourceTask.kind === "task") {
    throw new Error("Generic tasks are not recurring work.");
  }

  const created = await createWorkTask(organizationId, {
    title: sourceTask.title,
    kind: sourceTask.kind,
    priority: "normal",
    description: sourceTask.description ?? "",
    clientId: sourceTask.client_id,
    location: sourceTask.location ?? "",
    scheduledAt: nextDate.toISOString(),
    estimatedMinutes: sourceTask.estimated_minutes,
  });

  try {
    const { data: checklistRows, error: checklistError } = await orbyvenSupabase
      .from("ops_task_checklist_items")
      .select("title,position")
      .eq("organization_id", organizationId)
      .eq("task_id", sourceTaskId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (checklistError) throw checklistError;

    if (checklistRows?.length) {
      const { data: authData } = await orbyvenSupabase.auth.getUser();
      const { error: copyError } = await orbyvenSupabase
        .from("ops_task_checklist_items")
        .insert(
          checklistRows.map((item) => ({
            organization_id: organizationId,
            task_id: created.id,
            title: item.title,
            done: false,
            position: item.position,
            created_by: authData.user?.id ?? null,
          }))
        );

      if (copyError) throw copyError;
    }
  } catch (copyError) {
    await orbyvenSupabase
      .from("ops_tasks")
      .delete()
      .eq("organization_id", organizationId)
      .eq("id", created.id);
    throw copyError;
  }

  return created;
}

export async function updateWorkTask(
  organizationId: string,
  taskId: string,
  patch: UpdateWorkTaskInput
): Promise<WorkTask> {
  requireOrganizationId(organizationId);
  requireTaskId(taskId);

  const nextPatch = { ...patch };
  if (typeof nextPatch.title === "string") {
    nextPatch.title = nextPatch.title.trim();
    if (!nextPatch.title) throw new Error("Task title cannot be empty.");
  }
  if (typeof nextPatch.description === "string") {
    nextPatch.description = cleanOptional(nextPatch.description);
  }
  if (typeof nextPatch.assignee === "string") {
    nextPatch.assignee = cleanOptional(nextPatch.assignee);
  }
  if (typeof nextPatch.location === "string") {
    nextPatch.location = cleanOptional(nextPatch.location);
  }
  if (typeof nextPatch.estimated_minutes === "number") {
    nextPatch.estimated_minutes = normalizeMinutes(nextPatch.estimated_minutes);
  }
  if (typeof nextPatch.progress === "number") {
    nextPatch.progress = normalizeProgress(nextPatch.progress);
  }

  const { data, error } = await orbyvenSupabase
    .from("ops_tasks")
    .update(nextPatch)
    .eq("organization_id", organizationId)
    .eq("id", taskId)
    .select(TASK_FIELDS)
    .single();

  if (error) throw error;
  return data as WorkTask;
}

export async function setWorkTaskStatus(
  organizationId: string,
  taskId: string,
  status: WorkTaskStatus
): Promise<WorkTask> {
  const isDone = status === "done";
  return updateWorkTask(organizationId, taskId, {
    status,
    progress: isDone ? 100 : undefined,
    completed_at: isDone ? new Date().toISOString() : null,
  });
}

export async function setWorkTaskProgress(
  organizationId: string,
  taskId: string,
  progress: number
): Promise<WorkTask> {
  const normalized = normalizeProgress(progress);
  return updateWorkTask(organizationId, taskId, {
    progress: normalized,
    status: normalized === 100 ? "done" : normalized > 0 ? "in_progress" : "planned",
    completed_at: normalized === 100 ? new Date().toISOString() : null,
  });
}

export async function deleteWorkTask(organizationId: string, taskId: string) {
  requireOrganizationId(organizationId);
  requireTaskId(taskId);

  const { error } = await orbyvenSupabase
    .from("ops_tasks")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", taskId);

  if (error) throw error;
}

export async function listWorkTaskChecklist(
  organizationId: string,
  taskId: string
): Promise<WorkTaskChecklistItem[]> {
  requireOrganizationId(organizationId);
  requireTaskId(taskId);

  const { data, error } = await orbyvenSupabase
    .from("ops_task_checklist_items")
    .select(CHECKLIST_FIELDS)
    .eq("organization_id", organizationId)
    .eq("task_id", taskId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as WorkTaskChecklistItem[];
}

export async function createWorkTaskChecklistItem(
  organizationId: string,
  taskId: string,
  title: string,
  position = 0
): Promise<WorkTaskChecklistItem> {
  requireOrganizationId(organizationId);
  requireTaskId(taskId);
  const cleanTitle = title.trim();
  if (!cleanTitle) throw new Error("Checklist title is required.");

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { data, error } = await orbyvenSupabase
    .from("ops_task_checklist_items")
    .insert({
      organization_id: organizationId,
      task_id: taskId,
      title: cleanTitle,
      position: Math.max(0, Math.round(position)),
      created_by: authData.user?.id ?? null,
    })
    .select(CHECKLIST_FIELDS)
    .single();

  if (error) throw error;
  return data as WorkTaskChecklistItem;
}

export async function setWorkTaskChecklistItemDone(
  organizationId: string,
  taskId: string,
  itemId: string,
  done: boolean
): Promise<WorkTaskChecklistItem> {
  requireOrganizationId(organizationId);
  requireTaskId(taskId);
  if (!itemId.trim()) throw new Error("checklist_item_id is required.");

  const { data, error } = await orbyvenSupabase
    .from("ops_task_checklist_items")
    .update({ done })
    .eq("organization_id", organizationId)
    .eq("task_id", taskId)
    .eq("id", itemId)
    .select(CHECKLIST_FIELDS)
    .single();

  if (error) throw error;
  return data as WorkTaskChecklistItem;
}

export async function deleteWorkTaskChecklistItem(
  organizationId: string,
  taskId: string,
  itemId: string
) {
  requireOrganizationId(organizationId);
  requireTaskId(taskId);
  if (!itemId.trim()) throw new Error("checklist_item_id is required.");

  const { error } = await orbyvenSupabase
    .from("ops_task_checklist_items")
    .delete()
    .eq("organization_id", organizationId)
    .eq("task_id", taskId)
    .eq("id", itemId);

  if (error) throw error;
}
