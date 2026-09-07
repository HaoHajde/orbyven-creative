import { NextResponse } from "next/server";

import {
  LEGAL_DOCUMENT_VERSION,
  isBillingPlanId,
} from "@/lib/billing/public-config";
import { requireBillingReady } from "@/lib/billing/server-config";
import {
  authenticateBillingActor,
  createBillingServiceClient,
} from "@/lib/billing/supabase-server";
import { createStripeCheckoutSession } from "@/lib/billing/stripe-rest";

export async function POST(request: Request) {
  try {
    requireBillingReady();
    const body = (await request.json()) as {
      organizationId?: unknown;
      planId?: unknown;
      acceptedLegalVersion?: unknown;
    };

    const organizationId =
      typeof body.organizationId === "string" ? body.organizationId : undefined;
    if (!isBillingPlanId(body.planId)) {
      return NextResponse.json({ error: "Plan invalid." }, { status: 400 });
    }
    if (body.acceptedLegalVersion !== LEGAL_DOCUMENT_VERSION) {
      return NextResponse.json(
        { error: "Termenii trebuie acceptați înainte de checkout." },
        { status: 400 }
      );
    }

    const actor = await authenticateBillingActor(request, organizationId, true);
    const client = createBillingServiceClient();

    const { data: activeSubscriptions, error: activeError } = await client
      .from("subscriptions")
      .select("id,status")
      .eq("organization_id", actor.organizationId)
      .in("status", ["active", "trialing", "past_due", "unpaid", "incomplete"])
      .limit(1);
    if (activeError) throw activeError;
    if ((activeSubscriptions ?? []).length > 0) {
      return NextResponse.json(
        { error: "Organizația are deja un abonament. Folosește administrarea abonamentului." },
        { status: 409 }
      );
    }

    const { data: account, error: accountError } = await client
      .from("billing_accounts")
      .select("stripe_customer_id")
      .eq("organization_id", actor.organizationId)
      .maybeSingle();
    if (accountError) throw accountError;

    const acceptedAt = new Date().toISOString();
    const { error: acceptanceError } = await client.from("billing_terms_acceptances").insert([
      {
        organization_id: actor.organizationId,
        user_id: actor.userId,
        document_type: "terms",
        document_version: LEGAL_DOCUMENT_VERSION,
        accepted_from: "workspace_billing",
        accepted_at: acceptedAt,
      },
      {
        organization_id: actor.organizationId,
        user_id: actor.userId,
        document_type: "subscription_terms",
        document_version: LEGAL_DOCUMENT_VERSION,
        accepted_from: "workspace_billing",
        accepted_at: acceptedAt,
      },
    ]);
    if (acceptanceError) throw acceptanceError;

    const session = await createStripeCheckoutSession({
      organizationId: actor.organizationId,
      planId: body.planId,
      customerId: account?.stripe_customer_id ?? null,
      email: actor.email,
    });

    if (!session.url) throw new Error("Stripe Checkout did not return a redirect URL.");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      message === "AUTH_REQUIRED"
        ? 401
        : message === "ORG_ACCESS_REQUIRED" || message === "BILLING_ADMIN_REQUIRED"
          ? 403
          : message.includes("not configured")
            ? 503
            : 500;
    return NextResponse.json({ error: "Checkout indisponibil momentan." }, { status });
  }
}
