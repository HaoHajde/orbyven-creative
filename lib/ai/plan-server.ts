import { randomUUID } from "node:crypto";
import type { BillingActor } from "@/lib/billing/supabase-server";
import { createBillingServiceClient } from "@/lib/billing/supabase-server";
import { parseMutationPrompt, type ParsedMutation } from "@/lib/ai/action-parser";
import { appendAssistantConversationMessage } from "@/lib/ai/conversation-server";
import { applyPlanBindings, splitPlanClauses, type PlanBindings } from "@/lib/ai/plan-core";
import type {
  IntelligenceMutationType,
  IntelligenceResponse,
  PlanRecoveryMode,
  PlanRecoveryReason,
} from "@/lib/ai/intelligence-types";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

const PLAN_ROLES = new Set(["owner", "admin", "manager", "member"]);
const PLAN_TTL_MS = 30 * 60 * 1000;
const MAX_RECOVERY_ATTEMPTS = 4;

const NEEDS_INPUT_FAILURES = new Set([
  "CLIENT_NOT_FOUND",
  "CLIENT_AMBIGUOUS",
  "TASK_NOT_FOUND",
  "TASK_AMBIGUOUS",
  "TASK_CLIENT_MISMATCH",
  "INVALID_EVENT_TIME",
  "INVALID_ESTIMATE_CURRENCY",
  "INVALID_ESTIMATE_ITEMS",
  "INVALID_ESTIMATE_QUANTITY",
  "INVALID_ESTIMATE_TAX",
  "INVALID_ESTIMATE_VALID_UNTIL",
  "INVALID_DOCUMENT_SIZE",
  "MODULE_NOT_AVAILABLE",
  "UNSUPPORTED_ACTION",
]);

type PlanAction = Extract<IntelligenceResponse["actions"][number], { kind: "review_plan" }>;

type StoredPlanProposal = {
  id: string;
  action_type: IntelligenceMutationType;
  payload: Record<string, unknown>;
  summary: string;
  status: "pending" | "executing" | "executed" | "rejected" | "expired" | "failed";
  expires_at: string;
  created_at: string;
  failure_code: string | null;
  conversation_id: string | null;
};

type RecoveryDescriptor = {
  blockedStep: number;
  reason: PlanRecoveryReason;
  mode: PlanRecoveryMode;
  label: string;
  message: string;
  suggestedPrompt?: string;
};

export type PlanRecoveryResult =
  | {
      mode: "recovered";
      message: string;
      plan: PlanAction;
    }
  | {
      mode: "needs_input";
      message: string;
      blockedStep: number;
      suggestedPrompt: string;
      plan: PlanAction;
    };

async function organizationTimeZone(actor: BillingActor) {
  const client = createBillingServiceClient(actor);
  const { data, error } = await client
    .from("organization_profiles")
    .select("timezone")
    .eq("organization_id", actor.organizationId)
    .maybeSingle();
  if (error) throw error;
  return data?.timezone || "Europe/Bucharest";
}

function targetModuleForAction(actionType: IntelligenceMutationType): OrbyvenModuleId {
  if (actionType === "create_lead" || actionType === "create_client") return "leads";
  if (actionType === "create_task") return "tasks";
  if (actionType === "create_calendar_event") return "calendar";
  if (actionType === "create_estimate") return "estimates";
  return "documents";
}

function updateBindings(bindings: PlanBindings, proposal: ParsedMutation) {
  if (proposal.actionType === "create_client" || proposal.actionType === "create_lead") {
    bindings.clientName = proposal.payload.name;
    bindings.lastEntity = "client";
    return;
  }
  if (proposal.actionType === "create_task" && proposal.payload.kind === "work") {
    bindings.workTitle = proposal.payload.title;
    bindings.orderTitle = undefined;
    if (proposal.payload.clientName) bindings.clientName = proposal.payload.clientName;
    bindings.lastEntity = "work";
    return;
  }
  if (proposal.actionType === "create_task" && proposal.payload.kind === "order") {
    bindings.orderTitle = proposal.payload.title;
    bindings.workTitle = undefined;
    if (proposal.payload.clientName) bindings.clientName = proposal.payload.clientName;
    bindings.lastEntity = "order";
  }
}

