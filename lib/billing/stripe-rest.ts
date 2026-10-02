import { BILLING_PLANS, type BillingPlanId } from "@/lib/billing/public-config";
import {
  billingServerConfig,
  getStripePriceId,
  requireBillingReady,
  requireCheckoutReady,
  requirePublicCheckoutReady,
} from "@/lib/billing/server-config";
import { getSiteUrl } from "@/lib/site-config";
import { commercialIdentity } from "@/lib/commercial-identity";
import { PUBLIC_OFFERS, type PublicOfferId } from "@/lib/commerce/public-offers";
import type { CheckoutPrice } from "@/lib/billing/order-evidence-guards";

type StripeCheckoutSession = {
  id: string;
  url: string | null;
  customer: string | null;
  subscription: string | null;
};

type StripePortalSession = {
  id: string;
  url: string;
};

async function stripePost<T>(
  path: string,
  params: URLSearchParams,
  archived = false,
  readiness: "billing" | "public" = "billing"
): Promise<T> {
  if (readiness === "public") requirePublicCheckoutReady();
  else requireBillingReady();
  const apiKey = archived
    ? billingServerConfig.stripeArchiveSecretKey
    : billingServerConfig.stripeSecretKey;
  if (!apiKey) throw new Error("Selected merchant Stripe API credentials are unavailable.");

  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
    cache: "no-store",
  });

  const payload = (await response.json()) as T & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || "Stripe request failed.");
  }

  return payload;
}

export async function retrieveStripePlanPrice(planId: BillingPlanId): Promise<CheckoutPrice> {
  requireCheckoutReady();
  const response = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(getStripePriceId(planId))}`, {
    headers: { Authorization: `Bearer ${billingServerConfig.stripeSecretKey}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to verify the configured Stripe price.");
  return await response.json() as CheckoutPrice;
}

export async function createStripeCheckoutSession(input: {
  organizationId: string;
  planId: BillingPlanId;
  orderEvidenceId: string;
  customerId?: string | null;
  email?: string | null;
}) {
  requireCheckoutReady();
  const plan = BILLING_PLANS[input.planId];
  const params = new URLSearchParams();
  const siteUrl = getSiteUrl();

  params.set("mode", "subscription");
  params.set("client_reference_id", input.organizationId);
  params.set("line_items[0][price]", getStripePriceId(input.planId));
  params.set("line_items[0][quantity]", "1");
  params.set(
    "success_url",
    `${siteUrl}/workspace/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`
  );
  params.set("cancel_url", `${siteUrl}/workspace/billing?checkout=cancelled`);
  params.set("billing_address_collection", "required");
  params.set("tax_id_collection[enabled]", "true");
  // Freeze the displayed total: defer promo-code handling until discount disclosure is implemented.
  params.set("allow_promotion_codes", "false");
  params.set("locale", "ro");
  params.set("metadata[organization_id]", input.organizationId);
  params.set("metadata[plan_id]", input.planId);
  params.set("metadata[order_evidence_id]", input.orderEvidenceId);
  params.set("metadata[price_id]", getStripePriceId(input.planId));
  params.set("metadata[plan_name]", plan.name);
  params.set("metadata[merchant_key]", commercialIdentity.entityKey || "prelaunch");
  params.set("metadata[merchant_type]", commercialIdentity.entityType);
  params.set("subscription_data[metadata][organization_id]", input.organizationId);
  params.set("subscription_data[metadata][plan_id]", input.planId);
  params.set("subscription_data[metadata][order_evidence_id]", input.orderEvidenceId);
  params.set("subscription_data[metadata][merchant_key]", commercialIdentity.entityKey || "prelaunch");
  params.set("subscription_data[metadata][merchant_type]", commercialIdentity.entityType);

  if (input.customerId) {
    params.set("customer", input.customerId);
    params.set("customer_update[address]", "auto");
    params.set("customer_update[name]", "auto");
  } else if (input.email) {
    params.set("customer_email", input.email);
  }

  return stripePost<StripeCheckoutSession>("checkout/sessions", params);
}

