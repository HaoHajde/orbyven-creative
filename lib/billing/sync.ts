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

  const { data: existing, error: existingError } = await client
    .from("subscriptions")
    .select("commitment_ends_at,grace_until,merchant_key,merchant_type,merchant_legal_name,merchant_tax_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  if (existingError) throw existingError;

  // Stripe metadata records the issuing merchant at checkout; never silently
  // replace the original issuer just because a new PFA/SRL is configured now.
  const metadataMerchantKey = metadataValue(object, "merchant_key");
  const requestedMerchantKey = metadataMerchantKey === "prelaunch" ? null : metadataMerchantKey;
  if (existing?.merchant_key && requestedMerchantKey && existing.merchant_key !== requestedMerchantKey) {
    throw new Error("Subscription merchant identity changed unexpectedly.");
  }
  const merchantKey = existing?.merchant_key ?? requestedMerchantKey;
  const { data: merchantAcceptance, error: merchantError } = merchantKey
    ? await client
        .from("billing_terms_acceptances")
        .select("merchant_key,merchant_type,merchant_legal_name,merchant_tax_id")
        .eq("organization_id", organizationId)
        .eq("merchant_key", merchantKey)
        .eq("document_type", "subscription_terms")
        .order("accepted_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null, error: null };
  if (merchantError) throw merchantError;
  if (merchantKey && !merchantAcceptance && !existing?.merchant_legal_name) {
    throw new Error("No documented merchant identity for this Stripe subscription.");
  }

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
    merchant_key: merchantKey,
    merchant_type: existing?.merchant_type ?? merchantAcceptance?.merchant_type ?? null,
    merchant_legal_name: existing?.merchant_legal_name ?? merchantAcceptance?.merchant_legal_name ?? null,
    merchant_tax_id: existing?.merchant_tax_id ?? merchantAcceptance?.merchant_tax_id ?? null,
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

  const [merchantResult, existingInvoiceResult] = await Promise.all([
    subscriptionId
      ? client
          .from("subscriptions")
          .select("merchant_key,merchant_type,merchant_legal_name,merchant_tax_id")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    client
      .from("billing_invoices")
      .select("fiscal_status,merchant_key,merchant_type,merchant_legal_name,merchant_tax_id")
      .eq("stripe_invoice_id", invoiceId)
      .maybeSingle(),
  ]);
  if (merchantResult.error) throw merchantResult.error;
  if (existingInvoiceResult.error) throw existingInvoiceResult.error;
  const historic = existingInvoiceResult.data;
  const currentMerchant = merchantResult.data;
  if (historic?.merchant_key && currentMerchant?.merchant_key &&
      historic.merchant_key !== currentMerchant.merchant_key) {
    throw new Error("Invoice cannot change its original legal issuer.");
  }
  const invoiceMerchantKey = historic?.merchant_key ?? currentMerchant?.merchant_key ?? null;
  // Never reset an already-issued fiscal invoice on repeated/out-of-order events.
  const fiscalStatus = historic?.fiscal_status === "issued"
    ? "issued"
    : paid ? "pending" : "skipped";

  const { error: invoiceError } = await client.from("billing_invoices").upsert(
    {
      organization_id: organizationId,
      stripe_invoice_id: invoiceId,
      stripe_subscription_id: subscriptionId,
      merchant_key: invoiceMerchantKey,
      merchant_type: historic?.merchant_type ?? currentMerchant?.merchant_type ?? null,
      merchant_legal_name: historic?.merchant_legal_name ?? currentMerchant?.merchant_legal_name ?? null,
      merchant_tax_id: historic?.merchant_tax_id ?? currentMerchant?.merchant_tax_id ?? null,
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
