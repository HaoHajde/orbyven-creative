import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

export type OrbyvenPlatformRole =
  | "owner"
  | "admin"
  | "manager"
  | "member"
  | "viewer";

/**
 * Contract boundary owned by Chat 3 (Legal + Billing + Entitlements).
 * Platform Core consumes this shape but does not implement billing logic.
 */
export type OrbyvenEntitlementSnapshot = {
  subscription_status: string | null;
  plan: string | null;
  entitlements: Record<string, boolean | string | number | null> | null;
};

export type ControlCenterModuleAssignment = {
  module_id: OrbyvenModuleId;
  enabled: boolean;
  settings: Record<string, unknown>;
  updated_at: string | null;
};

export type ControlCenterMember = {
  user_id: string;
  email: string | null;
  role: OrbyvenPlatformRole;
  created_at: string;
};

export type ControlCenterOrganizationProfile = {
  display_name: string | null;
  greeting_name: string | null;
  logo_url: string | null;
  timezone: string;
  locale: string;
  settings: Record<string, unknown>;
};

export type ControlCenterTechnicalStatus = {
  state: "healthy" | "attention";
  checks: {
    profile: boolean;
    owner: boolean;
    members: boolean;
  };
  member_count: number;
  enabled_module_count: number;
  last_config_update: string | null;
};

export type ControlCenterOrganization = {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profile: ControlCenterOrganizationProfile | null;
  members: ControlCenterMember[];
  modules: ControlCenterModuleAssignment[];
  technical_status: ControlCenterTechnicalStatus;
  subscription: OrbyvenEntitlementSnapshot;
};

export type ControlCenterAuthUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

export type ControlCenterPayload = {
  organizations: ControlCenterOrganization[];
  auth_users: ControlCenterAuthUser[];
  entitlement_source: "chat3-pending";
};

export const EMPTY_ENTITLEMENT_SNAPSHOT: OrbyvenEntitlementSnapshot = {
  subscription_status: null,
  plan: null,
  entitlements: null,
};
