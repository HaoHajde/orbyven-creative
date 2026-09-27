import { billingServerConfig } from "@/lib/billing/server-config";
import { commercialIdentity } from "@/lib/commercial-identity";
import { verifyStripeWebhook } from "@/lib/billing/stripe-webhook";

/** A signature binds one event to ONE Stripe merchant account. */
export function verifiedWebhookMerchant(payload: string, signature: string): string | null {
  const current = billingServerConfig.stripeWebhookSecret;
  if (current && commercialIdentity.entityKey &&
      verifyStripeWebhook(payload, signature, current)) {
    return commercialIdentity.entityKey;
  }
  const archived = billingServerConfig.stripeArchiveWebhookSecret;
  const archiveKey = billingServerConfig.stripeArchiveMerchantKey;
  if (archived && archiveKey && archiveKey !== commercialIdentity.entityKey &&
      verifyStripeWebhook(payload, signature, archived)) {
    return archiveKey;
  }
  return null;
}

export function archivedPortalReady(merchantKey: string) {
  return Boolean(
    merchantKey &&
    merchantKey === billingServerConfig.stripeArchiveMerchantKey &&
    merchantKey !== commercialIdentity.entityKey &&
    billingServerConfig.stripeArchiveSecretKey &&
    billingServerConfig.stripeArchivePortalConfigurationId
  );
}
