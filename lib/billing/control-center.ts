import type { SupabaseClient } from "@supabase/supabase-js";

import type { OrbyvenEntitlementSnapshot } from "@/lib/orbyven-control-center-contracts";

export type ControlCenterBillingSource = "billing" | "chat3-pending";

export type ControlCenterBillingState = {
  source: ControlCenterBillingSource;
  snapshots: Map<string, OrbyvenEntitlementSnapshot>;
};

type SubscriptionRow = {
  organization_id: string;
  plan_id: string;
  status: string;
  created_at: string;
};

type EntitlementRow = {
  organization_id: string;
  module_id: string;
  enabled: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

function billingSchemaMissing(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "42P01" ||
    candidate.code === "PGRST205" ||
    candidate.message?.includes("Could not find the table") === true
  );
}

function entitlementIsCurrent(entitlement: EntitlementRow) {
  if (!entitlement.enabled) return false;

  const now = Date.now();
  if (
    entitlement.starts_at &&
    new Date(entitlement.starts_at).getTime() > now
  ) {
    return false;
  }
  if (
    entitlement.ends_at &&
    new Date(entitlement.ends_at).getTime() <= now
  ) {
    return false;
  }

  return true;
}

/**
 * Chat 3 provider for the read-only entitlement boundary reserved by Platform Core.
 *
 * It intentionally fails soft while the billing migration is not yet applied so
 * merging the code cannot break the existing Control Center. Once the billing
 * tables exist, the same provider returns live organization-scoped commercial state.
 */
export async function loadControlCenterBillingSnapshots(
  admin: SupabaseClient,
  organizationIds: string[]
): Promise<ControlCenterBillingState> {
  const snapshots = new Map<string, OrbyvenEntitlementSnapshot>();

  if (!organizationIds.length) {
    return { source: "billing", snapshots };
  }

  const [subscriptionsResult, entitlementsResult] = await Promise.all([
    admin
      .from("subscriptions")
      .select("organization_id,plan_id,status,created_at")
      .in("organization_id", organizationIds)
      .order("created_at", { ascending: false }),
    admin
      .from("organization_entitlements")
      .select("organization_id,module_id,enabled,starts_at,ends_at")
      .in("organization_id", organizationIds),
  ]);

  if (
    billingSchemaMissing(subscriptionsResult.error) ||
    billingSchemaMissing(entitlementsResult.error)
  ) {
    return { source: "chat3-pending", snapshots };
  }

  if (subscriptionsResult.error) throw subscriptionsResult.error;
  if (entitlementsResult.error) throw entitlementsResult.error;

  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRow[];
  const entitlements = (entitlementsResult.data ?? []) as EntitlementRow[];

  for (const organizationId of organizationIds) {
    const latestSubscription = subscriptions.find(
      (subscription) => subscription.organization_id === organizationId
    );

    const entitlementSnapshot: Record<
      string,
      boolean | string | number | null
    > = {};

    for (const entitlement of entitlements) {
      if (entitlement.organization_id !== organizationId) continue;
      entitlementSnapshot[entitlement.module_id] =
        entitlementIsCurrent(entitlement);
    }

    snapshots.set(organizationId, {
      subscription_status: latestSubscription?.status ?? null,
      plan: latestSubscription?.plan_id ?? null,
      entitlements:
        Object.keys(entitlementSnapshot).length > 0
          ? entitlementSnapshot
          : null,
    });
  }

  return { source: "billing", snapshots };
}
