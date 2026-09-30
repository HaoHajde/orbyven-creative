import { createBillingServiceClient, type BillingActor } from "@/lib/billing/supabase-server";
import type { IntelligenceConversationMessage } from "@/lib/ai/conversation-server";

const MAX_ENTITY_CONTEXT_AGE_MS = 30 * 60 * 1000;
const CLIENT_REF =
  /\bclient(?:ul|ului)\s+(?:acela|acesta|asta|respectiv(?:ul)?|de mai sus|anterior|precedent|despre care (?:vorbeam|am vorbit))\b/;
const WORK_REF =
  /\blucrare(?:a|ii)\s+(?:aceea|aceasta|asta|respectiv(?:a)?|de mai sus|anterioara|precedenta|despre care (?:vorbeam|am vorbit))\b/;
const EXPLICIT_CLIENT = /(?:^|[,;\n]\s*)client\s*:/;
const EXPLICIT_WORK = /(?:^|[,;\n]\s*)lucrare\s*:/;

type EntityKind = "client" | "work";

export type ContextEntityResolution = {
  effectivePrompt: string;
  usedContext: boolean;
  facts: Array<{ label: string; value: string }>;
  clarification: string | null;
};

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ro-RO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function factValue(
  message: IntelligenceConversationMessage,
  label: string
): string | null {
  const normalizedLabel = normalize(label);
  const match = message.facts.find((fact) => normalize(fact.label) === normalizedLabel);
  return match?.value?.trim() || null;
}

function candidatesFromMessage(
  message: IntelligenceConversationMessage,
  kind: EntityKind
): string[] {
  if (message.role !== "assistant") return [];

  if (kind === "client") {
    const direct = factValue(message, "Client");
    if (direct) return [direct];

    const type = normalize(factValue(message, "Tip") || "");
    const name = factValue(message, "Nume");
    if (type === "client" && name) return [name];
    return [];
  }

  const direct = factValue(message, "Lucrare");
  if (direct) return [direct];

  const type = normalize(factValue(message, "Tip") || "");
  const title = factValue(message, "Titlu");
  if (type === "lucrare" && title) return [title];
  return [];
}

function latestCandidate(
  messages: IntelligenceConversationMessage[],
  kind: EntityKind,
  now: Date
): { value: string | null; stale: boolean } {
  const recent = messages.slice(-10);

  for (let index = recent.length - 1; index >= 0; index -= 1) {
    const message = recent[index];
    const values = [...new Set(candidatesFromMessage(message, kind).map((value) => value.trim()).filter(Boolean))];
    if (!values.length) continue;

    const age = now.getTime() - new Date(message.createdAt).getTime();
    const stale = !Number.isFinite(age) || age < 0 || age > MAX_ENTITY_CONTEXT_AGE_MS;
    if (values.length !== 1) return { value: null, stale };
    return { value: values[0], stale };
  }

  return { value: null, stale: false };
}

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

  const target = normalize(candidate);
  const unique = new Map<string, { id: string; name: string; company: string | null }>();
  for (const row of [...(nameResult.data ?? []), ...(companyResult.data ?? [])]) unique.set(row.id, row);

  const matches = [...unique.values()].filter(
    (row) =>
      normalize(row.name) === target ||
      (row.company ? normalize(row.company) === target : false)
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
  const target = normalize(candidate);
  const matches = (data ?? []).filter((row) => normalize(row.title) === target);

  if (matches.length === 1) return "valid";
  if (!matches.length) return "missing";
  return "ambiguous";
}

function clarificationFor(kind: EntityKind, reason: "missing_context" | "stale" | "missing" | "ambiguous") {
  const noun = kind === "client" ? "client" : "lucrare";
  if (reason === "stale") {
    return `Referința la ${noun} este prea veche ca să o folosesc în siguranță. Spune-mi explicit ${kind === "client" ? "clientul" : "lucrarea"}.`;
  }
  if (reason === "ambiguous") {
    return `Am mai multe potriviri posibile pentru ${noun}. Spune-mi explicit ${kind === "client" ? "clientul" : "lucrarea"} pe care o vrei.`;
  }
  if (reason === "missing") {
    return `Entitatea menționată anterior nu mai poate fi verificată în acest workspace. Spune-mi explicit ${kind === "client" ? "clientul" : "lucrarea"}.`;
  }
  return `Nu am un ${noun} recent și verificabil la care să se refere mesajul. Spune-mi explicit ${kind === "client" ? "clientul" : "lucrarea"}.`;
}

export async function resolveContextualEntityReferences(
  actor: BillingActor,
  prompt: string,
  messages: IntelligenceConversationMessage[],
  now = new Date()
): Promise<ContextEntityResolution> {
  const cleanPrompt = prompt.trim();
  const normalized = normalize(cleanPrompt);

  const wantsClient = CLIENT_REF.test(normalized) && !EXPLICIT_CLIENT.test(normalized);
  const wantsWork = WORK_REF.test(normalized) && !EXPLICIT_WORK.test(normalized);

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

    const candidate = latestCandidate(messages, kind, now);
    if (!candidate.value) {
      return {
        effectivePrompt: cleanPrompt,
        usedContext: false,
        facts: [],
        clarification: clarificationFor(kind, candidate.stale ? "stale" : "missing_context"),
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

    const validation = kind === "client"
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
