import type { BillingActor } from "@/lib/billing/supabase-server";
import { authenticateBillingActor, createBillingServiceClient } from "@/lib/billing/supabase-server";
import {
  parseMutationPrompt,
  type CalendarActionPayload,
  type EstimateActionPayload,
  type DocumentDraftActionPayload,
  type LeadActionPayload,
  type TaskActionPayload,
} from "@/lib/ai/action-parser";
import type { IntelligenceMutationType, IntelligenceResponse } from "@/lib/ai/intelligence-types";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import { appendAssistantConversationMessage } from "@/lib/ai/conversation-server";

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
  conversation_id: string | null;
};

export type ActionDecisionResult = {
  ok: boolean;
  status: "executed" | "rejected";
  message: string;
  plan?: {
    id: string;
    step: number;
    total: number;
  };
  result?: {
    type: string;
    id: string;
    moduleId: OrbyvenModuleId;
  };
};

function planMeta(payload: Record<string, unknown>) {
  const raw = payload.__orbyven_plan;
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const id = typeof value.id === "string" ? value.id : "";
  const step = typeof value.step === "number" ? value.step : Number(value.step);
  const total = typeof value.total === "number" ? value.total : Number(value.total);
  const dependsOnProposalId =
    typeof value.dependsOnProposalId === "string" && value.dependsOnProposalId
      ? value.dependsOnProposalId
      : null;

  if (!/^[a-f0-9-]{36}$/i.test(id) || !Number.isInteger(step) || !Number.isInteger(total)) {
    return null;
  }
  if (step < 1 || total < step || total > 8) return null;
  return { id, step, total, dependsOnProposalId };
}

