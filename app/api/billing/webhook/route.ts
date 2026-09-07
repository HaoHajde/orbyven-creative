import { NextResponse } from "next/server";

import { billingServerConfig } from "@/lib/billing/server-config";
import { createBillingServiceClient } from "@/lib/billing/supabase-server";
import {
  syncStripeCheckoutCompleted,
  syncStripeInvoice,
  syncStripeSubscription,
} from "@/lib/billing/sync";
import { verifyStripeWebhook, type StripeEvent } from "@/lib/billing/stripe-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = billingServerConfig.stripeWebhookSecret;
  if (!secret || !billingServerConfig.supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Billing webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();
  if (!signature || !verifyStripeWebhook(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
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
  const { error: insertError } = await client.from("billing_webhook_events").insert({
    provider_event_id: event.id,
    event_type: event.type,
    payload: event,
  });

  if (insertError?.code === "23505") {
    return NextResponse.json({ received: true, duplicate: true });
  }
  if (insertError) {
    return NextResponse.json({ error: "Unable to record webhook event." }, { status: 500 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await syncStripeCheckoutCompleted(client, event.data.object);
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncStripeSubscription(client, event.data.object);
    }

    if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      await syncStripeInvoice(client, event.data.object, event.type);
    }

    await client
      .from("billing_webhook_events")
      .update({ processed_at: new Date().toISOString(), processing_error: null })
      .eq("provider_event_id", event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown billing error";
    await client
      .from("billing_webhook_events")
      .update({ processing_error: message })
      .eq("provider_event_id", event.id);

    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
