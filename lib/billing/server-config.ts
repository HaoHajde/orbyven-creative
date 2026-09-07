import { legalConfig } from "@/lib/legal-config";
import type { BillingPlanId } from "@/lib/billing/public-config";

const env = (name: string) => process.env[name]?.trim() ?? "";

const priceIds: Record<BillingPlanId, string> = {
  start: env("STRIPE_PRICE_START"),
  business: env("STRIPE_PRICE_BUSINESS"),
  pro: env("STRIPE_PRICE_PRO"),
};

export const billingServerConfig = {
  enabled: env("ORBYVEN_BILLING_ENABLED") === "true",
  stripeSecretKey: env("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: env("STRIPE_WEBHOOK_SECRET"),
  stripePortalConfigurationId: env("STRIPE_PORTAL_CONFIGURATION_ID"),
  supabaseServiceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY"),
  priceIds,
} as const;

export function getBillingReadiness() {
  const missing: string[] = [];

  if (!billingServerConfig.enabled) missing.push("ORBYVEN_BILLING_ENABLED");
  if (!legalConfig.isComplete) missing.push("legal operator data");
  if (!billingServerConfig.stripeSecretKey) missing.push("STRIPE_SECRET_KEY");
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
  if (!process.env.NEXT_PUBLIC_ORBYVEN_PRICE_TAX_LABEL?.trim()) {
    missing.push("NEXT_PUBLIC_ORBYVEN_PRICE_TAX_LABEL");
  }

  return {
    ready: missing.length === 0,
    enabled: billingServerConfig.enabled,
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
