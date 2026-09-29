export type LanguageProvider = "openai";

export type LanguageRuntimeConfig = {
  provider: LanguageProvider;
  apiKey: string;
  model: string;
  dailyLimit: number;
  minuteLimit: number;
};

export type LanguageReadiness = {
  runtimeStatus: "disabled" | "blocked" | "ready";
  enabledRequested: boolean;
  providerConfigured: boolean;
  provider: LanguageProvider | null;
  credentialConfigured: boolean;
  modelConfigured: boolean;
  model: string | null;
  vendorReviewConfirmed: boolean;
  privacyReviewConfirmed: boolean;
  dailyLimit: number;
  minuteLimit: number;
  blockers: string[];
};

function enabled(name: string) {
  return process.env[name]?.trim().toLowerCase() === "true";
}

function boundedInt(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export function getLanguageReadiness(): LanguageReadiness {
  const enabledRequested = enabled("ORBYVEN_LANGUAGE_LAYER_ENABLED");
  const providerValue = process.env.ORBYVEN_LANGUAGE_PROVIDER?.trim().toLowerCase() ?? "";
  const providerConfigured = providerValue === "openai";
  const provider: LanguageProvider | null = providerConfigured ? "openai" : null;
  const credentialConfigured = Boolean(
    process.env.ORBYVEN_LANGUAGE_OPENAI_API_KEY?.trim()
  );
  const rawModel = process.env.ORBYVEN_LANGUAGE_MODEL?.trim() ?? "";
  const modelConfigured = Boolean(rawModel && rawModel.length <= 120);
  const vendorReviewConfirmed = enabled("ORBYVEN_LANGUAGE_VENDOR_REVIEWED");
  const privacyReviewConfirmed = enabled("ORBYVEN_LANGUAGE_PRIVACY_REVIEWED");
  const dailyLimit = boundedInt(process.env.ORBYVEN_LANGUAGE_DAILY_LIMIT, 30, 1, 200);
  const minuteLimit = boundedInt(process.env.ORBYVEN_LANGUAGE_MINUTE_LIMIT, 4, 1, 20);

  const blockers: string[] = [];
  if (!enabledRequested) blockers.push("layer_disabled");
  if (!providerConfigured) blockers.push("provider_missing");
  if (!credentialConfigured) blockers.push("credential_missing");
  if (!modelConfigured) blockers.push("model_missing");
  if (!vendorReviewConfirmed) blockers.push("vendor_review_missing");
  if (!privacyReviewConfirmed) blockers.push("privacy_review_missing");

  return {
    runtimeStatus: !enabledRequested
      ? "disabled"
      : blockers.length
        ? "blocked"
        : "ready",
    enabledRequested,
    providerConfigured,
    provider,
    credentialConfigured,
    modelConfigured,
    model: modelConfigured ? rawModel : null,
    vendorReviewConfirmed,
    privacyReviewConfirmed,
    dailyLimit,
    minuteLimit,
    blockers,
  };
}

export function getLanguageRuntimeConfig(): LanguageRuntimeConfig | null {
  const readiness = getLanguageReadiness();
  if (readiness.runtimeStatus !== "ready" || readiness.provider !== "openai") {
    return null;
  }

  const apiKey = process.env.ORBYVEN_LANGUAGE_OPENAI_API_KEY?.trim() ?? "";
  if (!apiKey || !readiness.model) return null;

  return {
    provider: "openai",
    apiKey,
    model: readiness.model,
    dailyLimit: readiness.dailyLimit,
    minuteLimit: readiness.minuteLimit,
  };
}
