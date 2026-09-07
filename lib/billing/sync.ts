import {
  ALL_BILLING_MODULE_IDS,
  BILLING_COMMITMENT_MONTHS,
  BILLING_GRACE_DAYS,
  BILLING_PLANS,
  isBillingPlanId,
  type BillingPlanId,
} from "@/lib/billing/public-config";
import { billingServerConfig } from "@/lib/billing/server-config";
import { createBillingServiceClient } from "@/lib/billing/supabase-server";
import {
  booleanValue,
  metadataValue,
  numberValue,
  stringValue,
  unixDate,
} from "@/lib/billing/stripe-webhook";

type ServiceClient = ReturnType<typeof createBillingServiceClient>;
type JsonObject = Record<string, unknown>;

function objectValue(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
}

function addMonthsFromUnix(unix: number, months: number) {
  const next = new Date(unix * 1000);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString();
}

function priceIdFromSubscription(object: JsonObject) {
  const items = objectValue(object.items);
  const data = items?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const item = objectValue(data[0]);
  const price = objectValue(item?.price);
  return stringValue(price?.id);
}

function planFromPriceId(priceId: string | null): BillingPlanId | null {
  if (!priceId) return null;
  const entries = Object.entries(billingServerConfig.priceIds) as [BillingPlanId, string][];
  return entries.find(([, configuredPriceId]) => configuredPriceId === priceId)?.[0] ?? null;
}

function firstTaxId(customerDetails: JsonObject | null) {
  const taxIds = customerDetails?.tax_ids;
  if (!Array.isArray(taxIds)) return null;
  for (const item of taxIds) {
    const tax = objectValue(item);
    const value = stringValue(tax?.value);
    if (value) return value;
  }
  return null;
}

async function resolveOrganizationId(
  client: ServiceClient,
  input: { organizationId?: string | null; customerId?: string | null; subscriptionId?: string | null }
) {
  if (input.organizationId) return input.organizationId;

  if (input.subscriptionId) {
    const { data } = await client
      .from("subscriptions")
      .select("organization_id")
      .eq("stripe_subscription_id", input.subscriptionId)
      .maybeSingle();
    if (data?.organization_id) return data.organization_id as string;
  }

  if (input.customerId) {
    const { data } = await client
      .from("billing_accounts")
      .select("organization_id")
      .eq("stripe_customer_id", input.customerId)
      .maybeSingle();
    if (data?.organization_id) return data.organization_id as string;
  }

  return null;
}

async function syncEntitlements(
  client: ServiceClient,
  organizationId: string,
  planId: BillingPlanId,
  status: string,
  graceUntil: string | null
) {
  const plan = BILLING_PLANS[planId];
  const allowed = new Set(plan.entitlements);
  const commerciallyActive = status === "active" || status === "trialing" || status === "past_due";
  const endsAt = status === "past_due" ? graceUntil : null;
  const now = new Date().toISOString();

  const rows = ALL_BILLING_MODULE_IDS.map((moduleId) => ({
    organization_id: organizationId,
    module_id: moduleId,
    plan_id: planId,
    source: "subscription",
    enabled: commerciallyActive && allowed.has(moduleId),
    starts_at: commerciallyActive && allowed.has(moduleId) ? now : null,
    ends_at: commerciallyActive && allowed.has(moduleId) ? endsAt : null,
    metadata: { subscription_status: status },
    updated_at: now,
  }));

  const { error } = await client
    .from("organization_entitlements")
    .upsert(rows, { onConflict: "organization_id,module_id" });
  if (error) throw error;
}

