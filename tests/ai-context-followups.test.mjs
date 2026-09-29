import test from "node:test";
import assert from "node:assert/strict";
import { resolveConversationFollowUp } from "../lib/ai/context-resolver.ts";
import { parseMutationPrompt } from "../lib/ai/action-parser.ts";

const now = new Date("2026-09-29T20:30:00.000Z");
const at = (minutesAgo) => new Date(now.getTime() - minutesAgo * 60000).toISOString();

function thread(user, assistant, minutesAgo = 2) {
  return [
    {
      id: "u1",
      role: "user",
      specialist: null,
      content: user,
      facts: [],
      createdAt: at(minutesAgo + 1),
    },
    {
      id: "a1",
      role: "assistant",
      specialist: "operations",
      content: assistant,
      facts: [],
      createdAt: at(minutesAgo),
    },
  ];
}

test("Estimate details can complete the immediately preceding bounded mutation request", () => {
  const context = thread(
    "Creează deviz Renovare baie; client: Exemplu SRL",
    "Adaugă cel puțin o poziție explicită. ORBYVEN nu inventează prețuri."
  );
  const resolved = resolveConversationFollowUp(
    "poziție: Montaj centrală, 1 x 1500 lei",
    context,
    now
  );
  assert.equal(resolved.usedContext, true);
  assert.equal(resolved.reason, "mutation_details");
  const parsed = parseMutationPrompt(resolved.effectivePrompt, { now });
  assert.equal(parsed.kind, "proposal");
  if (parsed.kind === "proposal") {
    assert.equal(parsed.proposal.actionType, "create_estimate");
    assert.equal(parsed.proposal.payload.items[0].unitPriceLei, 1500);
  }
});

test("Document content follow-up stays explicit and still becomes a confirmation proposal", () => {
  const context = thread(
    "Creează document Raport intervenție",
    "Adaugă conținutul explicit al documentului. ORBYVEN nu inventează text juridic."
  );
  const resolved = resolveConversationFollowUp(
    "conținut: Verificare finalizată fără probleme.",
    context,
    now
  );
  assert.equal(resolved.usedContext, true);
  const parsed = parseMutationPrompt(resolved.effectivePrompt, { now });
  assert.equal(parsed.kind, "proposal");
  if (parsed.kind === "proposal") {
    assert.equal(parsed.proposal.actionType, "create_document_draft");
    assert.equal(parsed.proposal.payload.content, "Verificare finalizată fără probleme.");
  }
});

test("Calendar date and time can complete a recent missing-time request", () => {
  const context = thread(
    "Programează o programare Revizie tehnică",
    "Pentru programare am nevoie de dată și oră, de exemplu mâine la 10:30."
  );
  const resolved = resolveConversationFollowUp("mâine la 10:30", context, now);
  assert.equal(resolved.usedContext, true);
  const parsed = parseMutationPrompt(resolved.effectivePrompt, {
    timeZone: "Europe/Bucharest",
    now,
  });
  assert.equal(parsed.kind, "proposal");
  if (parsed.kind === "proposal") {
    assert.equal(parsed.proposal.actionType, "create_calendar_event");
  }
});

test("Old context is never reused for a mutation continuation", () => {
  const context = thread(
    "Creează document Raport vechi",
    "Adaugă conținutul explicit. ORBYVEN nu inventează text.",
    45
  );
  const resolved = resolveConversationFollowUp("conținut: text nou", context, now);
  assert.equal(resolved.usedContext, false);
  assert.equal(resolved.effectivePrompt, "conținut: text nou");
});

test("Explicit new mutation commands never inherit the previous mutation", () => {
  const context = thread(
    "Creează deviz Renovare baie",
    "Adaugă cel puțin o poziție explicită. ORBYVEN nu inventează prețuri."
  );
  const prompt = "Creează lead Mihai Popescu";
  const resolved = resolveConversationFollowUp(prompt, context, now);
  assert.equal(resolved.usedContext, false);
  assert.equal(resolved.effectivePrompt, prompt);
});

test("Ordinary short chat is not rewritten just because a conversation exists", () => {
  const context = thread(
    "Creează document Raport",
    "Adaugă conținutul explicit. ORBYVEN nu inventează text."
  );
  const resolved = resolveConversationFollowUp("Mulțumesc", context, now);
  assert.equal(resolved.usedContext, false);
});
