import { createBillingServiceClient, type BillingActor } from "@/lib/billing/supabase-server";
import type { IntelligenceResponse } from "@/lib/ai/intelligence-types";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import { detectEntityIntelligenceQuery, detectEntityQuestionScope, type EntityQuestionScope } from "@/lib/ai/entity-intelligence-core";

type ClientRow = {
  id: string;
  kind: "lead" | "client";
  stage: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  updated_at: string;
};

type WorkRow = {
  id: string;
  title: string;
  kind: "task" | "work" | "order";
  status: string;
  priority: string;
  client_id: string | null;
  assignee: string | null;
  location: string | null;
  scheduled_at: string | null;
  due_at: string | null;
  progress: number;
  updated_at: string;
};

type EstimateRow = {
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
};

type EventRow = {
  id: string;
  title: string;
  status: string;
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

type InvoiceRow = {
  id: string;
  reference: string;
  status: string;
  total_cents: number;
  currency: string;
  due_on: string | null;
  client_id: string | null;
  task_id: string | null;
};

const FINANCE_ROLES = new Set(["owner", "admin", "manager"]);
const CLOSED_WORK = new Set(["done", "cancelled"]);
const CLOSED_ESTIMATE = new Set(["accepted", "rejected", "expired"]);

function normalizeLookup(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ro-RO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function searchable(value: string) {
  return value.replace(/[%_]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

function displayClient(client: Pick<ClientRow, "name" | "company">) {
  return client.company?.trim() || client.name;
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

function ron(cents: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function activityLabel(kind: string) {
  return ({
    note: "notă",
    call: "apel",
    email: "email",
    meeting: "întâlnire",
    status: "status",
  } as Record<string, string>)[kind] || kind;
}

async function findClientCandidates(actor: BillingActor, value: string): Promise<ClientRow[]> {
  const client = createBillingServiceClient(actor);
  const needle = searchable(value);
  if (!needle) return [];

  const fields =
    "id,kind,stage,name,company,email,phone,last_contact_at,next_follow_up_at,updated_at";
  const [nameResult, companyResult] = await Promise.all([
    client
      .from("crm_leads")
      .select(fields)
      .eq("organization_id", actor.organizationId)
      .ilike("name", `%${needle}%`)
      .order("updated_at", { ascending: false })
      .limit(8),
    client
      .from("crm_leads")
      .select(fields)
      .eq("organization_id", actor.organizationId)
      .ilike("company", `%${needle}%`)
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);
  if (nameResult.error) throw nameResult.error;
  if (companyResult.error) throw companyResult.error;

  const unique = new Map<string, ClientRow>();
  for (const row of [...(nameResult.data ?? []), ...(companyResult.data ?? [])] as ClientRow[]) {
    unique.set(row.id, row);
  }

  const rows = [...unique.values()];
  const target = normalizeLookup(value);
  const exact = rows.filter(
    (row) =>
      normalizeLookup(row.name) === target ||
      Boolean(row.company && normalizeLookup(row.company) === target)
  );
  if (exact.length) return exact;
  return rows;
}

async function findWorkCandidates(actor: BillingActor, value: string): Promise<WorkRow[]> {
  const client = createBillingServiceClient(actor);
  const needle = searchable(value);
  if (!needle) return [];
  const { data, error } = await client
    .from("ops_tasks")
    .select(
      "id,title,kind,status,priority,client_id,assignee,location,scheduled_at,due_at,progress,updated_at"
    )
    .eq("organization_id", actor.organizationId)
    .ilike("title", `%${needle}%`)
    .order("updated_at", { ascending: false })
    .limit(8);
  if (error) throw error;

  const rows = (data ?? []) as WorkRow[];
  const target = normalizeLookup(value);
  const exact = rows.filter((row) => normalizeLookup(row.title) === target);
  if (exact.length) return exact;
  return rows;
}

function ambiguityResponse(
  kind: "client" | "work",
  values: Array<{ id: string; label: string }>
): IntelligenceResponse {
  const moduleId = kind === "client" ? "leads" : "tasks";
  return {
    specialist: "operations",
    answer:
      `Am găsit ${values.length} potriviri posibile. Alege înregistrarea corectă și apoi poți continua conversația despre ea.`,
    facts: [
      { label: "Tip", value: kind === "client" ? "Client" : "Lucrare" },
      { label: "Potriviri", value: String(values.length) },
    ],
    actions: values.slice(0, 3).map((item) => ({
      kind: "open_module" as const,
      label: item.label,
      moduleId,
      recordId: item.id,
      ...(kind === "work" ? { taskId: item.id } : {}),
    })),
    generatedBy: "orbyven_core",
  };
}

function unavailableEntityModule(kind: "client" | "work"): IntelligenceResponse {
  return {
    specialist: "operations",
    answer:
      kind === "client"
        ? "Nu pot căuta clientul deoarece modulul Clienți nu este activ în acest workspace."
        : "Nu pot căuta lucrarea deoarece modulul Lucrări nu este activ în acest workspace.",
    facts: [{ label: "Modul necesar", value: kind === "client" ? "Clienți" : "Lucrări" }],
    actions: [{ kind: "open_module", label: "Vezi workspace-ul", moduleId: "overview" }],
    generatedBy: "orbyven_core",
  };
}

function missingResponse(kind: "client" | "work", value: string): IntelligenceResponse {
  return {
    specialist: "operations",
    answer:
      `Nu am găsit ${kind === "client" ? "clientul" : "lucrarea"} „${value}” în această firmă. Încearcă numele exact sau o parte mai distinctivă.`,
    facts: [{ label: "Căutare", value }],
    actions: [
      {
        kind: "open_module",
        label: kind === "client" ? "Deschide Clienți" : "Deschide Lucrări",
        moduleId: kind === "client" ? "leads" : "tasks",
      },
    ],
    generatedBy: "orbyven_core",
  };
}

async function clientOverview(
  actor: BillingActor,
  available: Set<OrbyvenModuleId>,
  entity: ClientRow,
  scope: EntityQuestionScope
): Promise<IntelligenceResponse> {
  const db = createBillingServiceClient(actor);
  const canFinance = FINANCE_ROLES.has(actor.role) && available.has("expenses");
  const nowIso = new Date().toISOString();

  const [
    tasksResult,
    estimatesResult,
    eventsResult,
    documentsResult,
    activityResult,
    expenseResult,
    incomeResult,
    invoicesResult,
  ] = await Promise.all([
    available.has("tasks")
      ? db
          .from("ops_tasks")
          .select("id,title,kind,status,priority,client_id,assignee,location,scheduled_at,due_at,progress,updated_at")
          .eq("organization_id", actor.organizationId)
          .eq("client_id", entity.id)
          .order("updated_at", { ascending: false })
          .limit(80)
      : Promise.resolve({ data: [], error: null }),
    available.has("estimates")
      ? db
          .from("sales_estimates")
          .select("id,reference,title,status,total_cents,currency,valid_until,client_id,task_id,updated_at")
          .eq("organization_id", actor.organizationId)
          .eq("client_id", entity.id)
          .order("updated_at", { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [], error: null }),
    available.has("calendar")
      ? db
          .from("calendar_events")
          .select("id,title,status,start_at,client_id,task_id")
          .eq("organization_id", actor.organizationId)
          .eq("client_id", entity.id)
          .neq("status", "cancelled")
          .gte("start_at", nowIso)
          .order("start_at")
          .limit(30)
      : Promise.resolve({ data: [], error: null }),
    available.has("documents")
      ? db
          .from("ops_documents")
          .select("id,name,client_id,task_id,estimate_id,created_at")
          .eq("organization_id", actor.organizationId)
          .eq("client_id", entity.id)
          .order("created_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [], error: null }),
    db
      .from("crm_lead_activities")
      .select("id,kind,occurred_at")
      .eq("organization_id", actor.organizationId)
      .eq("lead_id", entity.id)
      .order("occurred_at", { ascending: false })
      .limit(20),
    canFinance
      ? db
          .from("finance_expenses")
          .select("amount_cents,currency")
          .eq("organization_id", actor.organizationId)
          .eq("client_id", entity.id)
          .limit(200)
      : Promise.resolve({ data: [], error: null }),
    canFinance
      ? db
          .from("finance_income_entries")
          .select("amount_cents,currency,commercial_document_id")
          .eq("organization_id", actor.organizationId)
          .eq("client_id", entity.id)
          .limit(200)
      : Promise.resolve({ data: [], error: null }),
    canFinance
      ? db
          .from("sales_commercial_documents")
          .select("id,reference,status,total_cents,currency,due_on,client_id,task_id")
          .eq("organization_id", actor.organizationId)
          .eq("client_id", entity.id)
          .eq("document_type", "invoice_draft")
          .neq("status", "cancelled")
          .limit(100)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const result of [
    tasksResult,
    estimatesResult,
    eventsResult,
    documentsResult,
    activityResult,
    expenseResult,
    incomeResult,
    invoicesResult,
  ]) {
    if (result.error) throw result.error;
  }

  const tasks = (tasksResult.data ?? []) as WorkRow[];
  const estimates = (estimatesResult.data ?? []) as EstimateRow[];
  const events = (eventsResult.data ?? []) as EventRow[];
  const documents = (documentsResult.data ?? []) as DocumentRow[];
  const activities = (activityResult.data ?? []) as Array<{ id: string; kind: string; occurred_at: string }>;
  const openTasks = tasks.filter((row) => !CLOSED_WORK.has(row.status));
  const activeEstimates = estimates.filter((row) => !CLOSED_ESTIMATE.has(row.status));
  const nextEvent = events[0] ?? null;
  const name = displayClient(entity);

  const facts: Array<{ label: string; value: string }> = [
    { label: "Client", value: name },
    { label: "Lucrări active", value: String(openTasks.length) },
    { label: "Oferte active", value: String(activeEstimates.length) },
    { label: "Documente", value: String(documents.length) },
    { label: "Ultimul contact", value: entity.last_contact_at ? formatDate(entity.last_contact_at) : (activities[0] ? formatDate(activities[0].occurred_at) : "—") },
  ];

  let financeSentence = "";
  let expensesCents = 0;
  let incomeCents = 0;
  let outstandingCents = 0;
  if (canFinance) {
    const expenseRows = (expenseResult.data ?? []) as Array<{ amount_cents: number; currency: string }>;
    const incomeRows = (incomeResult.data ?? []) as Array<{ amount_cents: number; currency: string; commercial_document_id: string | null }>;
    const invoices = (invoicesResult.data ?? []) as InvoiceRow[];
    const paidByInvoice = new Map<string, number>();
    for (const row of incomeRows) {
      if (!row.commercial_document_id || row.currency !== "RON") continue;
      paidByInvoice.set(
        row.commercial_document_id,
        (paidByInvoice.get(row.commercial_document_id) ?? 0) + Number(row.amount_cents || 0)
      );
    }
    expensesCents = expenseRows
      .filter((row) => row.currency === "RON")
      .reduce((sum, row) => sum + Number(row.amount_cents || 0), 0);
    incomeCents = incomeRows
      .filter((row) => row.currency === "RON")
      .reduce((sum, row) => sum + Number(row.amount_cents || 0), 0);
    outstandingCents = invoices
      .filter((row) => row.currency === "RON")
      .reduce(
        (sum, row) =>
          sum + Math.max(0, Number(row.total_cents || 0) - (paidByInvoice.get(row.id) ?? 0)),
        0
      );

    facts.push(
      { label: "Încasat", value: ron(incomeCents) },
      { label: "Costuri", value: ron(expensesCents) },
      { label: "De încasat", value: ron(outstandingCents) }
    );
    financeSentence = outstandingCents > 0 ? ` Financiar, mai sunt ${ron(outstandingCents)} de încasat.` : "";
  }

  if (scope === "finance") {
    if (!available.has("expenses")) {
      return {
        specialist: "finance",
        answer: `Modulul Finanțe nu este activ pentru ${name}.`,
        facts: [{ label: "Client", value: name }],
        actions: [{ kind: "open_module", label: "Deschide clientul", moduleId: "leads", recordId: entity.id }],
        generatedBy: "orbyven_core",
      };
    }
    if (!FINANCE_ROLES.has(actor.role)) {
      return {
        specialist: "finance",
        answer: "Rolul tău nu are acces la contextul financiar al acestui client.",
        facts: [{ label: "Client", value: name }],
        actions: [{ kind: "open_module", label: "Deschide clientul", moduleId: "leads", recordId: entity.id }],
        generatedBy: "orbyven_core",
      };
    }
    return {
      specialist: "finance",
      answer: `${name}: încasat ${ron(incomeCents)}, costuri înregistrate ${ron(expensesCents)}, de încasat ${ron(outstandingCents)}.`,
      facts: [
        { label: "Client", value: name },
        { label: "Încasat", value: ron(incomeCents) },
        { label: "Costuri", value: ron(expensesCents) },
        { label: "De încasat", value: ron(outstandingCents) },
      ],
      actions: [
        { kind: "open_module", label: "Deschide Finanțe", moduleId: "expenses", clientId: entity.id },
        { kind: "open_module", label: "Deschide clientul", moduleId: "leads", recordId: entity.id },
      ],
      generatedBy: "orbyven_core",
    };
  }

  if (scope === "estimates") {
    if (!available.has("estimates")) {
      return {
        specialist: "operations",
        answer: "Modulul Oferte & devize nu este activ în acest workspace.",
        facts: [{ label: "Client", value: name }],
        actions: [{ kind: "open_module", label: "Deschide clientul", moduleId: "leads", recordId: entity.id }],
        generatedBy: "orbyven_core",
      };
    }
    const latest = estimates[0] ?? null;
    return {
      specialist: "operations",
      answer: latest
        ? `${name} are ${estimates.length} devize în context; cel mai recent este ${latest.reference}, status ${latest.status}, valoare ${latest.currency === "RON" ? ron(latest.total_cents) : latest.total_cents / 100 + " " + latest.currency}.`
        : `${name} nu are încă devize înregistrate.`,
      facts: [
        { label: "Client", value: name },
        { label: "Devize", value: String(estimates.length) },
        { label: "Active", value: String(activeEstimates.length) },
        ...(latest ? [{ label: "Ultimul", value: latest.reference }, { label: "Status", value: latest.status }] : []),
      ],
      actions: [
        ...(latest ? [{
          kind: "open_module" as const,
          label: latest.reference,
          moduleId: "estimates" as const,
          recordId: latest.id,
          clientId: entity.id,
          taskId: latest.task_id ?? undefined,
          estimateId: latest.id,
        }] : []),
        { kind: "open_module" as const, label: "Deschide clientul", moduleId: "leads" as const, recordId: entity.id },
      ],
      generatedBy: "orbyven_core",
    };
  }

  if (scope === "calendar") {
    if (!available.has("calendar")) {
      return {
        specialist: "operations",
        answer: "Modulul Calendar nu este activ în acest workspace.",
        facts: [{ label: "Client", value: name }],
        actions: [{ kind: "open_module", label: "Deschide clientul", moduleId: "leads", recordId: entity.id }],
        generatedBy: "orbyven_core",
      };
    }
    return {
      specialist: "operations",
      answer: nextEvent
        ? `Următoarea programare pentru ${name} este „${nextEvent.title}”, ${formatDateTime(nextEvent.start_at)}.`
        : `${name} nu are programări viitoare în calendar.`,
      facts: [
        { label: "Client", value: name },
        { label: "Programări viitoare", value: String(events.length) },
        ...(nextEvent ? [{ label: "Următoarea", value: formatDateTime(nextEvent.start_at) }] : []),
      ],
      actions: [
        ...(nextEvent ? [{
          kind: "open_module" as const,
          label: "Deschide programarea",
          moduleId: "calendar" as const,
          recordId: nextEvent.id,
          clientId: entity.id,
          taskId: nextEvent.task_id ?? undefined,
        }] : []),
        { kind: "open_module" as const, label: "Deschide clientul", moduleId: "leads" as const, recordId: entity.id },
      ],
      generatedBy: "orbyven_core",
    };
  }

  if (scope === "documents") {
    if (!available.has("documents")) {
      return {
        specialist: "documents",
        answer: "Modulul Documente nu este activ în acest workspace.",
        facts: [{ label: "Client", value: name }],
        actions: [{ kind: "open_module", label: "Deschide clientul", moduleId: "leads", recordId: entity.id }],
        generatedBy: "orbyven_core",
      };
    }
    const latest = documents[0] ?? null;
    return {
      specialist: "documents",
      answer: latest
        ? `${name} are ${documents.length} documente în context; cel mai recent este „${latest.name}”.`
        : `${name} nu are documente legate în workspace.`,
      facts: [
        { label: "Client", value: name },
        { label: "Documente", value: String(documents.length) },
        ...(latest ? [{ label: "Cel mai recent", value: latest.name }] : []),
      ],
      actions: [
        ...(latest ? [{
          kind: "open_module" as const,
          label: latest.name,
          moduleId: "documents" as const,
          recordId: latest.id,
          taskId: latest.task_id ?? undefined,
        }] : []),
        { kind: "open_module" as const, label: "Deschide clientul", moduleId: "leads" as const, recordId: entity.id },
      ],
      generatedBy: "orbyven_core",
    };
  }

  if (scope === "history") {
    const last = activities[0] ?? null;
    const completed = tasks.filter((row) => row.status === "done");
    return {
      specialist: "operations",
      answer: last
        ? `Ultima activitate pentru ${name}: ${activityLabel(last.kind)}, ${formatDateTime(last.occurred_at)}. În context sunt ${completed.length} lucrări finalizate.`
        : `Nu există activități CRM recente pentru ${name}. În context sunt ${completed.length} lucrări finalizate.`,
      facts: [
        { label: "Client", value: name },
        { label: "Activități recente", value: String(activities.length) },
        { label: "Lucrări finalizate", value: String(completed.length) },
        ...(last ? [{ label: "Ultima activitate", value: activityLabel(last.kind) + " · " + formatDateTime(last.occurred_at) }] : []),
      ],
      actions: [
        { kind: "open_module" as const, label: "Deschide clientul", moduleId: "leads" as const, recordId: entity.id },
        ...(completed[0] ? [{
          kind: "open_module" as const,
          label: completed[0].title,
          moduleId: "tasks" as const,
          recordId: completed[0].id,
          clientId: entity.id,
          taskId: completed[0].id,
        }] : []),
      ],
      generatedBy: "orbyven_core",
    };
  }

  const actions = [
    { kind: "open_module" as const, label: "Deschide clientul", moduleId: "leads" as const, recordId: entity.id },
    ...(openTasks[0] && available.has("tasks")
      ? [{
          kind: "open_module" as const,
          label: openTasks[0].title,
          moduleId: "tasks" as const,
          recordId: openTasks[0].id,
          clientId: entity.id,
          taskId: openTasks[0].id,
        }]
      : []),
    ...(activeEstimates[0] && available.has("estimates")
      ? [{
          kind: "open_module" as const,
          label: activeEstimates[0].reference,
          moduleId: "estimates" as const,
          recordId: activeEstimates[0].id,
          clientId: entity.id,
          taskId: activeEstimates[0].task_id ?? undefined,
          estimateId: activeEstimates[0].id,
        }]
      : []),
    ...(nextEvent && available.has("calendar")
      ? [{
          kind: "open_module" as const,
          label: "Următoarea programare",
          moduleId: "calendar" as const,
          recordId: nextEvent.id,
          clientId: entity.id,
          taskId: nextEvent.task_id ?? undefined,
        }]
      : []),
  ].slice(0, 4);

  return {
    specialist: "operations",
    answer:
      `${name}: ${openTasks.length} lucrări active, ${activeEstimates.length} oferte active și ${documents.length} documente legate.` +
      (nextEvent ? ` Următoarea programare este ${formatDateTime(nextEvent.start_at)}.` : "") +
      financeSentence,
    facts: facts.slice(0, 9),
    actions,
    generatedBy: "orbyven_core",
  };
}

async function workOverview(
  actor: BillingActor,
  available: Set<OrbyvenModuleId>,
  entity: WorkRow,
  scope: EntityQuestionScope
): Promise<IntelligenceResponse> {
  const db = createBillingServiceClient(actor);
  const canFinance = FINANCE_ROLES.has(actor.role) && available.has("expenses");
  const nowIso = new Date().toISOString();

  const [
    clientResult,
    estimatesResult,
    eventsResult,
    documentsResult,
    expenseResult,
    incomeResult,
    invoicesResult,
  ] = await Promise.all([
      entity.client_id
        ? db
            .from("crm_leads")
            .select("id,kind,stage,name,company,email,phone,last_contact_at,next_follow_up_at,updated_at")
            .eq("organization_id", actor.organizationId)
            .eq("id", entity.client_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      available.has("estimates")
        ? db
            .from("sales_estimates")
            .select("id,reference,title,status,total_cents,currency,valid_until,client_id,task_id,updated_at")
            .eq("organization_id", actor.organizationId)
            .eq("task_id", entity.id)
            .order("updated_at", { ascending: false })
            .limit(30)
        : Promise.resolve({ data: [], error: null }),
      available.has("calendar")
        ? db
            .from("calendar_events")
            .select("id,title,status,start_at,client_id,task_id")
            .eq("organization_id", actor.organizationId)
            .eq("task_id", entity.id)
            .neq("status", "cancelled")
            .gte("start_at", nowIso)
            .order("start_at")
            .limit(30)
        : Promise.resolve({ data: [], error: null }),
      available.has("documents")
        ? db
            .from("ops_documents")
            .select("id,name,client_id,task_id,estimate_id,created_at")
            .eq("organization_id", actor.organizationId)
            .eq("task_id", entity.id)
            .order("created_at", { ascending: false })
            .limit(30)
        : Promise.resolve({ data: [], error: null }),
      canFinance
        ? db
            .from("finance_expenses")
            .select("amount_cents,currency")
            .eq("organization_id", actor.organizationId)
            .eq("task_id", entity.id)
            .limit(200)
        : Promise.resolve({ data: [], error: null }),
      canFinance
        ? db
            .from("finance_income_entries")
            .select("amount_cents,currency,commercial_document_id")
            .eq("organization_id", actor.organizationId)
            .eq("task_id", entity.id)
            .limit(200)
        : Promise.resolve({ data: [], error: null }),
      canFinance
        ? db
            .from("sales_commercial_documents")
            .select("id,reference,status,total_cents,currency,due_on,client_id,task_id")
            .eq("organization_id", actor.organizationId)
            .eq("task_id", entity.id)
            .eq("document_type", "invoice_draft")
            .neq("status", "cancelled")
            .limit(100)
        : Promise.resolve({ data: [], error: null }),
    ]);

  for (const result of [
    clientResult,
    estimatesResult,
    eventsResult,
    documentsResult,
    expenseResult,
    incomeResult,
    invoicesResult,
  ]) {
    if (result.error) throw result.error;
  }

  const client = clientResult.data as ClientRow | null;
  const estimates = (estimatesResult.data ?? []) as EstimateRow[];
  const events = (eventsResult.data ?? []) as EventRow[];
  const documents = (documentsResult.data ?? []) as DocumentRow[];
  const nextEvent = events.find((row) => row.start_at >= nowIso) ?? null;
  const latestEstimate = estimates[0] ?? null;
  const facts: Array<{ label: string; value: string }> = [
    { label: "Lucrare", value: entity.title },
    { label: "Status", value: entity.status },
    { label: "Progres", value: `${Number(entity.progress || 0)}%` },
    { label: "Responsabil", value: entity.assignee?.trim() || "Nealocat" },
    { label: "Termen", value: formatDateTime(entity.due_at) },
    { label: "Devize", value: String(estimates.length) },
    { label: "Documente", value: String(documents.length) },
  ];

  let financeSentence = "";
  let costs = 0;
  let incomeCents = 0;
  let outstandingCents = 0;
  if (canFinance) {
    const expenseRows = (expenseResult.data ?? []) as Array<{ amount_cents: number; currency: string }>;
    const incomeRows = (incomeResult.data ?? []) as Array<{ amount_cents: number; currency: string; commercial_document_id: string | null }>;
    const invoices = (invoicesResult.data ?? []) as InvoiceRow[];
    const paidByInvoice = new Map<string, number>();

    for (const row of incomeRows) {
      if (!row.commercial_document_id || row.currency !== "RON") continue;
      paidByInvoice.set(
        row.commercial_document_id,
        (paidByInvoice.get(row.commercial_document_id) ?? 0) + Number(row.amount_cents || 0)
      );
    }

    costs = expenseRows
      .filter((row) => row.currency === "RON")
      .reduce((sum, row) => sum + Number(row.amount_cents || 0), 0);
    incomeCents = incomeRows
      .filter((row) => row.currency === "RON")
      .reduce((sum, row) => sum + Number(row.amount_cents || 0), 0);
    outstandingCents = invoices
      .filter((row) => row.currency === "RON")
      .reduce(
        (sum, row) =>
          sum + Math.max(0, Number(row.total_cents || 0) - (paidByInvoice.get(row.id) ?? 0)),
        0
      );

    facts.push(
      { label: "Încasat", value: ron(incomeCents) },
      { label: "Costuri înregistrate", value: ron(costs) },
      { label: "De încasat", value: ron(outstandingCents) }
    );
    financeSentence = costs > 0 ? ` Costurile financiare înregistrate sunt ${ron(costs)}.` : "";
  }

  if (scope === "finance") {
    if (!available.has("expenses")) {
      return {
        specialist: "finance",
        answer: "Modulul Finanțe nu este activ în acest workspace.",
        facts: [{ label: "Lucrare", value: entity.title }],
        actions: [{
          kind: "open_module",
          label: "Deschide lucrarea",
          moduleId: "tasks",
          recordId: entity.id,
          clientId: entity.client_id ?? undefined,
          taskId: entity.id,
        }],
        generatedBy: "orbyven_core",
      };
    }
    if (!FINANCE_ROLES.has(actor.role)) {
      return {
        specialist: "finance",
        answer: "Rolul tău nu are acces la contextul financiar al acestei lucrări.",
        facts: [{ label: "Lucrare", value: entity.title }],
        actions: [{
          kind: "open_module",
          label: "Deschide lucrarea",
          moduleId: "tasks",
          recordId: entity.id,
          clientId: entity.client_id ?? undefined,
          taskId: entity.id,
        }],
        generatedBy: "orbyven_core",
      };
    }
    return {
      specialist: "finance",
      answer: `„${entity.title}”: încasat ${ron(incomeCents)}, costuri înregistrate ${ron(costs)}, de încasat ${ron(outstandingCents)}.`,
      facts: [
        { label: "Lucrare", value: entity.title },
        { label: "Încasat", value: ron(incomeCents) },
        { label: "Costuri", value: ron(costs) },
        { label: "De încasat", value: ron(outstandingCents) },
      ],
      actions: [
        {
          kind: "open_module",
          label: "Deschide Finanțe",
          moduleId: "expenses",
          clientId: entity.client_id ?? undefined,
          taskId: entity.id,
        },
        {
          kind: "open_module",
          label: "Deschide lucrarea",
          moduleId: "tasks",
          recordId: entity.id,
          clientId: entity.client_id ?? undefined,
          taskId: entity.id,
        },
      ],
      generatedBy: "orbyven_core",
    };
  }

  if (scope === "estimates") {
    if (!available.has("estimates")) {
      return {
        specialist: "operations",
        answer: "Modulul Oferte & devize nu este activ în acest workspace.",
        facts: [{ label: "Lucrare", value: entity.title }],
        actions: [{
          kind: "open_module",
          label: "Deschide lucrarea",
          moduleId: "tasks",
          recordId: entity.id,
          taskId: entity.id,
        }],
        generatedBy: "orbyven_core",
      };
    }
    return {
      specialist: "operations",
      answer: latestEstimate
        ? `„${entity.title}” are ${estimates.length} devize în context; cel mai recent este ${latestEstimate.reference}, status ${latestEstimate.status}, valoare ${latestEstimate.currency === "RON" ? ron(latestEstimate.total_cents) : latestEstimate.total_cents / 100 + " " + latestEstimate.currency}.`
        : `„${entity.title}” nu are încă devize înregistrate.`,
      facts: [
        { label: "Lucrare", value: entity.title },
        { label: "Devize", value: String(estimates.length) },
        ...(latestEstimate ? [
          { label: "Ultimul", value: latestEstimate.reference },
          { label: "Status", value: latestEstimate.status },
        ] : []),
      ],
      actions: [
        ...(latestEstimate ? [{
          kind: "open_module" as const,
          label: latestEstimate.reference,
          moduleId: "estimates" as const,
          recordId: latestEstimate.id,
          clientId: latestEstimate.client_id ?? undefined,
          taskId: entity.id,
          estimateId: latestEstimate.id,
        }] : []),
        {
          kind: "open_module" as const,
          label: "Deschide lucrarea",
          moduleId: "tasks" as const,
          recordId: entity.id,
          clientId: entity.client_id ?? undefined,
          taskId: entity.id,
        },
      ],
      generatedBy: "orbyven_core",
    };
  }

  if (scope === "calendar") {
    if (!available.has("calendar")) {
      return {
        specialist: "operations",
        answer: "Modulul Calendar nu este activ în acest workspace.",
        facts: [{ label: "Lucrare", value: entity.title }],
        actions: [{
          kind: "open_module",
          label: "Deschide lucrarea",
          moduleId: "tasks",
          recordId: entity.id,
          taskId: entity.id,
        }],
        generatedBy: "orbyven_core",
      };
    }
    return {
      specialist: "operations",
      answer: nextEvent
        ? `Următoarea programare pentru „${entity.title}” este „${nextEvent.title}”, ${formatDateTime(nextEvent.start_at)}.`
        : `„${entity.title}” nu are programări viitoare în calendar.`,
      facts: [
        { label: "Lucrare", value: entity.title },
        { label: "Programări viitoare", value: String(events.length) },
        ...(nextEvent ? [{ label: "Următoarea", value: formatDateTime(nextEvent.start_at) }] : []),
      ],
      actions: [
        ...(nextEvent ? [{
          kind: "open_module" as const,
          label: "Deschide programarea",
          moduleId: "calendar" as const,
          recordId: nextEvent.id,
          clientId: nextEvent.client_id ?? undefined,
          taskId: entity.id,
        }] : []),
        {
          kind: "open_module" as const,
          label: "Deschide lucrarea",
          moduleId: "tasks" as const,
          recordId: entity.id,
          clientId: entity.client_id ?? undefined,
          taskId: entity.id,
        },
      ],
      generatedBy: "orbyven_core",
    };
  }

  if (scope === "documents") {
    if (!available.has("documents")) {
      return {
        specialist: "documents",
        answer: "Modulul Documente nu este activ în acest workspace.",
        facts: [{ label: "Lucrare", value: entity.title }],
        actions: [{
          kind: "open_module",
          label: "Deschide lucrarea",
          moduleId: "tasks",
          recordId: entity.id,
          taskId: entity.id,
        }],
        generatedBy: "orbyven_core",
      };
    }
    const latestDocument = documents[0] ?? null;
    return {
      specialist: "documents",
      answer: latestDocument
        ? `„${entity.title}” are ${documents.length} documente în context; cel mai recent este „${latestDocument.name}”.`
        : `„${entity.title}” nu are documente legate.`,
      facts: [
        { label: "Lucrare", value: entity.title },
        { label: "Documente", value: String(documents.length) },
        ...(latestDocument ? [{ label: "Cel mai recent", value: latestDocument.name }] : []),
      ],
      actions: [
        ...(latestDocument ? [{
          kind: "open_module" as const,
          label: latestDocument.name,
          moduleId: "documents" as const,
          recordId: latestDocument.id,
          taskId: entity.id,
        }] : []),
        {
          kind: "open_module" as const,
          label: "Deschide lucrarea",
          moduleId: "tasks" as const,
          recordId: entity.id,
          clientId: entity.client_id ?? undefined,
          taskId: entity.id,
        },
      ],
      generatedBy: "orbyven_core",
    };
  }

  if (scope === "history") {
    return {
      specialist: "operations",
      answer:
        `„${entity.title}” este ${entity.status}, la ${Number(entity.progress || 0)}% progres. Ultima actualizare a fost ${formatDateTime(entity.updated_at)}; sunt ${events.length} programări viitoare și ${documents.length} documente legate.`,
      facts: [
        { label: "Lucrare", value: entity.title },
        { label: "Ultima actualizare", value: formatDateTime(entity.updated_at) },
        { label: "Status", value: entity.status },
        { label: "Progres", value: `${Number(entity.progress || 0)}%` },
        { label: "Programări viitoare", value: String(events.length) },
        { label: "Documente", value: String(documents.length) },
      ],
      actions: [{
        kind: "open_module",
        label: "Deschide lucrarea",
        moduleId: "tasks",
        recordId: entity.id,
        clientId: entity.client_id ?? undefined,
        taskId: entity.id,
      }],
      generatedBy: "orbyven_core",
    };
  }

  const actions = [
    {
      kind: "open_module" as const,
      label: "Deschide lucrarea",
      moduleId: "tasks" as const,
      recordId: entity.id,
      clientId: entity.client_id ?? undefined,
      taskId: entity.id,
    },
    ...(client && available.has("leads")
      ? [{
          kind: "open_module" as const,
          label: displayClient(client),
          moduleId: "leads" as const,
          recordId: client.id,
        }]
      : []),
    ...(latestEstimate && available.has("estimates")
      ? [{
          kind: "open_module" as const,
          label: latestEstimate.reference,
          moduleId: "estimates" as const,
          recordId: latestEstimate.id,
          clientId: latestEstimate.client_id ?? undefined,
          taskId: entity.id,
          estimateId: latestEstimate.id,
        }]
      : []),
    ...(nextEvent && available.has("calendar")
      ? [{
          kind: "open_module" as const,
          label: "Următoarea programare",
          moduleId: "calendar" as const,
          recordId: nextEvent.id,
          clientId: nextEvent.client_id ?? undefined,
          taskId: entity.id,
        }]
      : []),
  ].slice(0, 4);

  return {
    specialist: "operations",
    answer:
      `„${entity.title}” este ${entity.status}, la ${Number(entity.progress || 0)}% progres, ${entity.assignee?.trim() ? `responsabil ${entity.assignee}` : "fără responsabil"}.` +
      (client ? ` Client: ${displayClient(client)}.` : "") +
      (nextEvent ? ` Următoarea programare este ${formatDateTime(nextEvent.start_at)}.` : "") +
      financeSentence,
    facts: facts.slice(0, 9),
    actions,
    generatedBy: "orbyven_core",
  };
}

export async function answerEntityIntelligenceQuery(
  actor: BillingActor,
  available: Set<OrbyvenModuleId>,
  prompt: string
): Promise<IntelligenceResponse | null> {
  const query = detectEntityIntelligenceQuery(prompt);
  if (!query) return null;
  const scope = detectEntityQuestionScope(prompt);

  if (query.kind === "client") {
    if (!available.has("leads")) return unavailableEntityModule("client");
    const candidates = await findClientCandidates(actor, query.value);
    if (!candidates.length) return missingResponse("client", query.value);
    if (candidates.length > 1) {
      return ambiguityResponse(
        "client",
        candidates.map((row) => ({ id: row.id, label: displayClient(row) }))
      );
    }
    return clientOverview(actor, available, candidates[0], scope);
  }

  if (!available.has("tasks")) return unavailableEntityModule("work");
  const candidates = await findWorkCandidates(actor, query.value);
  if (!candidates.length) return missingResponse("work", query.value);
  if (candidates.length > 1) {
    return ambiguityResponse(
      "work",
      candidates.map((row) => ({ id: row.id, label: row.title }))
    );
  }
  return workOverview(actor, available, candidates[0], scope);
}
