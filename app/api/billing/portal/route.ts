import { NextResponse } from "next/server";

import { requireBillingReady } from "@/lib/billing/server-config";
import {
  authenticateBillingActor,
  createBillingServiceClient,
} from "@/lib/billing/supabase-server";
import { createStripePortalSession } from "@/lib/billing/stripe-rest";

export async function POST(request: Request) {
  try {
    requireBillingReady();
    const body = (await request.json()) as { organizationId?: unknown };
    const organizationId =
      typeof body.organizationId === "string" ? body.organizationId : undefined;
    const actor = await authenticateBillingActor(request, organizationId, true);
    const client = createBillingServiceClient();

    const { data: account, error } = await client
      .from("billing_accounts")
      .select("stripe_customer_id")
      .eq("organization_id", actor.organizationId)
      .maybeSingle();
    if (error) throw error;
    if (!account?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Nu există încă un profil Stripe pentru organizație." },
        { status: 404 }
      );
    }

    const session = await createStripePortalSession(account.stripe_customer_id);
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
    return NextResponse.json({ error: "Portalul de facturare este indisponibil." }, { status });
  }
}
