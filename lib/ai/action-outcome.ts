import type { BillingActor } from "@/lib/billing/supabase-server";
import { answerIntelligenceForActor } from "@/lib/ai/intelligence-server";
import {
  loadRecentConversationContext,
  persistAssistantResponse,
} from "@/lib/ai/conversation-server";
import { loadLatestPlanAction } from "@/lib/ai/plan-server";
import type { IntelligenceResponse } from "@/lib/ai/intelligence-types";

function normalize(value: string | undefined) {
  return (value || "")
    .trim()
    .toLocaleLowerCase("ro-RO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function fact(
  facts: Array<{ label: string; value: string }>,
  label: string
) {
  return facts.find((item) => item.label === label)?.value?.trim();
}

function previousFocusFromMessages(
  messages: Awaited<ReturnType<typeof loadRecentConversationContext>>
) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const facts = messages[index].facts;
    const decision = fact(facts, "Decision · Context");
    if (decision) return decision;
    const focus = fact(facts, "Focus #1");
    if (focus) return focus;
  }
  return undefined;
}

function outcomeAlreadyRecorded(
  messages: Awaited<ReturnType<typeof loadRecentConversationContext>>,
  planId: string
) {
  return messages.some((message) =>
    message.facts.some(
      (row) => row.label === "Outcome · Plan" && row.value === planId
    )
  );
}

export async function recheckActionOutcome(
  actor: BillingActor,
  conversationId: string,
  planId: string
): Promise<IntelligenceResponse> {
  const plan = await loadLatestPlanAction(actor, conversationId);
  if (!plan || plan.planId !== planId) throw new Error("OUTCOME_PLAN_NOT_FOUND");
  if (!plan.steps.length || !plan.steps.every((step) => step.status === "executed")) {
    throw new Error("OUTCOME_PLAN_NOT_COMPLETE");
  }

  const messages = await loadRecentConversationContext(actor, conversationId, 12);
  const previousFocus = previousFocusFromMessages(messages);
  const alreadyRecorded = outcomeAlreadyRecorded(messages, planId);

  const current = await answerIntelligenceForActor(
    actor,
    "Fă-mi briefingul zilei",
    conversationId
  );
  const currentFocus = fact(current.facts, "Focus #1");

  let status: "no_longer_primary" | "shifted" | "still_priority";
  if (!currentFocus) {
    status = "no_longer_primary";
  } else if (previousFocus && normalize(previousFocus) === normalize(currentFocus)) {
    status = "still_priority";
  } else {
    status = "shifted";
  }

  const summary =
    status === "no_longer_primary"
      ? "Focus-ul urmărit nu mai apare ca prioritate principală după pregătirea acțiunilor. Acest re-check nu confirmă finalizarea lucrării din teren."
      : status === "still_priority"
        ? "Focus-ul anterior este încă prioritatea principală și merită reevaluat înainte de o nouă acțiune."
        : previousFocus
          ? "Prioritatea principală s-a mutat după executarea planului."
          : "Planul este finalizat, iar ORBYVEN a recalculat noua prioritate principală.";

  const answer =
    status === "no_longer_primary"
      ? "Planul ORBYVEN a fost pregătit și confirmat. Re-check-ul nu mai vede problema urmărită ca Focus #1, dar asta nu înseamnă automat că execuția din teren este finalizată."
      : status === "still_priority"
        ? `Plan finalizat, dar „${currentFocus}” rămâne Focus #1. Nu pornesc automat o nouă acțiune; poți cere o nouă comparație dacă vrei să continui.`
        : `Plan finalizat. Focus-ul s-a mutat${previousFocus ? ` de la „${previousFocus}”` : ""}${currentFocus ? ` la „${currentFocus}”` : ""}.`;

  const response: IntelligenceResponse = {
    specialist: "operations",
    answer,
    facts: [
      { label: "Plan", value: "Finalizat" },
      { label: "Rezultat", value: status === "no_longer_primary" ? "Nu mai este Focus #1" : status === "shifted" ? "Focus mutat" : "Încă prioritar" },
      ...(currentFocus ? [{ label: "Focus curent", value: currentFocus.slice(0, 160) }] : []),
    ],
    actions: current.actions.slice(0, 2),
    focus: current.focus,
    outcome: {
      planId,
      status,
      previousFocus,
      currentFocus,
      summary,
      confidence: "high",
    },
    generatedBy: "orbyven_core",
  };

  if (!alreadyRecorded) {
    await persistAssistantResponse(actor, conversationId, response);
  }

  return response;
}
