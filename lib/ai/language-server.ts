import { createBillingServiceClient, type BillingActor } from "@/lib/billing/supabase-server";
import type { IntelligenceResponse } from "@/lib/ai/intelligence-types";
import {
  languageOutputPreservesExecutionClaims,
  languageOutputPreservesNumbers,
  shouldUseLanguageLayer,
} from "@/lib/ai/language-policy";

type LanguageConfig = {
  provider: "openai";
  apiKey: string;
  model: string;
  dailyLimit: number;
  minuteLimit: number;
};

type OpenAiResponsePayload = {
  output_text?: unknown;
  output?: Array<{
    type?: unknown;
    content?: Array<{ type?: unknown; text?: unknown }>;
  }>;
  usage?: {
    input_tokens?: unknown;
    output_tokens?: unknown;
  };
};

function boundedInt(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function languageConfig(): LanguageConfig | null {
  if (process.env.ORBYVEN_LANGUAGE_LAYER_ENABLED?.trim().toLowerCase() !== "true") {
    return null;
  }
  if (process.env.ORBYVEN_LANGUAGE_PROVIDER?.trim().toLowerCase() !== "openai") {
    return null;
  }

  const apiKey = process.env.ORBYVEN_LANGUAGE_OPENAI_API_KEY?.trim() ?? "";
  const model = process.env.ORBYVEN_LANGUAGE_MODEL?.trim() ?? "";
  if (!apiKey || !model || model.length > 120) return null;

  return {
    provider: "openai",
    apiKey,
    model,
    dailyLimit: boundedInt(process.env.ORBYVEN_LANGUAGE_DAILY_LIMIT, 30, 1, 200),
    minuteLimit: boundedInt(process.env.ORBYVEN_LANGUAGE_MINUTE_LIMIT, 4, 1, 20),
  };
}

function extractOutputText(payload: OpenAiResponsePayload): string {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const chunks: string[] = [];
  for (const item of payload.output ?? []) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type === "output_text" && typeof part.text === "string") {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

async function claimLanguageQuota(
  actor: BillingActor,
  conversationId: string | null,
  config: LanguageConfig
): Promise<string | null> {
  const client = createBillingServiceClient(actor);
  const { data, error } = await client.rpc("ai_language_claim", {
    p_organization_id: actor.organizationId,
    p_actor_id: actor.userId,
    p_conversation_id: conversationId,
    p_provider: config.provider,
    p_model: config.model,
    p_daily_limit: config.dailyLimit,
    p_minute_limit: config.minuteLimit,
  });
  if (error) {
    console.error("ORBYVEN Language quota unavailable", error.code);
    return null;
  }
  const result = data as { allowed?: boolean; requestId?: string } | null;
  return result?.allowed && typeof result.requestId === "string"
    ? result.requestId
    : null;
}

async function finishLanguageQuota(
  actor: BillingActor,
  requestId: string,
  success: boolean,
  usage: { input: number; output: number },
  failureCode?: string
) {
  const client = createBillingServiceClient();
  const { error } = await client.rpc("ai_language_finish", {
    p_request_id: requestId,
    p_success: success,
    p_input_tokens: usage.input,
    p_output_tokens: usage.output,
    p_failure_code: failureCode ?? null,
  });
  if (error) console.error("ORBYVEN Language finalize failed", error.code);
}

function usageFrom(payload: OpenAiResponsePayload) {
  const input = Number(payload.usage?.input_tokens ?? 0);
  const output = Number(payload.usage?.output_tokens ?? 0);
  return {
    input: Number.isSafeInteger(input) && input > 0 ? input : 0,
    output: Number.isSafeInteger(output) && output > 0 ? output : 0,
  };
}

export async function maybePolishIntelligenceResponse(
  actor: BillingActor,
  conversationId: string | null,
  prompt: string,
  response: IntelligenceResponse
): Promise<IntelligenceResponse & { languageEnhanced?: boolean }> {
  const config = languageConfig();
  if (!config || !shouldUseLanguageLayer(prompt, response)) return response;

  const requestId = await claimLanguageQuota(actor, conversationId, config);
  if (!requestId) return response;

  const canonicalPayload = JSON.stringify({
    user_request: prompt.slice(0, 1200),
    canonical_answer: response.answer,
    authoritative_facts: response.facts,
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        store: false,
        instructions:
          "Ești ORBYVEN Language Layer. Reformulează exclusiv răspunsul canonic în română clară și naturală. " +
          "Datele din canonical_answer și authoritative_facts sunt singurele fapte permise. " +
          "Nu adăuga nume, cifre, date, sume, procente, statusuri sau acțiuni. Nu afirma că ai creat, modificat, trimis sau plătit ceva. " +
          "Nu schimba sensul și nu contrazice faptele. Maximum 5 fraze, text simplu, fără markdown.",
        input: canonicalPayload,
        max_output_tokens: 300,
        text: { verbosity: "low" },
      }),
    });

    if (!upstream.ok) {
      await finishLanguageQuota(actor, requestId, false, { input: 0, output: 0 }, `HTTP_${upstream.status}`);
      return response;
    }

    const payload = (await upstream.json()) as OpenAiResponsePayload;
    const usage = usageFrom(payload);
    const polished = extractOutputText(payload).slice(0, 1800).trim();
    if (
      !polished ||
      !languageOutputPreservesNumbers(polished, canonicalPayload) ||
      !languageOutputPreservesExecutionClaims(polished, canonicalPayload)
    ) {
      await finishLanguageQuota(actor, requestId, false, usage, "OUTPUT_GUARD");
      return response;
    }

    await finishLanguageQuota(actor, requestId, true, usage);
    return {
      ...response,
      answer: polished,
      languageEnhanced: true,
    };
  } catch (error) {
    const code = error instanceof Error && error.name === "AbortError"
      ? "TIMEOUT"
      : "UPSTREAM_ERROR";
    await finishLanguageQuota(actor, requestId, false, { input: 0, output: 0 }, code);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
