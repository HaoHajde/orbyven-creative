import { randomUUID } from "node:crypto";
import type { BillingActor } from "@/lib/billing/supabase-server";
import { createBillingServiceClient } from "@/lib/billing/supabase-server";
import { parseMutationPrompt, type ParsedMutation } from "@/lib/ai/action-parser";
import { applyPlanBindings, splitPlanClauses, type PlanBindings } from "@/lib/ai/plan-core";
import type { IntelligenceResponse } from "@/lib/ai/intelligence-types";
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
    if (proposal.payload.clientName) bindings.clientName = proposal.payload.clientName;
    bindings.lastEntity = "work";
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
