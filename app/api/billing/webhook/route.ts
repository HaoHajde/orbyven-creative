import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { billingServerConfig } from "@/lib/billing/server-config";
import { verifiedWebhookMerchant } from "@/lib/billing/merchant-routing";
import { classifyBillingWebhookRecord } from "@/lib/billing/webhook-state";
import { createBillingServiceClient } from "@/lib/billing/supabase-server";
import {
  syncStripeCheckoutCompleted,
  syncStripeInvoice,
  syncStripeSubscription,
} from "@/lib/billing/sync";
import type { StripeEvent } from "@/lib/billing/stripe-webhook";

export const runtime = "nodejs";
const STALE_AFTER_MS = 15 * 60_000;

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function metadataPublicOffer(object: Record<string, unknown>) {
  const metadata = objectValue(object.metadata);
  const direct = typeof metadata?.public_offer === "string" ? metadata.public_offer : null;
  if (direct) return direct;

  const subscriptionDetails = objectValue(object.subscription_details);
  const subscriptionMetadata = objectValue(subscriptionDetails?.metadata);
  const legacyNested = typeof subscriptionMetadata?.public_offer === "string"
    ? subscriptionMetadata.public_offer
    : null;
  if (legacyNested) return legacyNested;

  const parent = objectValue(object.parent);
  const parentSubscription = objectValue(parent?.subscription_details);
  const parentMetadata = objectValue(parentSubscription?.metadata);
  return typeof parentMetadata?.public_offer === "string" ? parentMetadata.public_offer : null;
}

export async function POST(request: Request) {
  if (!billingServerConfig.supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Billing webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();
  const verifiedMerchantKey = signature
    ? verifiedWebhookMerchant(payload, signature)
    : null;
  if (!verifiedMerchantKey) {
    return NextResponse.json({ error: "Invalid Stripe signature or merchant." }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
  if (!event.id || !event.type || !event.data?.object) {
    return NextResponse.json({ error: "Invalid Stripe event." }, { status: 400 });
  }

  const client = createBillingServiceClient();
  let leaseToken = randomUUID();
  const startedAt = new Date().toISOString();
  const { error: insertError } = await client.from("billing_webhook_events").insert({
    provider_event_id: event.id,
    event_type: event.type,
    merchant_key: verifiedMerchantKey,
    payload: event,
    processing_started_at: startedAt,
    processing_token: leaseToken,
    attempt_count: 1,
  });

  if (insertError?.code === "23505") {
    const { data: existing, error: lookupError } = await client
      .from("billing_webhook_events")
      .select("processed_at,processing_error,processing_started_at,processing_token,attempt_count,merchant_key")
      .eq("provider_event_id", event.id)
      .maybeSingle();
    if (lookupError || !existing) {
      return NextResponse.json({ error: "Unable to inspect webhook event." }, { status: 500 });
    }
    if (existing.merchant_key !== verifiedMerchantKey) {
      return NextResponse.json({ error: "Webhook issuer mismatch." }, { status: 409 });
    }
    const state = classifyBillingWebhookRecord(existing);
    if (state === "processed") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    if (state === "pending") {
      return NextResponse.json({ error: "Webhook delivery still in progress." }, { status: 503 });
    }

    // CAS fencing: only one redelivery may reclaim an errored or stale event.
    // A superseded attempt cannot mark completion or overwrite the recovery result.
    const recoveredToken = randomUUID();
    const update = client
      .from("billing_webhook_events")
      .update({
        processing_error: null,
        processing_started_at: startedAt,
        processing_token: recoveredToken,
        attempt_count: (existing.attempt_count ?? 1) + 1,
      })
      .eq("provider_event_id", event.id)
      .eq("processing_token", existing.processing_token)
      .is("processed_at", null);
    const { data: claimed, error: claimError } = state === "stalled"
      ? await update.lt(
          "processing_started_at",
          new Date(Date.now() - STALE_AFTER_MS).toISOString()
        ).select("provider_event_id").maybeSingle()
      : await update.eq(
          "processing_error", existing.processing_error
        ).select("provider_event_id").maybeSingle();
    if (claimError) {
      return NextResponse.json({ error: "Unable to claim webhook retry." }, { status: 500 });
    }
    if (!claimed) {
      return NextResponse.json({ error: "Webhook already reclaimed." }, { status: 503 });
    }
    leaseToken = recoveredToken;
  } else if (insertError) {
    return NextResponse.json({ error: "Unable to record webhook event." }, { status: 500 });
  }

  try {
    const publicOffer = metadataPublicOffer(event.data.object);
    if (publicOffer) {
      const { data: completed, error: completionError } = await client
        .from("billing_webhook_events")
        .update({ processed_at: new Date().toISOString(), processing_error: null })
        .eq("provider_event_id", event.id)
        .eq("processing_token", leaseToken)
        .is("processed_at", null)
        .select("provider_event_id")
        .maybeSingle();
      if (completionError || !completed) {
        throw new Error("Webhook completion lease expired or persistence failed.");
      }
      return NextResponse.json({ received: true, publicOffer });
    }

    if (event.type === "checkout.session.completed") {
      await syncStripeCheckoutCompleted(client, event.data.object, verifiedMerchantKey, event.id);
    }
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncStripeSubscription(client, event.data.object, verifiedMerchantKey);
    }
    if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      await syncStripeInvoice(client, event.data.object, event.type, verifiedMerchantKey);
    }

    const { data: completed, error: completionError } = await client
      .from("billing_webhook_events")
      .update({ processed_at: new Date().toISOString(), processing_error: null })
      .eq("provider_event_id", event.id)
      .eq("processing_token", leaseToken)
      .is("processed_at", null)
      .select("provider_event_id")
      .maybeSingle();
    if (completionError || !completed) {
      throw new Error("Webhook completion lease expired or persistence failed.");
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown billing error";
    const { error: recordError } = await client
      .from("billing_webhook_events")
      .update({ processing_error: message.slice(0, 2000) })
      .eq("provider_event_id", event.id)
      .eq("processing_token", leaseToken)
      .is("processed_at", null);
    if (recordError) console.error("ORBYVEN: unable to persist webhook failure state.");
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
