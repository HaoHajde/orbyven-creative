import { BILLING_PLANS, type BillingPlanId } from "@/lib/billing/public-config";
import {
  billingServerConfig,
  getStripePriceId,
  requireBillingReady,
} from "@/lib/billing/server-config";
import { getSiteUrl } from "@/lib/site-config";

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

async function stripePost<T>(path: string, params: URLSearchParams): Promise<T> {
  requireBillingReady();

  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${billingServerConfig.stripeSecretKey}`,
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

export async function createStripeCheckoutSession(input: {
  organizationId: string;
  planId: BillingPlanId;
  customerId?: string | null;
  email?: string | null;
}) {
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
  params.set("allow_promotion_codes", "true");
  params.set("locale", "ro");
  params.set("metadata[organization_id]", input.organizationId);
  params.set("metadata[plan_id]", input.planId);
  params.set("metadata[plan_name]", plan.name);
  params.set("subscription_data[metadata][organization_id]", input.organizationId);
  params.set("subscription_data[metadata][plan_id]", input.planId);

  if (input.customerId) {
    params.set("customer", input.customerId);
    params.set("customer_update[address]", "auto");
    params.set("customer_update[name]", "auto");
  } else if (input.email) {
    params.set("customer_email", input.email);
  }

  return stripePost<StripeCheckoutSession>("checkout/sessions", params);
}

export async function createStripePortalSession(customerId: string) {
  const params = new URLSearchParams();
  params.set("customer", customerId);
  params.set("configuration", billingServerConfig.stripePortalConfigurationId);
  params.set("return_url", `${getSiteUrl()}/workspace/billing`);
  return stripePost<StripePortalSession>("billing_portal/sessions", params);
}
