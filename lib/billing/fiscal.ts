import { BILLING_PLANS, isBillingPlanId } from "@/lib/billing/public-config";
import { createBillingServiceClient } from "@/lib/billing/supabase-server";
import {
  issueOblioInvoice,
  oblioConfig,
  sendOblioEinvoice,
  type FiscalBillingAddress,
} from "@/lib/billing/oblio";

type JsonObject = Record<string, unknown>;

function addressValue(value: unknown): FiscalBillingAddress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const object = value as JsonObject;
  const stringOrNull = (item: unknown) => (typeof item === "string" ? item : null);
  return {
    line1: stringOrNull(object.line1),
    line2: stringOrNull(object.line2),
    city: stringOrNull(object.city),
    state: stringOrNull(object.state),
    country: stringOrNull(object.country),
    postal_code: stringOrNull(object.postal_code),
  };
}

function bucharestDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export async function processPendingFiscalInvoices(limit = 10) {
  const client = createBillingServiceClient();
  const { data: invoices, error } = await client
    .from("billing_invoices")
    .select(
      "id,organization_id,stripe_invoice_id,stripe_subscription_id,amount_paid,currency,created_at"
    )
    .eq("fiscal_status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;

  const results: { invoiceId: string; status: "issued" | "failed" | "skipped"; error?: string }[] = [];

  for (const invoice of invoices ?? []) {
    const { data: claim, error: claimError } = await client
      .from("billing_invoices")
      .update({ fiscal_status: "processing", fiscal_error: null })
      .eq("id", invoice.id)
      .eq("fiscal_status", "pending")
      .select("id")
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claim) continue;

    try {
      if ((invoice.currency as string | null)?.toLowerCase() !== "ron") {
        throw new Error("Fiscal adapter v1 only supports RON invoices.");
      }

      const [accountResult, organizationResult, subscriptionResult] = await Promise.all([
        client
          .from("billing_accounts")
          .select("legal_name,tax_id,billing_email,billing_address")
          .eq("organization_id", invoice.organization_id)
          .maybeSingle(),
        client
          .from("organizations")
          .select("name,legal_name")
          .eq("id", invoice.organization_id)
          .single(),
        invoice.stripe_subscription_id
          ? client
              .from("subscriptions")
              .select("plan_id")
              .eq("stripe_subscription_id", invoice.stripe_subscription_id)
              .maybeSingle()
          : client
              .from("subscriptions")
              .select("plan_id")
              .eq("organization_id", invoice.organization_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
      ]);

      if (accountResult.error) throw accountResult.error;
      if (organizationResult.error) throw organizationResult.error;
      if (subscriptionResult.error) throw subscriptionResult.error;

      const planId = subscriptionResult.data?.plan_id;
      if (!isBillingPlanId(planId)) throw new Error("Cannot resolve ORBYVEN plan for fiscal invoice.");

      const amountLei = Number(invoice.amount_paid ?? 0) / 100;
      if (!Number.isFinite(amountLei) || amountLei <= 0) {
        throw new Error("Invalid paid amount for fiscal invoice.");
      }

      const account = accountResult.data;
      const organization = organizationResult.data;
      const clientName =
        account?.legal_name || organization.legal_name || organization.name;

      const issued = await issueOblioInvoice({
        stripeInvoiceId: invoice.stripe_invoice_id,
        clientName,
        clientTaxId: account?.tax_id ?? null,
        clientEmail: account?.billing_email ?? null,
        address: addressValue(account?.billing_address),
        amountLei,
        planName: BILLING_PLANS[planId].name,
        issueDate: bucharestDate(new Date(invoice.created_at)),
      });

      const seriesName = issued.data?.seriesName;
      const number = issued.data?.number;
      if (!seriesName || !number) throw new Error("Oblio invoice response is missing series or number.");

      let spvStatus = "not_requested";
      let spvSentAt: string | null = null;
      if (oblioConfig.spvSend) {
        const spv = await sendOblioEinvoice(seriesName, number);
        spvStatus = spv.data?.sent ? "sent" : `code_${spv.data?.code ?? "unknown"}`;
        if (spv.data?.sent) spvSentAt = new Date().toISOString();
      }

      const { error: updateError } = await client
        .from("billing_invoices")
        .update({
          fiscal_status: "issued",
          fiscal_series: seriesName,
          fiscal_number: number,
          fiscal_external_id: `${seriesName}-${number}`,
          fiscal_document_url: issued.data?.link ?? null,
          spv_status: spvStatus,
          spv_sent_at: spvSentAt,
          fiscal_error: null,
        })
        .eq("id", invoice.id);
      if (updateError) throw updateError;
      results.push({ invoiceId: invoice.id, status: "issued" });
    } catch (processingError) {
      const message =
        processingError instanceof Error ? processingError.message : "Unknown fiscal error";
      await client
        .from("billing_invoices")
        .update({ fiscal_status: "failed", fiscal_error: message.slice(0, 2000) })
        .eq("id", invoice.id);
      results.push({ invoiceId: invoice.id, status: "failed", error: message });
    }
  }

  return results;
}
