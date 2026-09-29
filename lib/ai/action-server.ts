import type { BillingActor } from "@/lib/billing/supabase-server";
import { authenticateBillingActor, createBillingServiceClient } from "@/lib/billing/supabase-server";
import { parseMutationPrompt, type CalendarActionPayload, type LeadActionPayload, type TaskActionPayload } from "@/lib/ai/action-parser";
import type { IntelligenceMutationType, IntelligenceResponse } from "@/lib/ai/intelligence-types";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

const MUTATION_ROLES = new Set(["owner", "admin", "manager", "member"]);

type ProposalRow = {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action_type: IntelligenceMutationType;
  payload: Record<string, unknown>;
  summary: string;
  status: "pending" | "executing" | "executed" | "rejected" | "expired" | "failed";
  expires_at: string;
  executed_at: string | null;
  result_type: string | null;
  result_id: string | null;
  failure_code: string | null;
};

export type ActionDecisionResult = {
  ok: boolean;
  status: "executed" | "rejected";
  message: string;
  result?: {
    type: string;
    id: string;
    moduleId: OrbyvenModuleId;
  };
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ro-RO").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function requireText(value: unknown, field: string, max: number) {
  if (typeof value !== "string") throw new Error("INVALID_" + field.toUpperCase());
  const clean = value.trim();
  if (!clean || clean.length > max) throw new Error("INVALID_" + field.toUpperCase());
  return clean;
}

function optionalText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean ? clean.slice(0, max) : null;
}

function actionModule(actionType: IntelligenceMutationType): OrbyvenModuleId {
  if (actionType === "create_lead" || actionType === "create_client") return "leads";
  if (actionType === "create_task") return "tasks";
  return "calendar";
}

async function organizationTimeZone(organizationId: string) {
  const client = createBillingServiceClient();
  const { data, error } = await client
    .from("organization_profiles")
    .select("timezone")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw error;
  return data?.timezone || "Europe/Bucharest";
}

export async function createMutationIntelligenceResponse(
  actor: BillingActor,
  available: Set<OrbyvenModuleId>,
  prompt: string
): Promise<IntelligenceResponse | null> {
  const normalizedPrompt = normalize(prompt);
  if (!/\b(creeaza|adauga|inregistreaza|deschide|programeaza)\b/.test(normalizedPrompt)) return null;

  const timeZone = await organizationTimeZone(actor.organizationId);
  const parsed = parseMutationPrompt(prompt, { timeZone });

  if (parsed.kind === "none") return null;

  if (!available.has(parsed.targetModule)) {
    return {
      specialist: "operations",
      answer: "Acțiunea a fost înțeleasă, dar modulul necesar nu este activ în acest workspace.",
      facts: [{ label: "Modul necesar", value: parsed.targetModule }],
      actions: [],
      generatedBy: "orbyven_core",
    };
  }

  if (!MUTATION_ROLES.has(actor.role)) {
    return {
      specialist: "operations",
      answer: "Rolul tău poate consulta aceste date, dar nu poate crea înregistrări în workspace.",
      facts: [{ label: "Rol", value: actor.role }],
      actions: [],
      generatedBy: "orbyven_core",
    };
  }

  if (parsed.kind === "needs_details") {
    return {
      specialist: "operations",
      answer: parsed.message,
      facts: [],
      actions: [],
      generatedBy: "orbyven_core",
    };
  }

  const client = createBillingServiceClient();
  const { data, error } = await client
    .from("ai_action_proposals")
    .insert({
      organization_id: actor.organizationId,
      actor_id: actor.userId,
      action_type: parsed.proposal.actionType,
      payload: parsed.proposal.payload,
      summary: parsed.proposal.summary,
    })
    .select("id,expires_at")
    .single();
  if (error || !data) throw error || new Error("PROPOSAL_CREATE_FAILED");

  return {
    specialist: "operations",
    answer: parsed.proposal.summary + ". Verifică detaliile și confirmă; ORBYVEN nu modifică nimic înainte de confirmare.",
    facts: parsed.proposal.facts,
    actions: [{
      kind: "confirm_proposal",
      label: "Confirmă acțiunea",
      proposalId: data.id,
      actionType: parsed.proposal.actionType,
      expiresAt: data.expires_at,
      targetModule: parsed.proposal.targetModule,
    }],
    generatedBy: "orbyven_core",
  };
}

