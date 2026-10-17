import { answerAgendaQuery, detectAgendaQuery } from "@/lib/ai/operational-agenda-query";
import { answerTaskQuery, detectTaskQuery } from "@/lib/ai/operational-task-query";
import { createBillingServiceClient, type BillingActor } from "@/lib/billing/supabase-server";
import type { IntelligenceResponse } from "@/lib/ai/intelligence-types";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import { detectOperationalQuery } from "@/lib/ai/operational-query-core";

type LeadRow = {
  id: string;
  name: string;
  stage: string;
  next_follow_up_at: string | null;
};

type EstimateRow = {
  id: string;
  reference: string;
  title: string;
  valid_until: string | null;
  client_id: string | null;
  task_id: string | null;
  updated_at: string;
};

const CLOSED_LEADS = new Set(["won", "lost"]);
const TIME_ZONE = "Europe/Bucharest";

function timezoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour"),
    read("minute"),
    read("second"),
  ) - date.getTime();
}

function localDateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function localMidnightIso(dateKey: string, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const localUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  let instant = new Date(localUtc);
  for (let index = 0; index < 3; index += 1) {
    instant = new Date(localUtc - timezoneOffsetMs(instant, timeZone));
  }
  return instant.toISOString();
}

function nextDateKey(dateKey: string, days = 1) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days, 12));
  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function unavailable(label: string): IntelligenceResponse {
  return {
    specialist: "operations",
    answer: `Nu pot răspunde exact la această întrebare deoarece modulul ${label} nu este activ în workspace.`,
    facts: [],
    actions: [{ kind: "open_module", label: "Vezi overview", moduleId: "overview" }],
    generatedBy: "orbyven_core",
  };
}

async function leadFollowupQuery(actor: BillingActor): Promise<IntelligenceResponse> {
  const client = createBillingServiceClient(actor);
  const today = localDateKey(new Date(), TIME_ZONE);
  const endIso = localMidnightIso(nextDateKey(today), TIME_ZONE);
  const { data, error } = await client
    .from("crm_leads")
    .select("id,name,stage,next_follow_up_at")
    .eq("organization_id", actor.organizationId)
    .eq("kind", "lead")
    .not("next_follow_up_at", "is", null)
    .lt("next_follow_up_at", endIso)
    .order("next_follow_up_at")
    .limit(40);
  if (error) throw error;

  const rows = ((data ?? []) as LeadRow[]).filter((row) => !CLOSED_LEADS.has(row.stage));
  const now = Date.now();
  const overdue = rows.filter((row) => row.next_follow_up_at && new Date(row.next_follow_up_at).getTime() < now);

  return {
    specialist: "operations",
    answer: rows.length
      ? `Ai ${rows.length} follow-up-uri de lead de făcut până la finalul zilei, dintre care ${overdue.length} sunt restante.`
      : "Nu ai follow-up-uri de lead scadente până la finalul zilei.",
    facts: [
      { label: "De contactat", value: String(rows.length) },
      { label: "Restante", value: String(overdue.length) },
    ],
    actions: rows.slice(0, 3).map((row) => ({
      kind: "open_module" as const,
      label: row.name,
      moduleId: "leads" as const,
      recordId: row.id,
    })),
    generatedBy: "orbyven_core",
  };
}

async function estimateFollowupQuery(actor: BillingActor): Promise<IntelligenceResponse> {
  const client = createBillingServiceClient(actor);
  const today = localDateKey(new Date(), TIME_ZONE);
  const inSevenDays = nextDateKey(today, 7);
  const { data, error } = await client
    .from("sales_estimates")
    .select("id,reference,title,status,valid_until,client_id,task_id,updated_at")
    .eq("organization_id", actor.organizationId)
    .eq("status", "sent")
    .order("updated_at", { ascending: false })
    .limit(80);
  if (error) throw error;

  const all = (data ?? []) as EstimateRow[];
  const expiring = all
    .filter((row) => row.valid_until && row.valid_until <= inSevenDays)
    .sort((a, b) => String(a.valid_until).localeCompare(String(b.valid_until)));
  const rows = expiring.length ? expiring : all;

  return {
    specialist: "operations",
    answer: all.length
      ? expiring.length
        ? `Ai ${all.length} oferte trimise fără răspuns final; ${expiring.length} expiră în următoarele 7 zile sau sunt deja expirate.`
        : `Ai ${all.length} oferte trimise fără răspuns final. Niciuna nu expiră în următoarele 7 zile.`
      : "Nu există oferte trimise care așteaptă un răspuns final.",
    facts: [
      { label: "Trimise", value: String(all.length) },
      { label: "Expiră ≤ 7 zile", value: String(expiring.length) },
    ],
    actions: rows.slice(0, 3).map((row) => ({
      kind: "open_module" as const,
      label: `${row.reference} · ${row.title}`,
      moduleId: "estimates" as const,
      recordId: row.id,
      clientId: row.client_id ?? undefined,
      taskId: row.task_id ?? undefined,
      estimateId: row.id,
    })),
    generatedBy: "orbyven_core",
  };
}

export async function answerOperationalQuery(
  actor: BillingActor,
  available: Set<OrbyvenModuleId>,
  prompt: string,
): Promise<IntelligenceResponse | null> {
  const kind = detectOperationalQuery(prompt);
  if (!kind) return null;

  if (kind === "lead_followups") {
    if (!available.has("leads")) return unavailable("Lead-uri");
    return leadFollowupQuery(actor);
  }
  if (kind === "estimate_followups") {
    if (!available.has("estimates")) return unavailable("Devize");
    return estimateFollowupQuery(actor);
  }
  const agenda = detectAgendaQuery(prompt);
  if (agenda) return answerAgendaQuery(createBillingServiceClient(actor), actor.organizationId, available, agenda);
  const task = detectTaskQuery(prompt);
  if (task) return answerTaskQuery(createBillingServiceClient(actor), actor.organizationId, available, task);
  return null;
}