async function assertPlanDependency(actor: BillingActor, proposal: { payload: Record<string, unknown> }) {
  const meta = planMeta(proposal.payload);
  if (!meta?.dependsOnProposalId) return meta;

  const client = createBillingServiceClient();
  const { data, error } = await client
    .from("ai_action_proposals")
    .select("id,status,payload")
    .eq("id", meta.dependsOnProposalId)
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.status !== "executed") throw new Error("PLAN_DEPENDENCY_REQUIRED");

  const dependencyMeta = planMeta((data.payload ?? {}) as Record<string, unknown>);
  if (!dependencyMeta || dependencyMeta.id !== meta.id || dependencyMeta.step !== meta.step - 1) {
    throw new Error("PLAN_DEPENDENCY_INVALID");
  }
  return meta;
}

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
  if (actionType === "create_estimate") return "estimates";
  if (actionType === "create_document_draft") return "documents";
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
  prompt: string,
  conversationId: string | null = null
): Promise<IntelligenceResponse | null> {
  const normalizedPrompt = normalize(prompt);
  if (!/\b(creeaza|adauga|inregistreaza|deschide|programeaza)\b/.test(normalizedPrompt)) return null;

  const timeZone = await organizationTimeZone(actor.organizationId);
  const parsed = parseMutationPrompt(prompt, { timeZone });

  if (parsed.kind === "none") return null;

  const targetModule = parsed.kind === "proposal"
    ? parsed.proposal.targetModule
    : parsed.targetModule;

  if (!available.has(targetModule)) {
    return {
      specialist: "operations",
      answer: "Acțiunea a fost înțeleasă, dar modulul necesar nu este activ în acest workspace.",
      facts: [{ label: "Modul necesar", value: targetModule }],
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
      conversation_id: conversationId,
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

async function resolveWorkContext(
  organizationId: string,
  taskTitle: string | null | undefined,
  explicitClientId: string | null
): Promise<{ taskId: string | null; clientId: string | null }> {
  if (!taskTitle?.trim()) return { taskId: null, clientId: explicitClientId };

  const client = createBillingServiceClient();
  const title = taskTitle.trim();
  const { data, error } = await client
    .from("ops_tasks")
    .select("id,title,client_id,kind")
    .eq("organization_id", organizationId)
    .eq("kind", "work")
    .ilike("title", title)
    .limit(5);
  if (error) throw error;

  const target = normalize(title);
  const matches = (data ?? []).filter((row) => normalize(row.title) === target);
  if (matches.length === 0) throw new Error("TASK_NOT_FOUND");
  if (matches.length > 1) throw new Error("TASK_AMBIGUOUS");

  const task = matches[0];
  if (explicitClientId && task.client_id && explicitClientId !== task.client_id) {
    throw new Error("TASK_CLIENT_MISMATCH");
  }
  return {
    taskId: task.id,
    clientId: task.client_id || explicitClientId,
  };
}

function leiToCents(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100_000_000) {
    throw new Error("INVALID_" + field.toUpperCase());
  }
  const cents = Math.round(value * 100);
  if (!Number.isSafeInteger(cents)) throw new Error("INVALID_" + field.toUpperCase());
  return cents;
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
  const explicitClientId = await resolveClientId(actor.organizationId, input.clientName);
  const work = await resolveWorkContext(actor.organizationId, input.taskTitle, explicitClientId);
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
      client_id: work.clientId,
      task_id: work.taskId,
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

async function executeEstimate(actor: BillingActor, payload: Record<string, unknown>) {
  const client = createBillingServiceClient();
  const input = payload as EstimateActionPayload;
  const title = requireText(input.title, "estimate_title", 180);
  if (input.currency !== "RON") throw new Error("INVALID_ESTIMATE_CURRENCY");

  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 50) {
    throw new Error("INVALID_ESTIMATE_ITEMS");
  }

  const items = input.items.map((item) => {
    const description = requireText(item.description, "estimate_item", 500);
    if (typeof item.quantity !== "number" || !Number.isFinite(item.quantity) ||
        item.quantity <= 0 || item.quantity > 1_000_000) {
      throw new Error("INVALID_ESTIMATE_QUANTITY");
    }
    return {
      description,
      quantity: item.quantity,
      unit_price_cents: leiToCents(item.unitPriceLei, "estimate_unit_price"),
    };
  });

  const explicitClientId = await resolveClientId(actor.organizationId, input.clientName);
  const work = await resolveWorkContext(actor.organizationId, input.taskTitle, explicitClientId);

  const taxRate = input.taxRate === null
    ? null
    : typeof input.taxRate === "number" && Number.isFinite(input.taxRate) && input.taxRate >= 0 && input.taxRate <= 100
      ? input.taxRate
      : (() => { throw new Error("INVALID_ESTIMATE_TAX"); })();

  const validUntil = input.validUntil
    ? /^\d{4}-\d{2}-\d{2}$/.test(input.validUntil)
      ? input.validUntil
      : (() => { throw new Error("INVALID_ESTIMATE_VALID_UNTIL"); })()
    : null;

  const { data, error } = await client.rpc("ai_create_estimate_draft", {
    p_organization_id: actor.organizationId,
    p_actor_id: actor.userId,
    p_title: title,
    p_client_id: work.clientId,
    p_task_id: work.taskId,
    p_currency: "RON",
    p_discount_cents: leiToCents(input.discountLei ?? 0, "estimate_discount"),
    p_tax_rate: taxRate,
    p_valid_until: validUntil,
    p_notes: optionalText(input.notes, 700),
    p_planned_labor_cents: leiToCents(input.plannedLaborLei ?? 0, "estimate_labor"),
    p_other_cost_cents: leiToCents(input.otherCostLei ?? 0, "estimate_other_cost"),
    p_items: items,
  });
  if (error || typeof data !== "string") {
    throw error || new Error("ESTIMATE_CREATE_FAILED");
  }
  return { id: data, type: "sales_estimate", moduleId: "estimates" as const };
}

function safeGeneratedFileName(title: string) {
  const cleaned = title
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  return cleaned || "document";
}

async function executeDocumentDraft(actor: BillingActor, payload: Record<string, unknown>) {
  const client = createBillingServiceClient();
  const input = payload as DocumentDraftActionPayload;
  const title = requireText(input.title, "document_title", 160);
  const content = requireText(input.content, "document_content", 900);
  const category = ["general", "contract", "other"].includes(input.category)
    ? input.category
    : "general";

  const explicitClientId = await resolveClientId(actor.organizationId, input.clientName);
  const work = await resolveWorkContext(actor.organizationId, input.taskTitle, explicitClientId);

  const fileText = [
    "ORBYVEN — DRAFT INTERN",
    "Nesemnat și nevalidat juridic automat.",
    "",
    title,
    "",
    content,
  ].join("\n");
  const bytes = new TextEncoder().encode(fileText);
  if (bytes.byteLength > 20 * 1024 * 1024) throw new Error("INVALID_DOCUMENT_SIZE");

  const storagePath =
    actor.organizationId + "/ai/" + globalThis.crypto.randomUUID() + "-" +
    safeGeneratedFileName(title) + ".txt";

  const { error: uploadError } = await client.storage
    .from("orbyven-documents")
    .upload(storagePath, bytes, {
      contentType: "text/plain",
      cacheControl: "3600",
      upsert: false,
    });
  if (uploadError) throw new Error("DOCUMENT_STORAGE_FAILED");

  const userNote = optionalText(input.note, 300);
  const note = [
    "Draft intern creat prin ORBYVEN AI după confirmare explicită. Nesemnat și nevalidat juridic automat.",
    userNote,
  ].filter(Boolean).join(" ");

  const { data, error } = await client
    .from("ops_documents")
    .insert({
      organization_id: actor.organizationId,
      name: title + ".txt",
      category,
      storage_path: storagePath,
      mime_type: "text/plain",
      size_bytes: bytes.byteLength,
      client_id: work.clientId,
      task_id: work.taskId,
      estimate_id: null,
      note,
      created_by: actor.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    await client.storage.from("orbyven-documents").remove([storagePath]);
    throw error || new Error("DOCUMENT_CREATE_FAILED");
  }

  return { id: data.id as string, type: "ops_document", moduleId: "documents" as const };
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
  if (proposal.action_type === "create_estimate") {
    return executeEstimate(actor, proposal.payload);
  }
  if (proposal.action_type === "create_document_draft") {
    return executeDocumentDraft(actor, proposal.payload);
  }
  throw new Error("UNSUPPORTED_ACTION");
}

async function writeAudit(
  actor: BillingActor,
  proposal: ProposalRow,
  result: { id: string; type: string; moduleId: OrbyvenModuleId }
) {
  const client = createBillingServiceClient();
  const auditPlan = planMeta(proposal.payload);
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
      ...(auditPlan
        ? { plan_id: auditPlan.id, plan_step: auditPlan.step, plan_total: auditPlan.total }
        : {}),
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
      .select("id,conversation_id,payload")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("PROPOSAL_NOT_PENDING");
    const message = "Acțiunea a fost anulată. Nu s-a modificat nimic.";
    if (data.conversation_id) {
      try {
        await appendAssistantConversationMessage(actor, data.conversation_id, {
          specialist: "operations",
          content: message,
          facts: [{ label: "Status", value: "Anulată" }],
        });
      } catch (historyError) {
        console.error("ORBYVEN AI conversation outcome persistence failed", historyError);
      }
    }
    const rejectedPlan = planMeta((data.payload ?? {}) as Record<string, unknown>);
    return {
      ok: true,
      status: "rejected",
      message,
      ...(rejectedPlan
        ? { plan: { id: rejectedPlan.id, step: rejectedPlan.step, total: rejectedPlan.total } }
        : {}),
    };
  }

  await client
    .from("ai_action_proposals")
    .update({ status: "expired", updated_at: now })
    .eq("id", proposalId)
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .eq("status", "pending")
    .lte("expires_at", now);

  const { data: pendingForPlan, error: pendingPlanError } = await client
    .from("ai_action_proposals")
    .select("payload")
    .eq("id", proposalId)
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .eq("status", "pending")
    .gt("expires_at", now)
    .maybeSingle();
  if (pendingPlanError) throw pendingPlanError;
  if (pendingForPlan) {
    await assertPlanDependency(actor, {
      payload: (pendingForPlan.payload ?? {}) as Record<string, unknown>,
    });
  }

  const { data: claimed, error: claimError } = await client
    .from("ai_action_proposals")
    .update({ status: "executing", updated_at: now })
    .eq("id", proposalId)
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .eq("status", "pending")
    .gt("expires_at", now)
    .select("id,organization_id,actor_id,action_type,payload,summary,status,expires_at,executed_at,result_type,result_id,failure_code,conversation_id")
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
    const activePlan = planMeta(proposal.payload);
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
    const message = "Acțiunea a fost confirmată și executată.";
    if (proposal.conversation_id) {
      try {
        await appendAssistantConversationMessage(actor, proposal.conversation_id, {
          specialist: "operations",
          content: message,
          facts: [
            { label: "Status", value: "Creat cu confirmare" },
            { label: "Modul", value: result.moduleId },
          ],
        });
      } catch (historyError) {
        console.error("ORBYVEN AI conversation outcome persistence failed", historyError);
      }
    }
    return {
      ok: true,
      status: "executed",
      message,
      result,
      ...(activePlan
        ? { plan: { id: activePlan.id, step: activePlan.step, total: activePlan.total } }
        : {}),
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
