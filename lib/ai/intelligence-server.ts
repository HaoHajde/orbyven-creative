import { authenticateBillingActor, createBillingServiceClient, type BillingActor } from "@/lib/billing/supabase-server";
import { readAllPages } from "@/lib/modules/paged-read";
import { routeIntelligencePrompt } from "@/lib/ai/intelligence-router";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type {
  IntelligenceAction,
  IntelligenceResponse,
  IntelligenceSpecialist,
} from "@/lib/ai/intelligence-types";

const OPEN_TASKS = '("done","cancelled")';
const OPEN_LEADS = '("won","lost")';
const FINANCE_ROLES = new Set(["owner", "admin", "manager"]);
const DAY_MS = 86400000;

function ron(cents: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function todayKey(timeZone = "Europe/Bucharest") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function monthRange(timeZone = "Europe/Bucharest") {
  const today = todayKey(timeZone);
  const [year, month] = today.split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return [
    `${year}-${String(month).padStart(2, "0")}-01`,
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
  ] as const;
}

async function count(query: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  const { count: value, error } = await query;
  if (error) throw error;
  if (value === null) throw new Error("COUNT_UNAVAILABLE");
  return value;
}

async function loadAvailableModules(actor: BillingActor): Promise<Set<OrbyvenModuleId>> {
  const client = createBillingServiceClient();
  const [modulesResult, entitlementsResult] = await Promise.all([
    client.from("organization_modules")
      .select("module_id,enabled")
      .eq("organization_id", actor.organizationId)
      .eq("enabled", true),
    client.from("organization_entitlements")
      .select("module_id,enabled,starts_at,ends_at")
      .eq("organization_id", actor.organizationId)
      .eq("enabled", true),
  ]);
  if (modulesResult.error) throw modulesResult.error;
  if (entitlementsResult.error) throw entitlementsResult.error;

  const now = Date.now();
  const entitled = new Set(
    (entitlementsResult.data ?? [])
      .filter((row) =>
        (!row.starts_at || new Date(row.starts_at).getTime() <= now) &&
        (!row.ends_at || new Date(row.ends_at).getTime() > now))
      .map((row) => row.module_id as OrbyvenModuleId)
  );
  const available = new Set<OrbyvenModuleId>(["overview"]);
  for (const row of modulesResult.data ?? []) {
    const moduleId = row.module_id as OrbyvenModuleId;
    if (entitled.has(moduleId)) available.add(moduleId);
  }
  return available;
}

async function operationsResponse(actor: BillingActor, available: Set<OrbyvenModuleId>): Promise<IntelligenceResponse> {
  const client = createBillingServiceClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const tomorrowIso = new Date(now.getTime() + DAY_MS).toISOString();

  const [
    openTasks,
    activeLeads,
    sentEstimates,
    overdueTasks,
    urgentTasks,
    followUps,
    nextEvents,
  ] = await Promise.all([
    available.has("tasks")
      ? count(client.from("ops_tasks").select("id", { count: "exact", head: true })
          .eq("organization_id", actor.organizationId).not("status", "in", OPEN_TASKS))
      : Promise.resolve(0),
    available.has("leads")
      ? count(client.from("crm_leads").select("id", { count: "exact", head: true })
          .eq("organization_id", actor.organizationId).eq("kind", "lead").not("stage", "in", OPEN_LEADS))
      : Promise.resolve(0),
    available.has("estimates")
      ? count(client.from("sales_estimates").select("id", { count: "exact", head: true })
          .eq("organization_id", actor.organizationId).eq("status", "sent"))
      : Promise.resolve(0),
    available.has("tasks") ? client.from("ops_tasks")
      .select("id,title,due_at,priority,status,client_id")
      .eq("organization_id", actor.organizationId)
      .not("status", "in", OPEN_TASKS)
      .lt("due_at", nowIso)
      .order("due_at", { ascending: true })
      .limit(5) : Promise.resolve({ data: [], error: null }),
    available.has("tasks") ? client.from("ops_tasks")
      .select("id,title,due_at,priority,status,client_id")
      .eq("organization_id", actor.organizationId)
      .not("status", "in", OPEN_TASKS)
      .eq("priority", "urgent")
      .order("updated_at", { ascending: false })
      .limit(5) : Promise.resolve({ data: [], error: null }),
    available.has("leads") ? client.from("crm_leads")
      .select("id,name,next_follow_up_at")
      .eq("organization_id", actor.organizationId)
      .eq("kind", "lead")
      .not("stage", "in", OPEN_LEADS)
      .not("next_follow_up_at", "is", null)
      .lte("next_follow_up_at", tomorrowIso)
      .order("next_follow_up_at")
      .limit(5) : Promise.resolve({ data: [], error: null }),
    available.has("calendar") ? client.from("calendar_events")
      .select("id,title,start_at,client_id,task_id")
      .eq("organization_id", actor.organizationId)
      .neq("status", "cancelled")
      .gte("start_at", nowIso)
      .lte("start_at", tomorrowIso)
      .order("start_at")
      .limit(5) : Promise.resolve({ data: [], error: null }),
  ]);

  for (const result of [overdueTasks, urgentTasks, followUps, nextEvents]) {
    if (result.error) throw result.error;
  }

  const overdue = overdueTasks.data ?? [];
  const urgent = urgentTasks.data ?? [];
  const follow = followUps.data ?? [];
  const events = nextEvents.data ?? [];
  const attention = overdue.length + urgent.length + follow.length;

  const actions: IntelligenceAction[] = [];
  if (available.has("tasks")) actions.push({ kind: "open_module", label: "Deschide lucrările", moduleId: "tasks" });
  if (available.has("calendar")) actions.push({ kind: "open_module", label: "Vezi calendarul", moduleId: "calendar" });
  if (follow.length && available.has("leads")) actions.unshift({ kind: "open_module", label: "Vezi follow-up-urile", moduleId: "leads" });

  return {
    specialist: "operations",
    answer: attention
      ? `Ai ${attention} elemente care merită atenție imediată. Sunt ${openTasks} lucrări deschise, ${activeLeads} lead-uri active și ${sentEstimates} oferte trimise.`
      : `Nu văd blocaje urgente în datele apropiate. Ai ${openTasks} lucrări deschise, ${activeLeads} lead-uri active și ${sentEstimates} oferte trimise.`,
    facts: [
      { label: "Lucrări deschise", value: String(openTasks) },
      { label: "Întârziate", value: String(overdue.length) },
      { label: "Follow-up-uri apropiate", value: String(follow.length) },
      { label: "Programări 24h", value: String(events.length) },
    ],
    actions,
    generatedBy: "orbyven_core",
  };
}

async function financeResponse(actor: BillingActor, available: Set<OrbyvenModuleId>): Promise<IntelligenceResponse> {
  if (!available.has("expenses")) {
    return {
      specialist: "finance",
      answer: "Modulul Finanțe nu este activ în acest workspace.",
      facts: [], actions: [], generatedBy: "orbyven_core",
    };
  }
  if (!FINANCE_ROLES.has(actor.role)) {
    return {
      specialist: "finance",
      answer: "Rolul tău nu are acces la datele financiare ale firmei.",
      facts: [],
      actions: [],
      generatedBy: "orbyven_core",
    };
  }

  const client = createBillingServiceClient();
  const [monthStart, nextMonthStart] = monthRange();
  const today = todayKey();

  const [expenses, income, invoices, receiptRows] = await Promise.all([
    readAllPages<{ amount_cents: number }>((from, to) =>
      client.from("finance_expenses")
        .select("amount_cents")
        .eq("organization_id", actor.organizationId)
        .eq("currency", "RON")
        .gte("occurred_on", monthStart)
        .lt("occurred_on", nextMonthStart)
        .order("occurred_on")
        .order("id")
        .range(from, to)),
    readAllPages<{ amount_cents: number }>((from, to) =>
      client.from("finance_income_entries")
        .select("amount_cents")
        .eq("organization_id", actor.organizationId)
        .eq("currency", "RON")
        .gte("occurred_on", monthStart)
        .lt("occurred_on", nextMonthStart)
        .order("occurred_on")
        .order("id")
        .range(from, to)),
    readAllPages<{
      id: string;
      reference: string;
      external_reference: string | null;
      title: string;
      total_cents: number;
      currency: string;
      due_on: string | null;
      status: string;
    }>((from, to) =>
      client.from("sales_commercial_documents")
        .select("id,reference,external_reference,title,total_cents,currency,due_on,status")
        .eq("organization_id", actor.organizationId)
        .eq("document_type", "invoice_draft")
        .in("status", ["issued", "paid"])
        .order("due_on")
        .order("id")
        .range(from, to)),
    readAllPages<{ commercial_document_id: string | null; amount_cents: number }>((from, to) =>
      client.from("finance_income_entries")
        .select("commercial_document_id,amount_cents")
        .eq("organization_id", actor.organizationId)
        .not("commercial_document_id", "is", null)
        .order("commercial_document_id")
        .order("id")
        .range(from, to)),
  ]);

  const expenseCents = expenses.reduce((sum, row) => sum + Number(row.amount_cents || 0), 0);
  const incomeCents = income.reduce((sum, row) => sum + Number(row.amount_cents || 0), 0);
  const paid = new Map<string, number>();
  for (const row of receiptRows) {
    if (!row.commercial_document_id) continue;
    paid.set(row.commercial_document_id, (paid.get(row.commercial_document_id) ?? 0) + Number(row.amount_cents || 0));
  }

  const openInvoices = invoices.map((invoice) => ({
    ...invoice,
    outstanding: Math.max(0, Number(invoice.total_cents || 0) - (paid.get(invoice.id) ?? 0)),
  })).filter((invoice) => invoice.outstanding > 0);

  const outstandingCents = openInvoices
    .filter((invoice) => invoice.currency === "RON")
    .reduce((sum, invoice) => sum + invoice.outstanding, 0);
  const overdue = openInvoices.filter((invoice) => invoice.due_on && invoice.due_on < today);

  return {
    specialist: "finance",
    answer: outstandingCents > 0
      ? `Ai ${ron(outstandingCents)} de încasat în RON, dintre care ${overdue.length} documente au scadența depășită. Cashflow-ul operațional al lunii este ${ron(incomeCents - expenseCents)}.`
      : `Nu există sume RON restante în documentele urmărite. Cashflow-ul operațional al lunii este ${ron(incomeCents - expenseCents)}.`,
    facts: [
      { label: "Încasări luna aceasta", value: ron(incomeCents) },
      { label: "Cheltuieli luna aceasta", value: ron(expenseCents) },
      { label: "Cashflow", value: ron(incomeCents - expenseCents) },
      { label: "De încasat", value: ron(outstandingCents) },
    ],
    actions: [{ kind: "open_module", label: "Deschide Finanțe", moduleId: "expenses" }],
    generatedBy: "orbyven_core",
  };
}

async function documentsResponse(actor: BillingActor, available: Set<OrbyvenModuleId>): Promise<IntelligenceResponse> {
  if (!available.has("documents")) {
    return {
      specialist: "documents",
      answer: "Modulul Documente nu este activ în acest workspace.",
      facts: [], actions: [], generatedBy: "orbyven_core",
    };
  }
  const client = createBillingServiceClient();
  const [documentCount, recent] = await Promise.all([
    count(client.from("ops_documents").select("id", { count: "exact", head: true })
      .eq("organization_id", actor.organizationId)),
    client.from("ops_documents")
      .select("id,name,created_at,client_id,task_id")
      .eq("organization_id", actor.organizationId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (recent.error) throw recent.error;

  return {
    specialist: "documents",
    answer: `Firma are ${documentCount} documente în workspace. Îți pot deschide biblioteca și, în etapa următoare, voi putea pregăti documente din contextul clientului și al lucrării.`,
    facts: [
      { label: "Documente", value: String(documentCount) },
      { label: "Recente", value: String(recent.data?.length ?? 0) },
    ],
    actions: [{ kind: "open_module", label: "Deschide Documente", moduleId: "documents" }],
    generatedBy: "orbyven_core",
  };
}

function webDesignResponse(): IntelligenceResponse {
  return {
    specialist: "web_design",
    answer: "Am identificat o cerere de web design. O trimit către Web Design Specialist, motorul ORBYVEN separat pentru structură, layout, culori și copy controlat.",
    facts: [
      { label: "Specialist", value: "Web Design" },
      { label: "Mod", value: "Preview controlat" },
    ],
    actions: [{ kind: "open_path", label: "Deschide Web Design Specialist", href: "/workspace/site-editor" }],
    generatedBy: "orbyven_core",
  };
}

async function generalResponse(actor: BillingActor, available: Set<OrbyvenModuleId>): Promise<IntelligenceResponse> {
  const operations = await operationsResponse(actor, available);
  const canFinance = FINANCE_ROLES.has(actor.role) && available.has("expenses");
  const finance = canFinance ? await financeResponse(actor, available) : null;

  return {
    specialist: "general",
    answer: finance
      ? `${operations.answer} Financiar: ${finance.answer}`
      : operations.answer,
    facts: [...operations.facts.slice(0, 3), ...(finance?.facts.slice(0, 2) ?? [])],
    actions: operations.actions.slice(0, 2),
    generatedBy: "orbyven_core",
  };
}

export async function answerIntelligenceRequest(
  request: Request,
  organizationId: string,
  prompt: string
): Promise<IntelligenceResponse> {
  const actor = await authenticateBillingActor(request, organizationId, false);
  const [intent, available] = await Promise.all([
    Promise.resolve(routeIntelligencePrompt(prompt)),
    loadAvailableModules(actor),
  ]);

  switch (intent.specialist) {
    case "finance":
      return financeResponse(actor, available);
    case "documents":
      return documentsResponse(actor, available);
    case "web_design":
      return webDesignResponse();
    case "operations":
      return operationsResponse(actor, available);
    default:
      return generalResponse(actor, available);
  }
}

export function intelligenceSpecialistLabel(value: IntelligenceSpecialist) {
  return ({
    operations: "Operations",
    finance: "Finance",
    web_design: "Web Design",
    documents: "Documents",
    general: "ORBYVEN Core",
  } as const)[value];
}