function storedPlanMeta(payload: Record<string, unknown>) {
  const raw = payload.__orbyven_plan;
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const id = typeof value.id === "string" ? value.id : "";
  const step = typeof value.step === "number" ? value.step : Number(value.step);
  const total = typeof value.total === "number" ? value.total : Number(value.total);
  const dependency =
    typeof value.dependsOnProposalId === "string" && value.dependsOnProposalId
      ? value.dependsOnProposalId
      : null;
  const sourcePrompt =
    typeof value.sourcePrompt === "string" ? value.sourcePrompt.slice(0, 1200) : null;
  const planPrompt =
    typeof value.planPrompt === "string" ? value.planPrompt.slice(0, 1200) : null;
  const rootPlanId =
    typeof value.rootPlanId === "string" && /^[a-f0-9-]{36}$/i.test(value.rootPlanId)
      ? value.rootPlanId
      : id;
  const recoveryAttemptRaw =
    typeof value.recoveryAttempt === "number" ? value.recoveryAttempt : Number(value.recoveryAttempt ?? 0);
  const recoveryAttempt =
    Number.isInteger(recoveryAttemptRaw) && recoveryAttemptRaw >= 0 ? recoveryAttemptRaw : 0;

  if (!/^[a-f0-9-]{36}$/i.test(id) || !Number.isInteger(step) || !Number.isInteger(total)) return null;
  if (step < 1 || total < step || total > 8) return null;
  return {
    id,
    step,
    total,
    dependency,
    sourcePrompt,
    planPrompt,
    rootPlanId,
    recoveryAttempt,
  };
}

function logicalPlanStatus(
  row: StoredPlanProposal,
  byId: Map<string, StoredPlanProposal>,
  now: number
): PlanAction["steps"][number]["status"] {
  if (row.status === "executed") return "executed";
  if (row.status === "rejected") return "rejected";
  if (row.status === "failed") return "failed";
  if (row.status === "expired" || new Date(row.expires_at).getTime() <= now) return "expired";
  if (row.status === "pending") {
    const meta = storedPlanMeta(row.payload);
    const dependency = meta?.dependency ? byId.get(meta.dependency) : null;
    return !dependency || dependency.status === "executed" ? "ready" : "locked";
  }
  return "locked";
}

function recoveryDescriptor(
  row: StoredPlanProposal,
  status: PlanAction["steps"][number]["status"],
  step: number
): RecoveryDescriptor | null {
  if (status === "rejected") {
    return {
      blockedStep: step,
      reason: "rejected",
      mode: "resume",
      label: "Refă de la pasul " + step,
      message: "Pasul a fost oprit. ORBYVEN poate reconstrui doar pașii rămași, iar fiecare va necesita din nou confirmare.",
    };
  }
  if (status === "expired") {
    return {
      blockedStep: step,
      reason: "expired",
      mode: "resume",
      label: "Reîmprospătează de la pasul " + step,
      message: "Confirmarea a expirat. ORBYVEN poate crea o continuare cu un nou interval de confirmare.",
    };
  }
  if (status === "failed") {
    const failure = (row.failure_code || "").trim().toUpperCase();
    if (NEEDS_INPUT_FAILURES.has(failure)) {
      return {
        blockedStep: step,
        reason: "failed",
        mode: "needs_input",
        label: "Corectează pasul " + step,
        message: "Pasul are nevoie de context corectat înainte de a putea fi refăcut. ORBYVEN nu va ghici datele lipsă sau ambigue.",
      suggestedPrompt:
        storedPlanMeta(row.payload)?.planPrompt ||
        storedPlanMeta(row.payload)?.sourcePrompt ||
        row.summary,
      };
    }
    return {
      blockedStep: step,
      reason: "failed",
      mode: "resume",
      label: "Reîncearcă de la pasul " + step,
      message: "Execuția pasului a eșuat. ORBYVEN poate reconstrui continuarea, dar nu va executa nimic fără confirmarea ta.",
    };
  }
  return null;
}