export async function createStripePortalSession(customerId: string, archived = false) {
  if (archived && (!billingServerConfig.stripeArchiveSecretKey ||
      !billingServerConfig.stripeArchivePortalConfigurationId)) {
    throw new Error("Archived merchant portal is not configured.");
  }
  const params = new URLSearchParams();
  params.set("customer", customerId);
  params.set("configuration", archived
    ? billingServerConfig.stripeArchivePortalConfigurationId
    : billingServerConfig.stripePortalConfigurationId);
  params.set("return_url", `${getSiteUrl()}/workspace/billing`);
  return stripePost<StripePortalSession>("billing_portal/sessions", params, archived);
}


function setInlinePrice(
  params: URLSearchParams,
  index: number,
  input: {
    amountLei: number;
    name: string;
    description: string;
    recurring?: boolean;
  }
) {
  const prefix = `line_items[${index}][price_data]`;
  params.set(`${prefix}[currency]`, "ron");
  params.set(`${prefix}[unit_amount]`, String(input.amountLei * 100));
  params.set(`${prefix}[product_data][name]`, input.name);
  params.set(`${prefix}[product_data][description]`, input.description);
  if (input.recurring) {
    params.set(`${prefix}[recurring][interval]`, "month");
  }
  params.set(`line_items[${index}][quantity]`, "1");
}

export async function createPublicOfferCheckoutSession(offerId: PublicOfferId) {
  requirePublicCheckoutReady();
  const offer = PUBLIC_OFFERS[offerId];
  const params = new URLSearchParams();
  const siteUrl = getSiteUrl();

  params.set("locale", "ro");
  params.set("billing_address_collection", "auto");
  params.set("allow_promotion_codes", "false");
  params.set("success_url", `${siteUrl}/porneste/succes?offer=${offerId}&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${siteUrl}/contact?checkout=cancelled`);
  params.set("metadata[public_offer]", offerId);
  params.set("metadata[merchant_key]", commercialIdentity.entityKey || "prelaunch");
  params.set("metadata[merchant_type]", commercialIdentity.entityType);

  if (offerId === "invitation") {
    params.set("mode", "payment");
    params.set("submit_type", "pay");
    setInlinePrice(params, 0, {
      amountLei: offer.priceLei,
      name: "Invitație online personalizată ORBYVEN",
      description: "Design personalizat, RSVP și experiență online pentru eveniment.",
    });
  }

  if (offerId === "web") {
    params.set("mode", "subscription");
    params.set("submit_type", "subscribe");
    setInlinePrice(params, 0, {
      amountLei: offer.priceLei,
      name: "Web design ORBYVEN",
      description: "Website personalizat. Include 30 de zile ORBYVEN Dashboard pentru primul utilizator.",
    });
    setInlinePrice(params, 1, {
      amountLei: offer.recurringLei,
      name: "ORBYVEN Dashboard",
      description: "Pachetul continuă după perioada inclusă de 30 de zile.",
      recurring: true,
    });
    params.set("subscription_data[trial_period_days]", String(offer.trialDays));
    params.set("subscription_data[metadata][public_offer]", offerId);
    params.set("subscription_data[metadata][plan_id]", "business");
    params.set("subscription_data[metadata][merchant_key]", commercialIdentity.entityKey || "prelaunch");
    params.set("subscription_data[metadata][merchant_type]", commercialIdentity.entityType);
    params.set(
      "custom_text[submit][message]",
      "Plătești 399 lei pentru web design. Dashboard-ul este inclus 30 de zile, apoi abonamentul continuă la 499 lei/lună până la anulare."
    );
  }

  if (offerId === "advanced") {
    params.set("mode", "subscription");
    params.set("submit_type", "subscribe");
    setInlinePrice(params, 0, {
      amountLei: offer.recurringLei,
      name: "ORBYVEN Advanced",
      description: "Web design + Dashboard + module personalizabile pentru fluxurile firmei.",
      recurring: true,
    });
    params.set("subscription_data[metadata][public_offer]", offerId);
    params.set("subscription_data[metadata][plan_id]", "pro");
    params.set("subscription_data[metadata][merchant_key]", commercialIdentity.entityKey || "prelaunch");
    params.set("subscription_data[metadata][merchant_type]", commercialIdentity.entityType);
    params.set(
      "custom_text[submit][message]",
      "Abonament de 599 lei/lună pentru website, Dashboard și module personalizabile."
    );
  }

  return stripePost<StripeCheckoutSession>("checkout/sessions", params, false, "public");
}
