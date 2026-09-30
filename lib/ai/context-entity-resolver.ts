import { createBillingServiceClient, type BillingActor } from "@/lib/billing/supabase-server";
import type { IntelligenceConversationMessage } from "@/lib/ai/conversation-server";
import {
  detectContextEntityReferences,
  findLatestContextEntityCandidate,
  normalizeContextEntityText,
} from "@/lib/ai/context-entity-core";

export type ContextEntityResolution = {
  effectivePrompt: string;
  usedContext: boolean;
  facts: Array<{ label: string; value: string }>;
  clarification: string | null;
};

async function validateClient(
  actor: BillingActor,
  candidate: string
): Promise<"valid" | "missing" | "ambiguous"> {
  const client = createBillingServiceClient();
  const [nameResult, companyResult] = await Promise.all([
    client
      .from("crm_leads")
      .select("id,name,company")
      .eq("organization_id", actor.organizationId)
      .ilike("name", candidate)
      .limit(5),
    client
      .from("crm_leads")
      .select("id,name,company")
      .eq("organization_id", actor.organizationId)
      .ilike("company", candidate)
      .limit(5),
  ]);

  if (nameResult.error) throw nameResult.error;
  if (companyResult.error) throw companyResult.error;

  const target = normalizeContextEntityText(candidate);
  const unique = new Map<string, { id: string; name: string; company: string | null }>();
  for (const row of [...(nameResult.data ?? []), ...(companyResult.data ?? [])]) {
    unique.set(row.id, row);
  }

  const matches = [...unique.values()].filter(
    (row) =>
      normalizeContextEntityText(row.name) === target ||
      (row.company ? normalizeContextEntityText(row.company) === target : false)
  );

  if (matches.length === 1) return "valid";
  if (!matches.length) return "missing";
  return "ambiguous";
}

async function validateWork(
  actor: BillingActor,
  candidate: string
): Promise<"valid" | "missing" | "ambiguous"> {
  const client = createBillingServiceClient();
  const { data, error } = await client
    .from("ops_tasks")
    .select("id,title,kind")
    .eq("organization_id", actor.organizationId)
    .eq("kind", "work")
    .ilike("title", candidate)
    .limit(5);

  if (error) throw error;
  const target = normalizeContextEntityText(candidate);
  const matches = (data ?? []).filter(
    (row) => normalizeContextEntityText(row.title) === target
  );

  if (matches.length === 1) return "valid";
  if (!matches.length) return "missing";
  return "ambiguous";
}

function clarificationFor(
  kind: "client" | "work",
  reason: "missing_context" | "stale" | "missing" | "ambiguous"
) {
  const noun = kind === "client" ? "client" : "lucrare";
  const explicit = kind === "client" ? "clientul" : "lucrarea";

  if (reason === "stale") {
    return `Referința la ${noun} este prea veche ca să o folosesc în siguranță. Spune-mi explicit ${explicit}.`;
  }
  if (reason === "ambiguous") {
    return `Am mai multe potriviri posibile pentru ${noun}. Spune-mi explicit ${explicit} pe care o vrei.`;
  }
  if (reason === "missing") {
    return `Entitatea menționată anterior nu mai poate fi verificată în acest workspace. Spune-mi explicit ${explicit}.`;
  }
  return `Nu am un ${noun} recent și verificabil la care să se refere mesajul. Spune-mi explicit ${explicit}.`;
}

export async function resolveContextualEntityReferences(
  actor: BillingActor,
  prompt: string,
  messages: IntelligenceConversationMessage[],
  now = new Date()
): Promise<ContextEntityResolution> {
  const cleanPrompt = prompt.trim();
  const references = detectContextEntityReferences(cleanPrompt);
  const wantsClient = references.client;
  const wantsWork = references.work;

  if (!wantsClient && !wantsWork) {
    return {
      effectivePrompt: cleanPrompt,
      usedContext: false,
      facts: [],
      clarification: null,
    };
  }

  const additions: string[] = [];
  const facts: Array<{ label: string; value: string }> = [];

  for (const kind of ["client", "work"] as const) {
    const requested = kind === "client" ? wantsClient : wantsWork;
    if (!requested) continue;

    const candidate = findLatestContextEntityCandidate(messages, kind, now);
    if (!candidate.value) {
      return {
        effectivePrompt: cleanPrompt,
        usedContext: false,
        facts: [],
        clarification: clarificationFor(
          kind,
          candidate.stale ? "stale" : "missing_context"
        ),
      };
    }

    if (candidate.stale) {
      return {
        effectivePrompt: cleanPrompt,
        usedContext: false,
        facts: [],
        clarification: clarificationFor(kind, "stale"),
      };
    }

    const validation =
      kind === "client"
        ? await validateClient(actor, candidate.value)
        : await validateWork(actor, candidate.value);

    if (validation !== "valid") {
      return {
        effectivePrompt: cleanPrompt,
        usedContext: false,
        facts: [],
        clarification: clarificationFor(kind, validation),
      };
    }

    if (kind === "client") {
      additions.push(`client: ${candidate.value}`);
      facts.push({ label: "Client din context", value: candidate.value });
    } else {
      additions.push(`lucrare: ${candidate.value}`);
      facts.push({ label: "Lucrare din context", value: candidate.value });
    }
  }

  return {
    effectivePrompt: [cleanPrompt, ...additions].join("; ").slice(0, 2400),
    usedContext: additions.length > 0,
    facts,
    clarification: null,
  };
}
