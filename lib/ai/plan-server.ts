import { randomUUID } from "node:crypto";
import type { BillingActor } from "@/lib/billing/supabase-server";
import { createBillingServiceClient } from "@/lib/billing/supabase-server";
import { parseMutationPrompt, type ParsedMutation } from "@/lib/ai/action-parser";
import { applyPlanBindings, splitPlanClauses, type PlanBindings } from "@/lib/ai/plan-core";
import type { IntelligenceMutationType, IntelligenceResponse } from "@/lib/ai/intelligence-types";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

const PLAN_ROLES = new Set(["owner", "admin", "manager", "member"]);
const PLAN_TTL_MS = 30 * 60 * 1000;

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

  const timeZone = await organizationTimeZone(actor.organizationId);
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
        actions: [],
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
  const client = createBillingServiceClient();

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

type StoredPlanProposal = {
  id: string;
  action_type: IntelligenceMutationType;
  payload: Record<string, unknown>;
  summary: string;
  status: "pending" | "executing" | "executed" | "rejected" | "expired" | "failed";
  expires_at: string;
  created_at: string;
};

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
  if (!/^[a-f0-9-]{36}$/i.test(id) || !Number.isInteger(step) || !Number.isInteger(total)) return null;
  if (step < 1 || total < step || total > 8) return null;
  return { id, step, total, dependency };
}

export async function loadLatestPlanAction(
  actor: BillingActor,
  conversationId: string
): Promise<Extract<IntelligenceResponse["actions"][number], { kind: "review_plan" }> | null> {
  const client = createBillingServiceClient();
  const { data, error } = await client
    .from("ai_action_proposals")
    .select("id,action_type,payload,summary,status,expires_at,created_at")
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

  const now = Date.now();
  const byId = new Map(planRows.map((row) => [row.id, row]));
  const steps = planRows.map((row) => {
    const meta = storedPlanMeta(row.payload);
    if (!meta) throw new Error("PLAN_METADATA_INVALID");

    const expired = new Date(row.expires_at).getTime() <= now;
    let status: "ready" | "locked" | "executed" | "rejected" | "expired" | "failed";

    if (row.status === "executed") status = "executed";
    else if (row.status === "rejected") status = "rejected";
    else if (row.status === "failed") status = "failed";
    else if (row.status === "expired" || expired) status = "expired";
    else if (row.status === "pending") {
      const dependency = meta.dependency ? byId.get(meta.dependency) : null;
      status = !dependency || dependency.status === "executed" ? "ready" : "locked";
    } else {
      status = "locked";
    }

    return {
      proposalId: row.id,
      index: meta.step,
      summary: row.summary,
      actionType: row.action_type,
      targetModule:
        row.action_type === "create_lead" || row.action_type === "create_client" ? "leads" as const :
        row.action_type === "create_task" ? "tasks" as const :
        row.action_type === "create_calendar_event" ? "calendar" as const :
        row.action_type === "create_estimate" ? "estimates" as const :
        "documents" as const,
      status,
    };
  });

  return {
    kind: "review_plan",
    label: steps.every((step) => step.status === "executed") ? "Plan finalizat" : "Revizuiește planul",
    planId: firstMeta.id,
    expiresAt: planRows[0]?.expires_at ?? firstPlanRow.expires_at,
    steps,
  };
}