export async function syncStripeCheckoutCompleted(client: ServiceClient, object: JsonObject) {
  const organizationId = metadataValue(object, "organization_id");
  if (!organizationId) throw new Error("Stripe checkout is missing organization_id metadata.");

  const customerId = stringValue(object.customer);
  const customerDetails = objectValue(object.customer_details);
  const email = stringValue(customerDetails?.email);
  const legalName = stringValue(customerDetails?.name);
  const address = objectValue(customerDetails?.address) ?? {};
  const taxId = firstTaxId(customerDetails);

  const { error } = await client.from("billing_accounts").upsert(
    {
      organization_id: organizationId,
      stripe_customer_id: customerId,
      billing_email: email,
      legal_name: legalName,
      tax_id: taxId,
      billing_address: address,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" }
  );
  if (error) throw error;
}

export async function syncStripeSubscription(client: ServiceClient, object: JsonObject) {
  const subscriptionId = stringValue(object.id);
  const customerId = stringValue(object.customer);
  if (!subscriptionId) throw new Error("Stripe subscription id is missing.");

  const metadataPlan = metadataValue(object, "plan_id");
  const planId = isBillingPlanId(metadataPlan)
    ? metadataPlan
    : planFromPriceId(priceIdFromSubscription(object));
  if (!planId) throw new Error("Unable to map Stripe subscription to an ORBYVEN plan.");

  const organizationId = await resolveOrganizationId(client, {
    organizationId: metadataValue(object, "organization_id"),
    customerId,
    subscriptionId,
  });
  if (!organizationId) throw new Error("Unable to resolve organization for Stripe subscription.");

  const { data: existing } = await client
    .from("subscriptions")
    .select("commitment_ends_at,grace_until")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  const status = stringValue(object.status) || "unknown";
  const createdUnix = numberValue(object.created) ?? Math.floor(Date.now() / 1000);
  const graceUntil =
    status === "past_due"
      ? ((existing?.grace_until as string | null | undefined) ??
        addDays(new Date(), BILLING_GRACE_DAYS))
      : null;
  const commitmentEndsAt =
    (existing?.commitment_ends_at as string | null | undefined) ??
    addMonthsFromUnix(createdUnix, BILLING_COMMITMENT_MONTHS);

  const row = {
    organization_id: organizationId,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    plan_id: planId,
    status,
    current_period_start: unixDate(object.current_period_start),
    current_period_end: unixDate(object.current_period_end),
    cancel_at_period_end: booleanValue(object.cancel_at_period_end),
    commitment_ends_at: commitmentEndsAt,
    grace_until: graceUntil,
    trial_ends_at: unixDate(object.trial_end),
    ended_at: unixDate(object.ended_at),
    updated_at: new Date().toISOString(),
  };

  const { error } = await client
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" });
  if (error) throw error;

  await syncEntitlements(client, organizationId, planId, status, graceUntil);
}

export async function syncStripeInvoice(
  client: ServiceClient,
  object: JsonObject,
  eventType: string
) {
  const invoiceId = stringValue(object.id);
  if (!invoiceId) throw new Error("Stripe invoice id is missing.");

  const customerId = stringValue(object.customer);
  const subscriptionId = stringValue(object.subscription);
  const organizationId = await resolveOrganizationId(client, {
    customerId,
    subscriptionId,
  });
  if (!organizationId) throw new Error("Unable to resolve organization for Stripe invoice.");

  const paid = eventType === "invoice.paid";
  const fiscalStatus = paid ? "pending" : "skipped";

  const { error: invoiceError } = await client.from("billing_invoices").upsert(
    {
      organization_id: organizationId,
      stripe_invoice_id: invoiceId,
      stripe_subscription_id: subscriptionId,
      status: stringValue(object.status) || (paid ? "paid" : "open"),
      amount_due: numberValue(object.amount_due),
      amount_paid: numberValue(object.amount_paid),
      currency: stringValue(object.currency),
      hosted_invoice_url: stringValue(object.hosted_invoice_url),
      invoice_pdf: stringValue(object.invoice_pdf),
      fiscal_status: fiscalStatus,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_invoice_id" }
  );
  if (invoiceError) throw invoiceError;

  if (!subscriptionId) return;

  const { data: subscription } = await client
    .from("subscriptions")
    .select("plan_id,status")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (!subscription || !isBillingPlanId(subscription.plan_id)) return;

  if (eventType === "invoice.payment_failed") {
    const graceUntil = addDays(new Date(), BILLING_GRACE_DAYS);
    const { error } = await client
      .from("subscriptions")
      .update({ grace_until: graceUntil, updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscriptionId);
    if (error) throw error;
    await syncEntitlements(client, organizationId, subscription.plan_id, "past_due", graceUntil);
  }

  if (eventType === "invoice.paid") {
    const { error } = await client
      .from("subscriptions")
      .update({ grace_until: null, updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscriptionId);
    if (error) throw error;
    await syncEntitlements(
      client,
      organizationId,
      subscription.plan_id,
      subscription.status as string,
      null
    );
  }
}