function buildPlanAction(planRows: StoredPlanProposal[]): PlanAction {
  if (!planRows.length) throw new Error("PLAN_NOT_FOUND");
  const firstMeta = storedPlanMeta(planRows[0].payload);
  if (!firstMeta) throw new Error("PLAN_METADATA_INVALID");

  const now = Date.now();
  const byId = new Map(planRows.map((row) => [row.id, row]));
  const steps = planRows.map((row) => {
    const meta = storedPlanMeta(row.payload);
    if (!meta) throw new Error("PLAN_METADATA_INVALID");
    return {
      proposalId: row.id,
      index: meta.step,
      summary: row.summary,
      actionType: row.action_type,
      targetModule: targetModuleForAction(row.action_type),
      status: logicalPlanStatus(row, byId, now),
    };
  });

  let recovery: RecoveryDescriptor | undefined;
  for (let index = 0; index < planRows.length; index += 1) {
    const candidate = recoveryDescriptor(planRows[index], steps[index].status, steps[index].index);
    if (candidate) {
      recovery = candidate;
      break;
    }
  }

  return {
    kind: "review_plan",
    label: steps.every((step) => step.status === "executed")
      ? "Plan finalizat"
      : recovery
        ? "Plan blocat · recovery disponibil"
        : "Revizuiește planul",
    planId: firstMeta.id,
    expiresAt: planRows[0].expires_at,
    ...(recovery ? { recovery } : {}),
    steps,
  };
}

async function loadPlanRows(actor: BillingActor, planId: string) {
  if (!/^[a-f0-9-]{36}$/i.test(planId)) throw new Error("PLAN_ID_INVALID");
  const client = createBillingServiceClient(actor);
  const { data, error } = await client
    .from("ai_action_proposals")
    .select("id,action_type,payload,summary,status,expires_at,created_at,failure_code,conversation_id")
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .order("created_at", { ascending: false })
    .limit(128);

  if (error) throw error;
  const rows = ((data ?? []) as StoredPlanProposal[])
    .filter((row) => storedPlanMeta(row.payload)?.id === planId)
    .sort((a, b) => (storedPlanMeta(a.payload)?.step ?? 0) - (storedPlanMeta(b.payload)?.step ?? 0));

  if (!rows.length) throw new Error("PLAN_NOT_FOUND");
  const firstMeta = storedPlanMeta(rows[0].payload);
  if (!firstMeta || rows.length !== firstMeta.total) throw new Error("PLAN_INCOMPLETE");
  return rows;
}

export async function createPlanIntelligenceResponse(
  actor: BillingActor,
  available: Set<OrbyvenModuleId>,
  prompt: string,
  conversationId: string | null
): Promise<IntelligenceResponse | null> {
  const clauses = splitPlanClauses(prompt);
  if (clauses.length < 2) return null;

  if (!PLAN_ROLES.has(actor.role)) {
    return {
      specialist: "operations",
      answer: "Am identificat mai multe acțiuni, dar rolul tău nu poate crea un plan de modificări în workspace.",
      facts: [{ label: "Rol", value: actor.role }],
      actions: [],
      generatedBy: "orbyven_core",
    };
  }

  const timeZone = await organizationTimeZone(actor);
  const bindings: PlanBindings = {};
  const compiled: Array<{ proposal: ParsedMutation; prompt: string }> = [];

  for (let index = 0; index < clauses.length; index += 1) {
    const effective = applyPlanBindings(clauses[index], bindings);
    const parsed = parseMutationPrompt(effective, { timeZone });

    if (parsed.kind === "none") return null;
    if (parsed.kind === "needs_details") {
      return {
        specialist: "operations",
        answer: "Planul nu este încă executabil. Pasul " + (index + 1) + " are nevoie de detalii: " + parsed.message,
        facts: [
          { label: "Plan", value: clauses.length + " pași detectați" },
          { label: "Pas incomplet", value: String(index + 1) },
        ],
        actions: [{
          kind: "repair_plan",
          label: "Completează pasul " + (index + 1),
          blockedStep: index + 1,
          suggestedPrompt: prompt.slice(0, 1200),
          message: parsed.message,
        }],
        generatedBy: "orbyven_core",
      };
    }

    if (!available.has(parsed.proposal.targetModule)) {
      return {
        specialist: "operations",
        answer: "Planul folosește un modul care nu este activ în acest workspace.",
        facts: [
          { label: "Pas", value: String(index + 1) },
          { label: "Modul necesar", value: parsed.proposal.targetModule },
        ],
        actions: [],
        generatedBy: "orbyven_core",
      };
    }

    compiled.push({ proposal: parsed.proposal, prompt: effective });
    updateBindings(bindings, parsed.proposal);
  }

  if (compiled.length < 2) return null;

  const planId = randomUUID();
  const proposalIds = compiled.map(() => randomUUID());
  const expiresAt = new Date(Date.now() + PLAN_TTL_MS).toISOString();
  const client = createBillingServiceClient(actor);

  const rows = compiled.map((step, index) => ({
    id: proposalIds[index],
    organization_id: actor.organizationId,
    actor_id: actor.userId,
    action_type: step.proposal.actionType,
    payload: {
      ...step.proposal.payload,
      __orbyven_plan: {
        id: planId,
        step: index + 1,
        total: compiled.length,
        dependsOnProposalId: index > 0 ? proposalIds[index - 1] : null,
        sourcePrompt: step.prompt.slice(0, 1200),
        planPrompt: prompt.slice(0, 1200),
        rootPlanId: planId,
        recoveryAttempt: 0,
      },
    },
    summary: step.proposal.summary,
    conversation_id: conversationId,
    expires_at: expiresAt,
  }));

  const { error } = await client.from("ai_action_proposals").insert(rows);
  if (error) throw error;

  return {
    specialist: "operations",
    answer: "Am pregătit un plan cu " + compiled.length + " pași. Fiecare pas se confirmă separat; următorul se poate executa numai după ce precedentul a fost confirmat și finalizat.",
    facts: compiled.slice(0, 8).map((step, index) => ({
      label: "Pas " + (index + 1),
      value: step.proposal.summary,
    })),
    actions: [{
      kind: "review_plan",
      label: "Revizuiește planul",
      planId,
      expiresAt,
      steps: compiled.map((step, index) => ({
        proposalId: proposalIds[index],
        index: index + 1,
        summary: step.proposal.summary,
        actionType: step.proposal.actionType,
        targetModule: step.proposal.targetModule,
        status: index === 0 ? "ready" : "locked",
      })),
    }],
    generatedBy: "orbyven_core",
  };
}

