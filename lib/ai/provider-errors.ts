/**
 * Classifies OpenAI failures without showing the provider's raw JSON or the
 * credential to clients. A 429 may mean credits/spend limit OR rate throttling.
 */
export type OpenAiFailureCode =
  | "OPENAI_CREDITS"
  | "OPENAI_BILLING_LIMIT"
  | "OPENAI_USAGE_LIMIT"
  | "OPENAI_TEMP_LIMIT"
  | "OPENAI_BAD_KEY"
  | "OPENAI_ACCESS_DENIED"
  | "OPENAI_BAD_REQUEST"
  | "OPENAI_PROVIDER_UNAVAILABLE";

type ProviderPayload = {
  error?: { code?: unknown; type?: unknown };
};

export async function classifyOpenAiError(
  response: Pick<Response, "status" | "json">
): Promise<OpenAiFailureCode> {
  let data: ProviderPayload | null = null;
  try {
    data = await response.json() as ProviderPayload;
  } catch {
    // Preserve a generic classification for non-JSON upstream failures.
  }

  const errorCode = typeof data?.error?.code === "string"
    ? data.error.code.toLowerCase() : "";
  const errorType = typeof data?.error?.type === "string"
    ? data.error.type.toLowerCase() : "";

  if (errorCode === "credit_balance_exhausted") return "OPENAI_CREDITS";
  if ([
    "organization_spend_limit_exceeded",
    "project_spend_limit_exceeded",
    "billing_hard_limit_reached",
  ].includes(errorCode)) return "OPENAI_BILLING_LIMIT";
  if (errorCode === "organization_usage_limit_exceeded") return "OPENAI_USAGE_LIMIT";
  if (errorCode === "insufficient_quota" || errorType === "insufficient_quota") {
    return "OPENAI_CREDITS";
  }
  if (response.status === 401 || errorCode === "invalid_api_key") return "OPENAI_BAD_KEY";
  if (response.status === 403) return "OPENAI_ACCESS_DENIED";
  if (response.status === 429) return "OPENAI_TEMP_LIMIT";
  if (response.status === 400 || response.status === 404) return "OPENAI_BAD_REQUEST";
  return "OPENAI_PROVIDER_UNAVAILABLE";
}
