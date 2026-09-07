import { NextResponse } from "next/server";

import { getBillingReadiness } from "@/lib/billing/server-config";
import {
  authenticateBillingActor,
  createBillingServiceClient,
} from "@/lib/billing/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const readiness = getBillingReadiness();
  if (!readiness.ready) {
    return NextResponse.json({
      configured: false,
      message: "Billing-ul ORBYVEN este pregătit în cod, dar nu este activat comercial.",
    });
  }

  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId") || undefined;
    const actor = await authenticateBillingActor(request, organizationId, true);
    const client = createBillingServiceClient();

    const [accountResult, subscriptionResult, entitlementsResult] = await Promise.all([
      client
        .from("billing_accounts")
        .select("stripe_customer_id,billing_email")
        .eq("organization_id", actor.organizationId)
        .maybeSingle(),
      client
        .from("subscriptions")
        .select(
          "plan_id,status,current_period_end,cancel_at_period_end,commitment_ends_at,grace_until,trial_ends_at"
        )
        .eq("organization_id", actor.organizationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      client
        .from("organization_entitlements")
        .select("module_id,enabled,ends_at")
        .eq("organization_id", actor.organizationId)
        .eq("enabled", true),
    ]);

    if (accountResult.error) throw accountResult.error;
    if (subscriptionResult.error) throw subscriptionResult.error;
    if (entitlementsResult.error) throw entitlementsResult.error;

    return NextResponse.json({
      configured: true,
      organizationId: actor.organizationId,
      role: actor.role,
      billingAccount: accountResult.data
        ? {
            hasStripeCustomer: Boolean(accountResult.data.stripe_customer_id),
            billingEmail: accountResult.data.billing_email,
          }
        : null,
      subscription: subscriptionResult.data,
      entitlements: entitlementsResult.data ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      message === "AUTH_REQUIRED"
        ? 401
        : message === "ORG_ACCESS_REQUIRED" || message === "BILLING_ADMIN_REQUIRED"
          ? 403
          : 500;
    return NextResponse.json({ error: "Billing summary unavailable." }, { status });
  }
}
