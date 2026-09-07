import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

export type OrbyvenPlatformRole =
  | "owner"
  | "admin"
  | "manager"
  | "member"
  | "viewer";

export type OrbyvenOrganizationLifecycleStatus =
  | "provisioning"
  | "active"
  | "suspended"
  | "archived";

export type OrbyvenMemberAccessStatus = "active" | "suspended";

export type OrbyvenStaffRole =
  | "platform_owner"
  | "platform_admin"
  | "support";

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
  access_status: OrbyvenMemberAccessStatus;
  created_at: string;
  updated_at: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
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
  state: "healthy" | "attention" | "suspended";
  checks: {
    profile: boolean;
    owner: boolean;
    members: boolean;
    active_members: boolean;
    known_modules: boolean;
    lifecycle_active: boolean;
  };
  member_count: number;
  active_member_count: number;
  pending_invite_count: number;
  enabled_module_count: number;
  last_config_update: string | null;
};

export type ControlCenterOrganization = {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  lifecycle_status: OrbyvenOrganizationLifecycleStatus;
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
  email_confirmed_at: string | null;
  banned_until: string | null;
};

export type ControlCenterPlatformStaff = {
  user_id: string;
  email: string | null;
  role: OrbyvenStaffRole;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type ControlCenterAuditEvent = {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  organization_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ControlCenterPayload = {
  organizations: ControlCenterOrganization[];
  auth_users: ControlCenterAuthUser[];
  platform_staff: ControlCenterPlatformStaff[];
  audit_events: ControlCenterAuditEvent[];
  current_staff: {
    user_id: string;
    email: string | null;
    role: OrbyvenStaffRole;
    source: "platform_staff" | "env_allowlist";
  };
  entitlement_source: "billing" | "chat3-pending";
};

export const EMPTY_ENTITLEMENT_SNAPSHOT: OrbyvenEntitlementSnapshot = {
  subscription_status: null,
  plan: null,
  entitlements: null,
};