export async function loadLatestPlanAction(
  actor: BillingActor,
  conversationId: string
): Promise<PlanAction | null> {
  const client = createBillingServiceClient(actor);
  const { data, error } = await client
    .from("ai_action_proposals")
    .select("id,action_type,payload,summary,status,expires_at,created_at,failure_code,conversation_id")
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(64);

  if (error) throw error;
  const rows = (data ?? []) as StoredPlanProposal[];
  const firstPlanRow = rows.find((row) => storedPlanMeta(row.payload));
  if (!firstPlanRow) return null;
  const firstMeta = storedPlanMeta(firstPlanRow.payload);
  if (!firstMeta) return null;

  const planRows = rows
    .filter((row) => storedPlanMeta(row.payload)?.id === firstMeta.id)
    .sort((a, b) => (storedPlanMeta(a.payload)?.step ?? 0) - (storedPlanMeta(b.payload)?.step ?? 0));

  if (planRows.length !== firstMeta.total) return null;
  return buildPlanAction(planRows);
}

export async function recoverPlan(
  actor: BillingActor,
  planId: string
): Promise<PlanRecoveryResult> {
  if (!PLAN_ROLES.has(actor.role)) throw new Error("PLAN_ROLE_REQUIRED");

  const planRows = await loadPlanRows(actor, planId);
  const currentPlan = buildPlanAction(planRows);
  const recovery = currentPlan.recovery;
  if (!recovery) throw new Error("PLAN_RECOVERY_NOT_AVAILABLE");

  const blockedRow = planRows.find((row) => storedPlanMeta(row.payload)?.step === recovery.blockedStep);
  if (!blockedRow) throw new Error("PLAN_BLOCKED_STEP_NOT_FOUND");
  const blockedMeta = storedPlanMeta(blockedRow.payload);
  if (!blockedMeta) throw new Error("PLAN_METADATA_INVALID");

  const suggestedPrompt =
    blockedMeta.planPrompt ||
    blockedMeta.sourcePrompt ||
    blockedRow.summary;

  if (recovery.mode === "needs_input" || blockedMeta.recoveryAttempt >= MAX_RECOVERY_ATTEMPTS) {
    const message = blockedMeta.recoveryAttempt >= MAX_RECOVERY_ATTEMPTS
      ? "Planul a ajuns la limita de refaceri automate. Corectează cererea înainte de o nouă încercare."
      : recovery.message;
    return {
      mode: "needs_input",
      message,
      blockedStep: recovery.blockedStep,
      suggestedPrompt,
      plan: currentPlan,
    };
  }

  const remainingRows = planRows.filter((row) => {
    const meta = storedPlanMeta(row.payload);
    return Boolean(meta && meta.step >= recovery.blockedStep);
  });
  if (!remainingRows.length) throw new Error("PLAN_RECOVERY_EMPTY");

  const newPlanId = randomUUID();
  const newProposalIds = remainingRows.map(() => randomUUID());
  const expiresAt = new Date(Date.now() + PLAN_TTL_MS).toISOString();
  const conversationId = blockedRow.conversation_id || planRows[0].conversation_id;
  const client = createBillingServiceClient(actor);
  const nextAttempt = blockedMeta.recoveryAttempt + 1;

  const newRows = remainingRows.map((row, index) => {
    const oldMeta = storedPlanMeta(row.payload);
    const { __orbyven_plan: _oldPlan, ...businessPayload } = row.payload;
    void _oldPlan;
    return {
      id: newProposalIds[index],
      organization_id: actor.organizationId,
      actor_id: actor.userId,
      action_type: row.action_type,
      payload: {
        ...businessPayload,
        __orbyven_plan: {
          id: newPlanId,
          step: index + 1,
          total: remainingRows.length,
          dependsOnProposalId: index > 0 ? newProposalIds[index - 1] : null,
          sourcePrompt: oldMeta?.sourcePrompt || null,
          planPrompt: oldMeta?.planPrompt || blockedMeta.planPrompt || null,
          rootPlanId: blockedMeta.rootPlanId || planId,
          recoveryAttempt: nextAttempt,
          recoveredFromPlanId: planId,
          recoveredFromStep: recovery.blockedStep,
        },
      },
      summary: row.summary,
      conversation_id: conversationId,
      expires_at: expiresAt,
    };
  });

  const { error: insertError } = await client.from("ai_action_proposals").insert(newRows);
  if (insertError) throw insertError;

  const obsoleteIds = remainingRows
    .filter((row) => row.status === "pending")
    .map((row) => row.id);
  if (obsoleteIds.length) {
    const { error: obsoleteError } = await client
      .from("ai_action_proposals")
      .update({
        status: "rejected",
        failure_code: "PLAN_SUPERSEDED_BY_RECOVERY",
        updated_at: new Date().toISOString(),
      })
      .in("id", obsoleteIds)
      .eq("organization_id", actor.organizationId)
      .eq("actor_id", actor.userId)
      .eq("status", "pending");
    if (obsoleteError) console.error("ORBYVEN plan supersede marker failed", obsoleteError.code);
  }

  const { error: auditError } = await client.from("platform_audit_log").insert({
    actor_user_id: actor.userId,
    actor_role: actor.role,
    organization_id: actor.organizationId,
    action: "ai_plan.recovered",
    target_type: "ai_plan",
    target_id: newPlanId,
    metadata: {
      previous_plan_id: planId,
      new_plan_id: newPlanId,
      root_plan_id: blockedMeta.rootPlanId || planId,
      blocked_step: recovery.blockedStep,
      recovery_reason: recovery.reason,
      recovery_attempt: nextAttempt,
      remaining_steps: remainingRows.length,
      execution: "proposal_only_explicit_confirmation_required",
    },
  });
  if (auditError) console.error("ORBYVEN Plan Recovery audit mirror failed", auditError.code);

  const storedNewRows: StoredPlanProposal[] = newRows.map((row) => ({
    id: row.id,
    action_type: row.action_type,
    payload: row.payload,
    summary: row.summary,
    status: "pending",
    expires_at: row.expires_at,
    created_at: new Date().toISOString(),
    failure_code: null,
    conversation_id: row.conversation_id,
  }));
  const recoveredPlan = buildPlanAction(storedNewRows);
  const message =
    "Am reconstruit planul de la pasul " + recovery.blockedStep +
    ". Continuarea are " + remainingRows.length +
    " pași și fiecare trebuie confirmat separat.";

  if (conversationId) {
    try {
      await appendAssistantConversationMessage(actor, conversationId, {
        specialist: "operations",
        content: message,
        facts: [
          { label: "Recovery", value: "Pas " + recovery.blockedStep },
          { label: "Pași rămași", value: String(remainingRows.length) },
          { label: "Confirmare", value: "Individuală" },
        ],
      });
    } catch (historyError) {
      console.error("ORBYVEN Plan Recovery history persistence failed", historyError);
    }
  }

  return {
    mode: "recovered",
    message,
    plan: recoveredPlan,
  };
}
