import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { ENTITLEMENT_ENFORCEMENT_ENABLED } from "@/lib/billing/public-config";

export type OrganizationEntitlement = {
  module_id: OrbyvenModuleId;
  enabled: boolean;
  starts_at: string | null;
  ends_at: string | null;
  plan_id: string | null;
};

function isCurrentlyValid(entitlement: OrganizationEntitlement) {
  if (!entitlement.enabled) return false;
  const now = Date.now();
  if (entitlement.starts_at && new Date(entitlement.starts_at).getTime() > now) {
    return false;
  }
  if (entitlement.ends_at && new Date(entitlement.ends_at).getTime() <= now) {
    return false;
  }
  return true;
}

export async function getOrganizationEntitlements(organizationId: string) {
  if (!ENTITLEMENT_ENFORCEMENT_ENABLED) return null;

  const { data, error } = await orbyvenSupabase
    .from("organization_entitlements")
    .select("module_id,enabled,starts_at,ends_at,plan_id")
    .eq("organization_id", organizationId);

  if (error) throw error;
  return (data ?? []) as OrganizationEntitlement[];
}

export async function isModuleEntitled(
  organizationId: string,
  moduleId: OrbyvenModuleId
) {
  if (moduleId === "overview" || !ENTITLEMENT_ENFORCEMENT_ENABLED) return true;

  const entitlements = await getOrganizationEntitlements(organizationId);
  const entitlement = entitlements?.find((item) => item.module_id === moduleId);
  return entitlement ? isCurrentlyValid(entitlement) : false;
}