async function resolveClientId(
  organizationId: string,
  clientName: string | null | undefined
): Promise<string | null> {
  if (!clientName?.trim()) return null;
  const client = createBillingServiceClient();
  const name = clientName.trim();

  const [nameResult, companyResult] = await Promise.all([
    client.from("crm_leads")
      .select("id,name,company")
      .eq("organization_id", organizationId)
      .ilike("name", name)
      .limit(5),
    client.from("crm_leads")
      .select("id,name,company")
      .eq("organization_id", organizationId)
      .ilike("company", name)
      .limit(5),
  ]);
  if (nameResult.error) throw nameResult.error;
  if (companyResult.error) throw companyResult.error;

  const unique = new Map<string, { id: string; name: string; company: string | null }>();
  for (const row of [...(nameResult.data ?? []), ...(companyResult.data ?? [])]) unique.set(row.id, row);
  const target = normalize(name);
  const matches = [...unique.values()].filter(
    (row) => normalize(row.name) === target || (row.company && normalize(row.company) === target)
  );

  if (matches.length === 1) return matches[0].id;
  if (matches.length === 0) throw new Error("CLIENT_NOT_FOUND");
  throw new Error("CLIENT_AMBIGUOUS");
}

async function executeLead(
  actor: BillingActor,
  actionType: "create_lead" | "create_client",
  payload: Record<string, unknown>
) {
  const client = createBillingServiceClient();
  const input = payload as LeadActionPayload;
  const name = requireText(input.name, "name", 120);
  const isClient = actionType === "create_client";
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("crm_leads")
    .insert({
      organization_id: actor.organizationId,
      kind: isClient ? "client" : "lead",
      stage: isClient ? "won" : "new",
      name,
      company: optionalText(input.company, 140),
      email: optionalText(input.email, 180),
      phone: optionalText(input.phone, 60),
      source: "ORBYVEN AI",
      note: optionalText(input.note, 500),
      currency: "RON",
      converted_at: isClient ? now : null,
      created_by: actor.userId,
    })
    .select("id")
    .single();
  if (error || !data) throw error || new Error("LEAD_CREATE_FAILED");
  return { id: data.id as string, type: "crm_lead", moduleId: "leads" as const };
}

async function executeTask(actor: BillingActor, payload: Record<string, unknown>) {
  const client = createBillingServiceClient();
  const input = payload as TaskActionPayload;
  const title = requireText(input.title, "title", 180);
  const kind = input.kind === "work" ? "work" : "task";
  const priority = ["low", "normal", "high", "urgent"].includes(input.priority)
    ? input.priority
    : "normal";
  const clientId = await resolveClientId(actor.organizationId, input.clientName);

  const { data, error } = await client
    .from("ops_tasks")
    .insert({
      organization_id: actor.organizationId,
      kind,
      priority,
      title,
      description: optionalText(input.description, 700),
      client_id: clientId,
      location: optionalText(input.location, 240),
      created_by: actor.userId,
    })
    .select("id")
    .single();
  if (error || !data) throw error || new Error("TASK_CREATE_FAILED");
  return { id: data.id as string, type: "ops_task", moduleId: "tasks" as const };
}

async function executeCalendar(actor: BillingActor, payload: Record<string, unknown>) {
  const client = createBillingServiceClient();
  const input = payload as CalendarActionPayload;
  const title = requireText(input.title, "title", 180);
  const startAt = new Date(requireText(input.startAt, "start_at", 80));
  const endAt = new Date(requireText(input.endAt, "end_at", 80));
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt <= startAt) {
    throw new Error("INVALID_EVENT_TIME");
  }
  const clientId = await resolveClientId(actor.organizationId, input.clientName);
  const reminder = typeof input.reminderMinutes === "number" && Number.isFinite(input.reminderMinutes)
    ? Math.max(0, Math.min(1440, Math.round(input.reminderMinutes)))
    : 30;

  const { data, error } = await client
    .from("calendar_events")
    .insert({
      organization_id: actor.organizationId,
      event_type: "appointment",
      status: "scheduled",
      title,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      all_day: false,
      client_id: clientId,
      location: optionalText(input.location, 240),
      notes: optionalText(input.notes, 700),
      reminder_minutes: reminder,
      created_by: actor.userId,
    })
    .select("id")
    .single();
  if (error || !data) throw error || new Error("CALENDAR_CREATE_FAILED");
  return { id: data.id as string, type: "calendar_event", moduleId: "calendar" as const };
}

async function executeClaimedProposal(actor: BillingActor, proposal: ProposalRow) {
  if (proposal.action_type === "create_lead" || proposal.action_type === "create_client") {
    return executeLead(actor, proposal.action_type, proposal.payload);
  }
  if (proposal.action_type === "create_task") {
    return executeTask(actor, proposal.payload);
  }
  if (proposal.action_type === "create_calendar_event") {
    return executeCalendar(actor, proposal.payload);
  }
  throw new Error("UNSUPPORTED_ACTION");
}

