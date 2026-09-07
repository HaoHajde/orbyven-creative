import { legalConfig } from "@/lib/legal-config";
import type { BillingPlanId } from "@/lib/billing/public-config";

const env = (name: string) => process.env[name]?.trim() ?? "";

const stripeSecretKey = env("STRIPE_SECRET_KEY");
const stripeMode = !stripeSecretKey
  ? "unconfigured"
  : stripeSecretKey.startsWith("sk_test_")
    ? "test"
    : stripeSecretKey.startsWith("sk_live_")
      ? "live"
      : "unknown";

const priceIds: Record<BillingPlanId, string> = {
  start: env("STRIPE_PRICE_START"),
  business: env("STRIPE_PRICE_BUSINESS"),
  pro: env("STRIPE_PRICE_PRO"),
};

export const billingServerConfig = {
  enabled: env("ORBYVEN_BILLING_ENABLED") === "true",
  stripeSecretKey,
  stripeMode,
  stripeLiveConfirmed: env("ORBYVEN_BILLING_LIVE_CONFIRMED") === "true",
  stripeWebhookSecret: env("STRIPE_WEBHOOK_SECRET"),
  stripePortalConfigurationId: env("STRIPE_PORTAL_CONFIGURATION_ID"),
  supabaseServiceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY"),
  priceIds,
} as const;

export function getBillingReadiness() {
  const missing: string[] = [];

  if (!billingServerConfig.enabled) missing.push("ORBYVEN_BILLING_ENABLED");
  if (!billingServerConfig.stripeSecretKey) {
    missing.push("STRIPE_SECRET_KEY");
  } else if (billingServerConfig.stripeMode === "unknown") {
    missing.push("valid STRIPE_SECRET_KEY mode");
  }
  if (!billingServerConfig.stripeWebhookSecret) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!billingServerConfig.stripePortalConfigurationId) {
    missing.push("STRIPE_PORTAL_CONFIGURATION_ID");
  }
  if (!billingServerConfig.supabaseServiceRoleKey) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!priceIds.start) missing.push("STRIPE_PRICE_START");
  if (!priceIds.business) missing.push("STRIPE_PRICE_BUSINESS");
  if (!priceIds.pro) missing.push("STRIPE_PRICE_PRO");

  // Test mode is intentionally allowed before the ORBYVEN legal entity is finalized.
  // Live mode remains fail-closed until legal/fiscal identity is complete and explicitly confirmed.
  if (billingServerConfig.stripeMode === "live") {
    if (!billingServerConfig.stripeLiveConfirmed) {
      missing.push("ORBYVEN_BILLING_LIVE_CONFIRMED");
    }
    if (!legalConfig.isComplete) missing.push("legal operator data");
    if (!process.env.NEXT_PUBLIC_ORBYVEN_PRICE_TAX_LABEL?.trim()) {
      missing.push("NEXT_PUBLIC_ORBYVEN_PRICE_TAX_LABEL");
    }
  }

  return {
    ready: missing.length === 0,
    enabled: billingServerConfig.enabled,
    mode: billingServerConfig.stripeMode,
    missing,
  };
}

export function requireBillingReady() {
  const readiness = getBillingReadiness();
  if (!readiness.ready) {
    throw new Error("ORBYVEN billing is not configured for commercial use.");
  }
  return readiness;
}

export function getStripePriceId(planId: BillingPlanId) {
  const priceId = priceIds[planId];
  if (!priceId) throw new Error(`Stripe price missing for ${planId}.`);
  return priceId;
}
