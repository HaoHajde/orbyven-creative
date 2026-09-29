import type { IntelligenceConversationMessage } from "@/lib/ai/conversation-server";

const MUTATION_VERB = /\b(creeaza|adauga|inregistreaza|deschide|programeaza)\b/;
const DETAIL_LABEL = /\b(client|companie|telefon|email|prioritate|locatie|data|ora|durata|reminder|pozitie|item|discount|tva|manopera|alte costuri|valabil|continut|categorie|nota|lucrare)\s*:/;
const TEMPORAL_DETAIL = /\b(azi|astazi|maine)\b[\s\S]{0,40}\b(?:la\s+)?\d{1,2}(?::\d{2})?\b/;
const NEEDS_DETAILS = /\b(am nevoie|indica|precizeaza|spune-mi|lipsesc|trebuie sa|nu inventeaza|completeaza)\b/;
const MAX_CONTEXT_AGE_MS = 30 * 60 * 1000;

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ro-RO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export type ContextResolution = {
  effectivePrompt: string;
  usedContext: boolean;
  reason: "mutation_details" | null;
};

export function resolveConversationFollowUp(
  prompt: string,
  messages: IntelligenceConversationMessage[],
  now = new Date()
): ContextResolution {
  const cleanPrompt = prompt.trim();
  const normalized = normalize(cleanPrompt);

  if (
    !cleanPrompt ||
    MUTATION_VERB.test(normalized) ||
    (!DETAIL_LABEL.test(normalized) && !TEMPORAL_DETAIL.test(normalized))
  ) {
    return { effectivePrompt: cleanPrompt, usedContext: false, reason: null };
  }

  const recent = messages.slice(-6);
  const lastAssistantIndex = [...recent]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find(({ message }) => message.role === "assistant")?.index;

  if (lastAssistantIndex === undefined) {
    return { effectivePrompt: cleanPrompt, usedContext: false, reason: null };
  }

  const assistant = recent[lastAssistantIndex];
  const assistantAge = now.getTime() - new Date(assistant.createdAt).getTime();
  if (!Number.isFinite(assistantAge) || assistantAge < 0 || assistantAge > MAX_CONTEXT_AGE_MS) {
    return { effectivePrompt: cleanPrompt, usedContext: false, reason: null };
  }

  if (!NEEDS_DETAILS.test(normalize(assistant.content))) {
    return { effectivePrompt: cleanPrompt, usedContext: false, reason: null };
  }

  const previousUser = [...recent.slice(0, lastAssistantIndex)]
    .reverse()
    .find((message) => message.role === "user");

  if (!previousUser || !MUTATION_VERB.test(normalize(previousUser.content))) {
    return { effectivePrompt: cleanPrompt, usedContext: false, reason: null };
  }

  const combined = `${previousUser.content.trim()}; ${cleanPrompt}`.slice(0, 2400);
  return {
    effectivePrompt: combined,
    usedContext: true,
    reason: "mutation_details",
  };
}
