import {
  BILLING_COMMITMENT_MONTHS, BILLING_PLANS, LEGAL_DOCUMENT_VERSION,
  PUBLIC_PRICE_TAX_LABEL, BILLING_CHECKOUT_ACKNOWLEDGEMENT,
  type BillingPlanId,
} from "@/lib/billing/public-config";
import { legalConfig } from "@/lib/legal-config";
import { billingServerConfig, getStripePriceId } from "@/lib/billing/server-config";
import { validateCheckoutPrice, type CheckoutPrice } from "@/lib/billing/order-evidence-guards";
export { hashOrderOffer } from "@/lib/billing/order-offer-hash";

export { parseVerifiedCheckoutOutcome, OrderEvidenceError } from "@/lib/billing/order-evidence-guards";

export function requirePublishedStripePrice(planId: BillingPlanId, price: CheckoutPrice) {
  return validateCheckoutPrice(price,{
    priceId:getStripePriceId(planId),
    amountMinor:BILLING_PLANS[planId].priceLei*100,
    live:billingServerConfig.stripeMode==="live",
    taxLabel:PUBLIC_PRICE_TAX_LABEL,
  });
}

export function createOrderOfferSnapshot(planId:BillingPlanId,price:StripePriceEvidence) {
  const plan=BILLING_PLANS[planId];
  return {
    schema_version:1,
    product_kind:"B2B SaaS subscription",
    plan_id:planId,
    plan_name:plan.name,
    plan_description:plan.description,
    included_modules:[...plan.entitlements],
    recurring_interval:"month",
    recurring_interval_count:1,
    commitment_months:BILLING_COMMITMENT_MONTHS,
    displayed_monthly_amount_minor:plan.priceLei*100,
    displayed_currency:"ron",
    displayed_tax_label:PUBLIC_PRICE_TAX_LABEL,
    stripe_price_id:price.id,
    stripe_tax_behavior:price.tax_behavior,
    legal_document_version:LEGAL_DOCUMENT_VERSION,
    legal_documents:["/legal/terms","/legal/subscriptions","/legal/privacy"],
    acknowledgement_text:BILLING_CHECKOUT_ACKNOWLEDGEMENT,
    merchant_key:legalConfig.entityKey || null,
    merchant_type:legalConfig.entityType,
    merchant_legal_name:legalConfig.legalName || null,
    merchant_tax_id:legalConfig.taxId || null,
    // Stripe-hosted checkout may have a different final total if a separately
    // displayed discount is added by the payment provider; record it via webhook.
    final_amount_source:"verified checkout.session.completed webhook",
  } as const;
}