async function writeAudit(
  actor: BillingActor,
  proposal: ProposalRow,
  result: { id: string; type: string; moduleId: OrbyvenModuleId }
) {
  const client = createBillingServiceClient();
  const { error } = await client.from("platform_audit_log").insert({
    actor_user_id: actor.userId,
    actor_role: actor.role,
    organization_id: actor.organizationId,
    action: "ai_action.executed",
    target_type: result.type,
    target_id: result.id,
    metadata: {
      proposal_id: proposal.id,
      action_type: proposal.action_type,
      module_id: result.moduleId,
      confirmation: "explicit_user_confirmation",
    },
  });
  if (error) console.error("ORBYVEN AI audit mirror failed", error.code);
}

export async function decideMutationProposal(
  request: Request,
  organizationId: string,
  proposalId: string,
  decision: "confirm" | "reject"
): Promise<ActionDecisionResult> {
  const actor = await authenticateBillingActor(request, organizationId, false);
  if (!MUTATION_ROLES.has(actor.role)) throw new Error("MUTATION_ROLE_REQUIRED");

  const client = createBillingServiceClient();
  const now = new Date().toISOString();

  if (decision === "reject") {
    const { data, error } = await client
      .from("ai_action_proposals")
      .update({ status: "rejected", updated_at: now })
      .eq("id", proposalId)
      .eq("organization_id", actor.organizationId)
      .eq("actor_id", actor.userId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("PROPOSAL_NOT_PENDING");
    return { ok: true, status: "rejected", message: "Acțiunea a fost anulată. Nu s-a modificat nimic." };
  }

  await client
    .from("ai_action_proposals")
    .update({ status: "expired", updated_at: now })
    .eq("id", proposalId)
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .eq("status", "pending")
    .lte("expires_at", now);

  const { data: claimed, error: claimError } = await client
    .from("ai_action_proposals")
    .update({ status: "executing", updated_at: now })
    .eq("id", proposalId)
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .eq("status", "pending")
    .gt("expires_at", now)
    .select("id,organization_id,actor_id,action_type,payload,summary,status,expires_at,executed_at,result_type,result_id,failure_code")
    .maybeSingle();
  if (claimError) throw claimError;

  if (!claimed) {
    const { data: existing } = await client
      .from("ai_action_proposals")
      .select("status")
      .eq("id", proposalId)
      .eq("organization_id", actor.organizationId)
      .eq("actor_id", actor.userId)
      .maybeSingle();
    if (existing?.status === "expired") throw new Error("PROPOSAL_EXPIRED");
    if (existing?.status === "executed") throw new Error("PROPOSAL_ALREADY_EXECUTED");
    throw new Error("PROPOSAL_NOT_PENDING");
  }

  const proposal = claimed as ProposalRow;

  try {
    const moduleId = actionModule(proposal.action_type);
    const [moduleResult, entitlementResult] = await Promise.all([
      client.from("organization_modules")
        .select("enabled")
        .eq("organization_id", actor.organizationId)
        .eq("module_id", moduleId)
        .eq("enabled", true)
        .maybeSingle(),
      client.from("organization_entitlements")
        .select("enabled,starts_at,ends_at")
        .eq("organization_id", actor.organizationId)
        .eq("module_id", moduleId)
        .eq("enabled", true)
        .maybeSingle(),
    ]);
    if (moduleResult.error) throw moduleResult.error;
    if (entitlementResult.error) throw entitlementResult.error;

    const entitlement = entitlementResult.data;
    const nowMs = Date.now();
    const entitled = Boolean(
      moduleResult.data &&
      entitlement &&
      (!entitlement.starts_at || new Date(entitlement.starts_at).getTime() <= nowMs) &&
      (!entitlement.ends_at || new Date(entitlement.ends_at).getTime() > nowMs)
    );
    if (!entitled) throw new Error("MODULE_NOT_AVAILABLE");

    const result = await executeClaimedProposal(actor, proposal);
    const executedAt = new Date().toISOString();
    const { error: finishError } = await client.from("ai_action_proposals")
      .update({
        status: "executed",
        executed_at: executedAt,
        result_type: result.type,
        result_id: result.id,
        failure_code: null,
        updated_at: executedAt,
      })
      .eq("id", proposal.id)
      .eq("status", "executing");
    if (finishError) throw finishError;

    await writeAudit(actor, proposal, result);
    return {
      ok: true,
      status: "executed",
      message: "Acțiunea a fost confirmată și executată.",
      result,
    };
  } catch (error) {
    const failureCode = error instanceof Error ? error.message.slice(0, 120) : "ACTION_EXECUTION_FAILED";
    await client.from("ai_action_proposals")
      .update({ status: "failed", failure_code: failureCode, updated_at: new Date().toISOString() })
      .eq("id", proposal.id)
      .eq("status", "executing");
    throw error;
  }
}
