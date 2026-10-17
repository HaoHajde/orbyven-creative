import { createBillingServiceClient, type BillingActor } from "@/lib/billing/supabase-server";
import type { IntelligenceResponse } from "@/lib/ai/intelligence-types";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import {
  detectEntityIntelligenceQuery,
  detectEntityQuestionScope,
  type EntityQuestionScope,
} from "@/lib/ai/entity-intelligence-core";

type ClientRow = {
  id: string;
  kind: string;
  stage: string;
  name: string;
  company: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
};

type WorkRow = {
  id: string;
  title: string;
  kind: string;
  status: string;
  priority: string;
  client_id: string | null;
  assignee: string | null;
  scheduled_at: string | null;
  due_at: string | null;
  progress: number;
};

type EstimateRow = {
  id: string;
  reference: string;
  title: string;
  status: string;
  valid_until: string | null;
  client_id: string | null;
  task_id: string | null;
};

type EventRow = {
  id: string;
  title: string;
  start_at: string;
  client_id: string | null;
  task_id: string | null;
};

type DocumentRow = {
  id: string;
  name: string;
  client_id: string | null;
  task_id: string | null;
  estimate_id: string | null;
  created_at: string;
};

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function searchable(value: string) {
  return value.replace(/[%_]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

function displayClient(row: Pick<ClientRow, "name" | "company">) {
  return row.company?.trim() || row.name;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ro-RO", {
    timeZone: "Europe/Bucharest",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ro-RO", {
    timeZone: "Europe/Bucharest",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

async function findClients(actor: BillingActor, value: string) {
  const db = createBillingServiceClient(actor);
  const needle = searchable(value);
  if (!needle) return [] as ClientRow[];
  const fields = "id,kind,stage,name,company,last_contact_at,next_follow_up_at";
  const [byName, byCompany] = await Promise.all([
    db.from("crm_leads")
      .select(fields)
      .eq("organization_id", actor.organizationId)
      .ilike("name", `%${needle}%`)
      .limit(8),
    db.from("crm_leads")
      .select(fields)
      .eq("organization_id", actor.organizationId)
      .ilike("company", `%${needle}%`)
      .limit(8),
  ]);
  if (byName.error) throw byName.error;
  if (byCompany.error) throw byCompany.error;
  const unique = new Map<string, ClientRow>();
  for (const row of [...(byName.data ?? []), ...(byCompany.data ?? [])] as ClientRow[]) unique.set(row.id, row);
  const rows = [...unique.values()];
  const target = normalize(value);
  const exact = rows.filter((row) => normalize(row.name) === target || Boolean(row.company && normalize(row.company) === target));
  return exact.length ? exact : rows;
}

async function findWorks(actor: BillingActor, value: string) {
  const db = createBillingServiceClient(actor);
  const needle = searchable(value);
  if (!needle) return [] as WorkRow[];
  const { data, error } = await db.from("ops_tasks")
    .select("id,title,kind,status,priority,client_id,assignee,scheduled_at,due_at,progress")
    .eq("organization_id", actor.organizationId)
    .ilike("title", `%${needle}%`)
    .order("updated_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  const rows = (data ?? []) as WorkRow[];
  const target = normalize(value);
  const exact = rows.filter((row) => normalize(row.title) === target);
  return exact.length ? exact : rows;
}

function missing(kind: "client" | "work", value: string): IntelligenceResponse {
  return {
    specialist: "operations",
    answer: `Nu am găsit ${kind === "client" ? "clientul" : "lucrarea"} „${value}” în această firmă.`,
    facts: [{ label: "Căutare", value }],
    actions: [{
      kind: "open_module",
      label: kind === "client" ? "Deschide Clienți" : "Deschide Lucrări",
      moduleId: kind === "client" ? "leads" : "tasks",
    }],
    generatedBy: "orbyven_core",
  };
}

function ambiguous(kind: "client" | "work", values: Array<{ id: string; label: string }>): IntelligenceResponse {
  return {
    specialist: "operations",
    answer: `Am găsit ${values.length} potriviri posibile. Deschide înregistrarea corectă sau folosește un nume mai distinctiv.`,
    facts: [{ label: "Potriviri", value: String(values.length) }],
    actions: values.slice(0, 3).map((item) => ({
      kind: "open_module" as const,
      label: item.label,
      moduleId: kind === "client" ? "leads" as const : "tasks" as const,
      recordId: item.id,
      ...(kind === "work" ? { taskId: item.id } : {}),
    })),
    generatedBy: "orbyven_core",
  };
}

function unavailable(kind: "client" | "work"): IntelligenceResponse {
  return {
    specialist: "operations",
    answer: kind === "client"
      ? "Modulul Clienți nu este activ în acest workspace."
      : "Modulul Lucrări nu este activ în acest workspace.",
    facts: [],
    actions: [{ kind: "open_module", label: "Vezi overview", moduleId: "overview" }],
    generatedBy: "orbyven_core",
  };
}

function scopedClientAnswer(
  scope: EntityQuestionScope,
  name: string,
  tasks: WorkRow[],
  estimates: EstimateRow[],
  events: EventRow[],
  documents: DocumentRow[],
  activities: Array<{ kind: string; body: string | null; occurred_at: string }>,
  entity: ClientRow,
) {
  if (scope === "estimates") return `${name} are ${estimates.length} devize/ofertări înregistrate.`;
  if (scope === "calendar") return events.length
    ? `${name} are ${events.length} programări viitoare. Următoarea este ${formatDateTime(events[0].start_at)}.`
    : `${name} nu are programări viitoare în calendar.`;
  if (scope === "documents") return `${name} are ${documents.length} documente legate în workspace.`;
  if (scope === "history") return activities.length
    ? `Ultima activitate pentru ${name} este „${activities[0].kind}”, la ${formatDateTime(activities[0].occurred_at)}.`
    : `Nu există activitate CRM înregistrată pentru ${name}.`;
  return `${name}: ${tasks.filter((row) => !["done", "cancelled"].includes(row.status)).length} lucrări active, ${estimates.length} devize și ${documents.length} documente legate.`;
}

async function clientResponse(
  actor: BillingActor,
  available: Set<OrbyvenModuleId>,
  entity: ClientRow,
  scope: EntityQuestionScope,
): Promise<IntelligenceResponse> {
  const db = createBillingServiceClient(actor);
  const nowIso = new Date().toISOString();
  const [tasksResult, estimatesResult, eventsResult, docsResult, activityResult] = await Promise.all([
    available.has("tasks")
      ? db.from("ops_tasks").select("id,title,kind,status,priority,client_id,assignee,scheduled_at,due_at,progress")
          .eq("organization_id", actor.organizationId).eq("client_id", entity.id).order("updated_at", { ascending: false }).limit(80)
      : Promise.resolve({ data: [], error: null }),
    available.has("estimates")
      ? db.from("sales_estimates").select("id,reference,title,status,valid_until,client_id,task_id")
          .eq("organization_id", actor.organizationId).eq("client_id", entity.id).order("updated_at", { ascending: false }).limit(40)
      : Promise.resolve({ data: [], error: null }),
    available.has("calendar")
      ? db.from("calendar_events").select("id,title,start_at,client_id,task_id")
          .eq("organization_id", actor.organizationId).eq("client_id", entity.id).neq("status", "cancelled").gte("start_at", nowIso).order("start_at").limit(30)
      : Promise.resolve({ data: [], error: null }),
    available.has("documents")
      ? db.from("ops_documents").select("id,name,client_id,task_id,estimate_id,created_at")
          .eq("organization_id", actor.organizationId).eq("client_id", entity.id).order("created_at", { ascending: false }).limit(30)
      : Promise.resolve({ data: [], error: null }),
    db.from("crm_lead_activities").select("kind,body,occurred_at")
      .eq("organization_id", actor.organizationId).eq("lead_id", entity.id).order("occurred_at", { ascending: false }).limit(20),
  ]);
  for (const result of [tasksResult, estimatesResult, eventsResult, docsResult, activityResult]) if (result.error) throw result.error;

  const tasks = (tasksResult.data ?? []) as WorkRow[];
  const estimates = (estimatesResult.data ?? []) as EstimateRow[];
  const events = (eventsResult.data ?? []) as EventRow[];
  const documents = (docsResult.data ?? []) as DocumentRow[];
  const activities = (activityResult.data ?? []) as Array<{ kind: string; body: string | null; occurred_at: string }>;
  const name = displayClient(entity);
  const actions = [
    { kind: "open_module" as const, label: "Deschide clientul", moduleId: "leads" as const, recordId: entity.id },
    ...(tasks[0] && available.has("tasks") ? [{ kind: "open_module" as const, label: tasks[0].title, moduleId: "tasks" as const, recordId: tasks[0].id, clientId: entity.id, taskId: tasks[0].id }] : []),
    ...(estimates[0] && available.has("estimates") ? [{ kind: "open_module" as const, label: estimates[0].reference, moduleId: "estimates" as const, recordId: estimates[0].id, clientId: entity.id, taskId: estimates[0].task_id ?? undefined, estimateId: estimates[0].id }] : []),
  ].slice(0, 3);

  return {
    specialist: "operations",
    answer: scopedClientAnswer(scope, name, tasks, estimates, events, documents, activities, entity),
    facts: [
      { label: "Client", value: name },
      { label: "Stadiu", value: entity.stage },
      { label: "Ultimul contact", value: formatDate(entity.last_contact_at) },
      { label: "Lucrări", value: String(tasks.length) },
      { label: "Devize", value: String(estimates.length) },
      { label: "Documente", value: String(documents.length) },
    ],
    actions,
    generatedBy: "orbyven_core",
  };
}

async function workResponse(
  actor: BillingActor,
  available: Set<OrbyvenModuleId>,
  entity: WorkRow,
  scope: EntityQuestionScope,
): Promise<IntelligenceResponse> {
  const db = createBillingServiceClient(actor);
  const nowIso = new Date().toISOString();
  const [clientResult, estimatesResult, eventsResult, docsResult] = await Promise.all([
    entity.client_id && available.has("leads")
      ? db.from("crm_leads").select("id,kind,stage,name,company,last_contact_at,next_follow_up_at")
          .eq("organization_id", actor.organizationId).eq("id", entity.client_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    available.has("estimates")
      ? db.from("sales_estimates").select("id,reference,title,status,valid_until,client_id,task_id")
          .eq("organization_id", actor.organizationId).eq("task_id", entity.id).order("updated_at", { ascending: false }).limit(30)
      : Promise.resolve({ data: [], error: null }),
    available.has("calendar")
      ? db.from("calendar_events").select("id,title,start_at,client_id,task_id")
          .eq("organization_id", actor.organizationId).eq("task_id", entity.id).neq("status", "cancelled").gte("start_at", nowIso).order("start_at").limit(30)
      : Promise.resolve({ data: [], error: null }),
    available.has("documents")
      ? db.from("ops_documents").select("id,name,client_id,task_id,estimate_id,created_at")
          .eq("organization_id", actor.organizationId).eq("task_id", entity.id).order("created_at", { ascending: false }).limit(30)
      : Promise.resolve({ data: [], error: null }),
  ]);
  for (const result of [clientResult, estimatesResult, eventsResult, docsResult]) if (result.error) throw result.error;
  const client = clientResult.data as ClientRow | null;
  const estimates = (estimatesResult.data ?? []) as EstimateRow[];
  const events = (eventsResult.data ?? []) as EventRow[];
  const documents = (docsResult.data ?? []) as DocumentRow[];

  let answer: string;
  if (scope === "estimates") answer = `Lucrarea „${entity.title}” are ${estimates.length} devize/ofertări legate.`;
  else if (scope === "calendar") answer = events.length
    ? `Lucrarea „${entity.title}” are ${events.length} programări viitoare. Următoarea este ${formatDateTime(events[0].start_at)}.`
    : `Lucrarea „${entity.title}” nu are programări viitoare.`;
  else if (scope === "documents") answer = `Lucrarea „${entity.title}” are ${documents.length} documente legate.`;
  else if (scope === "history") answer = `Lucrarea „${entity.title}” este ${entity.status}, la ${entity.progress}% progres, cu termen ${formatDateTime(entity.due_at)}.`;
  else answer = `„${entity.title}” este ${entity.status}, la ${entity.progress}% progres, ${entity.assignee?.trim() ? `responsabil ${entity.assignee}` : "fără responsabil"}.`;

  return {
    specialist: "operations",
    answer,
    facts: [
      { label: "Lucrare", value: entity.title },
      { label: "Status", value: entity.status },
      { label: "Progres", value: `${entity.progress}%` },
      { label: "Responsabil", value: entity.assignee?.trim() || "Nealocat" },
      { label: "Client", value: client ? displayClient(client) : "—" },
      { label: "Documente", value: String(documents.length) },
    ],
    actions: [
      { kind: "open_module", label: "Deschide lucrarea", moduleId: "tasks", recordId: entity.id, clientId: entity.client_id ?? undefined, taskId: entity.id },
      ...(estimates[0] && available.has("estimates") ? [{ kind: "open_module" as const, label: estimates[0].reference, moduleId: "estimates" as const, recordId: estimates[0].id, clientId: estimates[0].client_id ?? undefined, taskId: entity.id, estimateId: estimates[0].id }] : []),
    ].slice(0, 3),
    generatedBy: "orbyven_core",
  };
}

export async function answerEntityIntelligenceQuery(
  actor: BillingActor,
  available: Set<OrbyvenModuleId>,
  prompt: string,
): Promise<IntelligenceResponse | null> {
  const query = detectEntityIntelligenceQuery(prompt);
  if (!query) return null;
  const scope = detectEntityQuestionScope(prompt);

  if (query.kind === "client") {
    if (!available.has("leads")) return unavailable("client");
    const rows = await findClients(actor, query.value);
    if (!rows.length) return missing("client", query.value);
    if (rows.length > 1) return ambiguous("client", rows.map((row) => ({ id: row.id, label: displayClient(row) })));
    return clientResponse(actor, available, rows[0], scope);
  }

  if (!available.has("tasks")) return unavailable("work");
  const rows = await findWorks(actor, query.value);
  if (!rows.length) return missing("work", query.value);
  if (rows.length > 1) return ambiguous("work", rows.map((row) => ({ id: row.id, label: row.title })));
  return workResponse(actor, available, rows[0], scope);
}
