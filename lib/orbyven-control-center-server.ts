import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import {
  EMPTY_ENTITLEMENT_SNAPSHOT,
  type ControlCenterAuditEvent,
  type ControlCenterAuthUser,
  type ControlCenterMember,
  type ControlCenterModuleAssignment,
  type ControlCenterOrganization,
  type ControlCenterOrganizationProfile,
  type ControlCenterPayload,
  type ControlCenterPlatformStaff,
  type OrbyvenMemberAccessStatus,
  type OrbyvenOrganizationLifecycleStatus,
  type OrbyvenPlatformRole,
  type OrbyvenStaffRole,
} from "@/lib/orbyven-control-center-contracts";
import {
  ORBYVEN_MODULES,
  type OrbyvenModuleId,
} from "@/lib/orbyven-modules";

const VALID_ROLES = new Set<OrbyvenPlatformRole>([
  "owner",
  "admin",
  "manager",
  "member",
  "viewer",
]);
const VALID_STAFF_ROLES = new Set<OrbyvenStaffRole>([
  "platform_owner",
  "platform_admin",
  "support",
]);
const VALID_LIFECYCLE_STATUSES = new Set<OrbyvenOrganizationLifecycleStatus>([
  "provisioning",
  "active",
  "suspended",
  "archived",
]);
const VALID_MEMBER_ACCESS = new Set<OrbyvenMemberAccessStatus>([
  "active",
  "suspended",
]);
const VALID_MODULE_IDS = new Set<OrbyvenModuleId>(
  ORBYVEN_MODULES.map((module) => module.id)
);
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ControlCenterHttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type ControlCenterAuthorization = {
  admin: SupabaseClient;
  user: User;
  staffRole: OrbyvenStaffRole;
  staffSource: "platform_staff" | "env_allowlist";
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new ControlCenterHttpError(
      503,
      "control_center_not_configured",
      "Control Center requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function allowedAdminEmails() {
  return new Set(
    (process.env.ORBYVEN_CONTROL_CENTER_ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

function allowedAdminUserIds() {
  return new Set(
    (process.env.ORBYVEN_CONTROL_CENTER_ADMIN_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

function isMissingPlatformTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message ?? "").toLowerCase().includes("platform_staff")
  );
}

export async function authorizeControlCenter(request: Request): Promise<ControlCenterAuthorization> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    throw new ControlCenterHttpError(401, "missing_session", "Authentication required.");
  }

  const admin = getAdminClient();
  const { data, error } = await admin.auth.getUser(token);

  if (error || !data.user) {
    throw new ControlCenterHttpError(401, "invalid_session", "Invalid or expired session.");
  }

  const { data: staff, error: staffError } = await admin
    .from("platform_staff")
    .select("role,enabled")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (staffError && !isMissingPlatformTableError(staffError)) throw staffError;

  if (staff?.enabled && VALID_STAFF_ROLES.has(staff.role as OrbyvenStaffRole)) {
    return {
      admin,
      user: data.user,
      staffRole: staff.role as OrbyvenStaffRole,
      staffSource: "platform_staff",
    };
  }

  const emails = allowedAdminEmails();
  const userIds = allowedAdminUserIds();
  const email = data.user.email?.toLowerCase() ?? "";

  if (emails.has(email) || userIds.has(data.user.id)) {
    return {
      admin,
      user: data.user,
      staffRole: "platform_owner",
      staffSource: "env_allowlist",
    };
  }

  if (emails.size === 0 && userIds.size === 0 && !staff?.enabled) {
    throw new ControlCenterHttpError(
      503,
      "platform_staff_not_configured",
      "Configure an ORBYVEN platform staff user or the temporary Control Center allowlist."
    );
  }

  throw new ControlCenterHttpError(403, "not_platform_staff", "Control Center access denied.");
}

export function requireStaffRole(
  actual: OrbyvenStaffRole,
  allowed: OrbyvenStaffRole[]
) {
  if (!allowed.includes(actual)) {
    throw new ControlCenterHttpError(
      403,
      "insufficient_platform_role",
      "Rolul ORBYVEN intern nu permite această operație."
    );
  }
}

async function listAllAuthUsers(admin: SupabaseClient): Promise<ControlCenterAuthUser[]> {
  const users: ControlCenterAuthUser[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    users.push(
      ...data.users.map((user) => ({
        id: user.id,
        email: user.email ?? null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
        email_confirmed_at: user.email_confirmed_at ?? null,
        banned_until: user.banned_until ?? null,
      }))
    );

    if (data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

async function findAuthUserByEmail(admin: SupabaseClient, email: string) {
  const users = await listAllAuthUsers(admin);
  return users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

type RawProfile = ControlCenterOrganizationProfile & {
  organization_id: string;
  updated_at: string;
};

type RawMember = {
  organization_id: string;
  user_id: string;
  role: OrbyvenPlatformRole;
  access_status: OrbyvenMemberAccessStatus;
  created_at: string;
  updated_at: string | null;
};

type RawModule = {
  organization_id: string;
  module_id: string;
  enabled: boolean;
  settings: Record<string, unknown> | null;
  updated_at: string | null;
};

type RawOrganization = {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  lifecycle_status: OrbyvenOrganizationLifecycleStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type RawStaff = {
  user_id: string;
  role: OrbyvenStaffRole;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

type RawAudit = {
  id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  organization_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function loadControlCenterPayload(
  admin: SupabaseClient,
  currentUser: User,
  currentStaffRole: OrbyvenStaffRole,
  currentStaffSource: "platform_staff" | "env_allowlist"
): Promise<ControlCenterPayload> {
  const [
    organizationsResult,
    profilesResult,
    membersResult,
    modulesResult,
    staffResult,
    auditResult,
    authUsers,
  ] = await Promise.all([
    admin
      .from("organizations")
      .select("id,name,slug,legal_name,lifecycle_status,created_by,created_at,updated_at")
      .order("created_at", { ascending: false }),
    admin
      .from("organization_profiles")
      .select(
        "organization_id,display_name,greeting_name,logo_url,timezone,locale,settings,updated_at"
      ),
    admin
      .from("organization_members")
      .select("organization_id,user_id,role,access_status,created_at,updated_at")
      .order("created_at", { ascending: true }),
    admin
      .from("organization_modules")
      .select("organization_id,module_id,enabled,settings,updated_at"),
    admin
      .from("platform_staff")
      .select("user_id,role,enabled,created_at,updated_at")
      .order("created_at", { ascending: true }),
    admin
      .from("platform_audit_log")
      .select(
        "id,actor_user_id,actor_role,organization_id,action,target_type,target_id,metadata,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(150),
    listAllAuthUsers(admin),
  ]);

  if (organizationsResult.error) throw organizationsResult.error;
  if (profilesResult.error) throw profilesResult.error;
  if (membersResult.error) throw membersResult.error;
  if (modulesResult.error) throw modulesResult.error;
  if (staffResult.error) throw staffResult.error;
  if (auditResult.error) throw auditResult.error;

  const authById = new Map(authUsers.map((user) => [user.id, user]));
  const profiles = (profilesResult.data ?? []) as RawProfile[];
  const members = (membersResult.data ?? []) as RawMember[];
  const modules = (modulesResult.data ?? []) as RawModule[];

  const organizations = ((organizationsResult.data ?? []) as RawOrganization[]).map(
    (organization): ControlCenterOrganization => {
      const rawProfile = profiles.find(
        (profile) => profile.organization_id === organization.id
      );
      const organizationMembers: ControlCenterMember[] = members
        .filter((member) => member.organization_id === organization.id)
        .map((member) => {
          const authUser = authById.get(member.user_id);
          return {
            user_id: member.user_id,
            email: authUser?.email ?? null,
            role: member.role,
            access_status: member.access_status,
            created_at: member.created_at,
            updated_at: member.updated_at,
            email_confirmed_at: authUser?.email_confirmed_at ?? null,
            last_sign_in_at: authUser?.last_sign_in_at ?? null,
          };
        });

      const rawOrganizationModules = modules.filter(
        (module) => module.organization_id === organization.id
      );
      const organizationModules: ControlCenterModuleAssignment[] = rawOrganizationModules
        .filter(
          (module) =>
            module.module_id !== "overview" &&
            VALID_MODULE_IDS.has(module.module_id as OrbyvenModuleId)
        )
        .map((module) => ({
          module_id: module.module_id as OrbyvenModuleId,
          enabled: module.enabled,
          settings: module.settings ?? {},
          updated_at: module.updated_at,
        }));

      const enabledModuleCount = organizationModules.filter((module) => module.enabled).length;
      const activeMembers = organizationMembers.filter(
        (member) => member.access_status === "active"
      );
      const hasOwner = activeMembers.some((member) => member.role === "owner");
      const unknownModuleCount = rawOrganizationModules.filter(
        (module) =>
          module.module_id !== "overview" &&
          !VALID_MODULE_IDS.has(module.module_id as OrbyvenModuleId)
      ).length;
      const pendingInviteCount = organizationMembers.filter(
        (member) => !member.email_confirmed_at
      ).length;
      const timestamps = [
        organization.updated_at,
        rawProfile?.updated_at ?? null,
        ...organizationMembers.map((member) => member.updated_at),
        ...organizationModules.map((module) => module.updated_at),
      ].filter((value): value is string => Boolean(value));
      const lastConfigUpdate = timestamps.sort().at(-1) ?? null;
      const lifecycleActive = organization.lifecycle_status === "active";
      const healthy =
        lifecycleActive &&
        Boolean(rawProfile) &&
        hasOwner &&
        activeMembers.length > 0 &&
        unknownModuleCount === 0;

      return {
        ...organization,
        profile: rawProfile
          ? {
              display_name: rawProfile.display_name,
              greeting_name: rawProfile.greeting_name,
              logo_url: rawProfile.logo_url,
              timezone: rawProfile.timezone,
              locale: rawProfile.locale,
              settings: rawProfile.settings ?? {},
            }
          : null,
        members: organizationMembers,
        modules: organizationModules,
        technical_status: {
          state: !lifecycleActive ? "suspended" : healthy ? "healthy" : "attention",
          checks: {
            profile: Boolean(rawProfile),
            owner: hasOwner,
            members: organizationMembers.length > 0,
            active_members: activeMembers.length > 0,
            known_modules: unknownModuleCount === 0,
            lifecycle_active: lifecycleActive,
          },
          member_count: organizationMembers.length,
          active_member_count: activeMembers.length,
          pending_invite_count: pendingInviteCount,
          enabled_module_count: enabledModuleCount,
          last_config_update: lastConfigUpdate,
        },
        subscription: { ...EMPTY_ENTITLEMENT_SNAPSHOT },
      };
    }
  );

  const platformStaff: ControlCenterPlatformStaff[] = ((staffResult.data ?? []) as RawStaff[]).map(
    (staff) => ({
      ...staff,
      email: authById.get(staff.user_id)?.email ?? null,
    })
  );

  const auditEvents: ControlCenterAuditEvent[] = ((auditResult.data ?? []) as RawAudit[]).map(
    (event) => ({
      ...event,
      actor_email: event.actor_user_id
        ? authById.get(event.actor_user_id)?.email ?? null
        : null,
      metadata: event.metadata ?? {},
    })
  );

  return {
    organizations,
    auth_users: authUsers,
    platform_staff: platformStaff,
    audit_events: auditEvents,
    current_staff: {
      user_id: currentUser.id,
      email: currentUser.email ?? null,
      role: currentStaffRole,
      source: currentStaffSource,
    },
    entitlement_source: "chat3-pending",
  };
}

function requireText(value: unknown, field: string, min = 1, max = 160) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length < min || text.length > max) {
    throw new ControlCenterHttpError(400, "invalid_input", `${field} is invalid.`);
  }
  return text;
}

function optionalText(value: unknown, max = 300) {
  if (value === null || value === undefined || value === "") return null;
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || text.length > max) {
    throw new ControlCenterHttpError(400, "invalid_input", "Invalid text value.");
  }
  return text;
}

function requireRole(value: unknown): OrbyvenPlatformRole {
  if (typeof value !== "string" || !VALID_ROLES.has(value as OrbyvenPlatformRole)) {
    throw new ControlCenterHttpError(400, "invalid_role", "Invalid organization role.");
  }
  return value as OrbyvenPlatformRole;
}

function requireStaffRoleValue(value: unknown): OrbyvenStaffRole {
  if (typeof value !== "string" || !VALID_STAFF_ROLES.has(value as OrbyvenStaffRole)) {
    throw new ControlCenterHttpError(400, "invalid_staff_role", "Invalid platform staff role.");
  }
  return value as OrbyvenStaffRole;
}

function requireLifecycleStatus(value: unknown): OrbyvenOrganizationLifecycleStatus {
  if (
    typeof value !== "string" ||
    !VALID_LIFECYCLE_STATUSES.has(value as OrbyvenOrganizationLifecycleStatus)
  ) {
    throw new ControlCenterHttpError(400, "invalid_lifecycle", "Invalid organization lifecycle status.");
  }
  return value as OrbyvenOrganizationLifecycleStatus;
}

function requireMemberAccess(value: unknown): OrbyvenMemberAccessStatus {
  if (
    typeof value !== "string" ||
    !VALID_MEMBER_ACCESS.has(value as OrbyvenMemberAccessStatus)
  ) {
    throw new ControlCenterHttpError(400, "invalid_access_status", "Invalid member access status.");
  }
  return value as OrbyvenMemberAccessStatus;
}

function requireEmail(value: unknown) {
  const email = requireText(value, "email", 5, 320).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new ControlCenterHttpError(400, "invalid_email", "Email invalid.");
  }
  return email;
}

function cleanSlug(value: unknown) {
  const slug = requireText(value, "slug", 3, 50).toLowerCase();
  if (!SLUG_PATTERN.test(slug)) {
    throw new ControlCenterHttpError(400, "invalid_slug", "Invalid organization slug.");
  }
  return slug;
}

function cleanSettings(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

async function recordAudit(
  admin: SupabaseClient,
  actor: User,
  actorRole: OrbyvenStaffRole,
  action: string,
  options: {
    organizationId?: string | null;
    targetType?: string | null;
    targetId?: string | null;
    metadata?: Record<string, unknown>;
  } = {}
) {
  const { error } = await admin.from("platform_audit_log").insert({
    actor_user_id: actor.id,
    actor_role: actorRole,
    organization_id: options.organizationId ?? null,
    action,
    target_type: options.targetType ?? null,
    target_id: options.targetId ?? null,
    metadata: options.metadata ?? {},
  });

  if (error) {
    // Do not roll back a completed platform operation only because its audit write
    // failed in a separate request transaction. Surface it in server logs instead.
    console.error("ORBYVEN audit write failed", error);
  }
}

async function ensureOrganizationExists(admin: SupabaseClient, organizationId: string) {
  const { data, error } = await admin
    .from("organizations")
    .select("id")
    .eq("id", organizationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new ControlCenterHttpError(404, "organization_not_found", "Organizația nu există.");
  }
}

async function ensureUserNotInAnotherOrganization(
  admin: SupabaseClient,
  userId: string,
  organizationId: string
) {
  const { data, error } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .neq("organization_id", organizationId)
    .limit(1);
  if (error) throw error;
  if (data?.length) {
    throw new ControlCenterHttpError(
      409,
      "user_already_assigned",
      "Utilizatorul este deja atribuit altei organizații. Conturile client rămân single-organization până există un switcher explicit în workspace."
    );
  }
}

async function protectLastActiveOwner(
  admin: SupabaseClient,
  organizationId: string,
  userId: string,
  next?: { role?: OrbyvenPlatformRole; access?: OrbyvenMemberAccessStatus; remove?: boolean }
) {
  const { data: target, error: targetError } = await admin
    .from("organization_members")
    .select("role,access_status")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (targetError) throw targetError;
  if (!target || target.role !== "owner" || target.access_status !== "active") return;

  const willRemainActiveOwner =
    !next?.remove &&
    (next?.role ?? target.role) === "owner" &&
    (next?.access ?? target.access_status) === "active";
  if (willRemainActiveOwner) return;

  const { count, error: countError } = await admin
    .from("organization_members")
    .select("user_id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .eq("access_status", "active");
  if (countError) throw countError;

  if ((count ?? 0) <= 1) {
    throw new ControlCenterHttpError(
      409,
      "last_owner_protected",
      "Nu poți elimina, suspenda sau retrograda ultimul owner activ al organizației."
    );
  }
}

export async function createControlCenterOrganization(
  admin: SupabaseClient,
  actor: User,
  actorRole: OrbyvenStaffRole,
  input: Record<string, unknown>
) {
  const name = requireText(input.name, "name", 2, 120);
  const slug = cleanSlug(input.slug);
  const legalName = optionalText(input.legal_name, 160) ?? name;
  const displayName = optionalText(input.display_name, 160) ?? name;
  const greetingName = optionalText(input.greeting_name, 80);
  const moduleIds = Array.isArray(input.module_ids)
    ? input.module_ids.filter(
        (moduleId): moduleId is OrbyvenModuleId =>
          typeof moduleId === "string" &&
          moduleId !== "overview" &&
          VALID_MODULE_IDS.has(moduleId as OrbyvenModuleId)
      )
    : [];

  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .insert({
      name,
      slug,
      legal_name: legalName,
      lifecycle_status: "active",
      created_by: actor.id,
    })
    .select("id")
    .single();

  if (organizationError) throw organizationError;

  try {
    const { error: profileError } = await admin.from("organization_profiles").insert({
      organization_id: organization.id,
      display_name: displayName,
      greeting_name: greetingName,
      timezone: "Europe/Bucharest",
      locale: "ro-RO",
      settings: {},
    });
    if (profileError) throw profileError;

    if (moduleIds.length) {
      const { error: moduleError } = await admin.from("organization_modules").insert(
        Array.from(new Set(moduleIds)).map((moduleId) => ({
          organization_id: organization.id,
          module_id: moduleId,
          enabled: true,
          settings: {},
        }))
      );
      if (moduleError) throw moduleError;
    }
  } catch (error) {
    await admin.from("organizations").delete().eq("id", organization.id);
    throw error;
  }

  await recordAudit(admin, actor, actorRole, "organization.create", {
    organizationId: organization.id,
    targetType: "organization",
    targetId: organization.id,
    metadata: { name, slug, initial_modules: moduleIds },
  });

  return organization.id as string;
}

export async function updateControlCenterOrganization(
  admin: SupabaseClient,
  actor: User,
  actorRole: OrbyvenStaffRole,
  input: Record<string, unknown>
) {
  const organizationId = requireText(input.organization_id, "organization_id", 10, 80);
  const name = requireText(input.name, "name", 2, 120);
  const slug = cleanSlug(input.slug);
  const legalName = optionalText(input.legal_name, 160);
  const displayName = optionalText(input.display_name, 160);
  const greetingName = optionalText(input.greeting_name, 80);
  const logoUrl = optionalText(input.logo_url, 500);
  const timezone = requireText(input.timezone ?? "Europe/Bucharest", "timezone", 2, 80);
  const locale = requireText(input.locale ?? "ro-RO", "locale", 2, 20);
  const settings = cleanSettings(input.profile_settings);

  const { error: organizationError } = await admin
    .from("organizations")
    .update({ name, slug, legal_name: legalName })
    .eq("id", organizationId);
  if (organizationError) throw organizationError;

  const { error: profileError } = await admin.from("organization_profiles").upsert(
    {
      organization_id: organizationId,
      display_name: displayName,
      greeting_name: greetingName,
      logo_url: logoUrl,
      timezone,
      locale,
      settings,
    },
    { onConflict: "organization_id" }
  );
  if (profileError) throw profileError;

  await recordAudit(admin, actor, actorRole, "organization.update", {
    organizationId,
    targetType: "organization",
    targetId: organizationId,
    metadata: { name, slug, legal_name: legalName, display_name: displayName },
  });
}

export async function assignControlCenterMember(
  admin: SupabaseClient,
  actor: User,
  actorRole: OrbyvenStaffRole,
  input: Record<string, unknown>
) {
  const organizationId = requireText(input.organization_id, "organization_id", 10, 80);
  const userId = requireText(input.user_id, "user_id", 10, 80);
  const role = requireRole(input.role);

  await ensureOrganizationExists(admin, organizationId);
  await ensureUserNotInAnotherOrganization(admin, userId, organizationId);

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !userData.user) {
    throw new ControlCenterHttpError(404, "user_not_found", "Supabase Auth user not found.");
  }

  await protectLastActiveOwner(admin, organizationId, userId, { role });

  const { error } = await admin.from("organization_members").upsert(
    {
      organization_id: organizationId,
      user_id: userId,
      role,
      access_status: "active",
    },
    { onConflict: "organization_id,user_id" }
  );
  if (error) throw error;

  await recordAudit(admin, actor, actorRole, "member.assign", {
    organizationId,
    targetType: "user",
    targetId: userId,
    metadata: { role },
  });
}

export async function removeControlCenterMember(
  admin: SupabaseClient,
  actor: User,
  actorRole: OrbyvenStaffRole,
  input: Record<string, unknown>
) {
  const organizationId = requireText(input.organization_id, "organization_id", 10, 80);
  const userId = requireText(input.user_id, "user_id", 10, 80);

  await protectLastActiveOwner(admin, organizationId, userId, { remove: true });

  const { error } = await admin
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  if (error) throw error;

  await recordAudit(admin, actor, actorRole, "member.remove", {
    organizationId,
    targetType: "user",
    targetId: userId,
  });
}

export async function setControlCenterModules(
  admin: SupabaseClient,
  actor: User,
  actorRole: OrbyvenStaffRole,
  input: Record<string, unknown>
) {
  const organizationId = requireText(input.organization_id, "organization_id", 10, 80);
  const assignments = Array.isArray(input.modules) ? input.modules : [];

  const rows = assignments
    .map((assignment) => {
      if (!assignment || typeof assignment !== "object" || Array.isArray(assignment)) {
        return null;
      }
      const object = assignment as Record<string, unknown>;
      const moduleId = object.module_id;
      if (
        typeof moduleId !== "string" ||
        moduleId === "overview" ||
        !VALID_MODULE_IDS.has(moduleId as OrbyvenModuleId)
      ) {
        return null;
      }
      return {
        organization_id: organizationId,
        module_id: moduleId,
        enabled: Boolean(object.enabled),
        settings: cleanSettings(object.settings),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (!rows.length) return;

  const { error } = await admin
    .from("organization_modules")
    .upsert(rows, { onConflict: "organization_id,module_id" });
  if (error) throw error;

  await recordAudit(admin, actor, actorRole, "modules.update", {
    organizationId,
    targetType: "organization",
    targetId: organizationId,
    metadata: {
      modules: rows.map((row) => ({ module_id: row.module_id, enabled: row.enabled })),
    },
  });
}

export async function setOrganizationLifecycle(
  admin: SupabaseClient,
  actor: User,
  actorRole: OrbyvenStaffRole,
  input: Record<string, unknown>
) {
  const organizationId = requireText(input.organization_id, "organization_id", 10, 80);
  const status = requireLifecycleStatus(input.lifecycle_status);

  const { error } = await admin
    .from("organizations")
    .update({ lifecycle_status: status })
    .eq("id", organizationId);
  if (error) throw error;

  await recordAudit(admin, actor, actorRole, "organization.lifecycle", {
    organizationId,
    targetType: "organization",
    targetId: organizationId,
    metadata: { lifecycle_status: status },
  });
}

export async function setMemberAccessStatus(
  admin: SupabaseClient,
  actor: User,
  actorRole: OrbyvenStaffRole,
  input: Record<string, unknown>
) {
  const organizationId = requireText(input.organization_id, "organization_id", 10, 80);
  const userId = requireText(input.user_id, "user_id", 10, 80);
  const accessStatus = requireMemberAccess(input.access_status);

  await protectLastActiveOwner(admin, organizationId, userId, { access: accessStatus });

  const { data, error } = await admin
    .from("organization_members")
    .update({ access_status: accessStatus })
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new ControlCenterHttpError(404, "membership_not_found", "Membership-ul nu există.");
  }

  await recordAudit(admin, actor, actorRole, "member.access", {
    organizationId,
    targetType: "user",
    targetId: userId,
    metadata: { access_status: accessStatus },
  });
}

export async function inviteControlCenterMember(
  admin: SupabaseClient,
  actor: User,
  actorRole: OrbyvenStaffRole,
  input: Record<string, unknown>,
  origin: string
) {
  const organizationId = requireText(input.organization_id, "organization_id", 10, 80);
  const email = requireEmail(input.email);
  const role = requireRole(input.role);

  await ensureOrganizationExists(admin, organizationId);

  let authUser = await findAuthUserByEmail(admin, email);
  let invited = false;
  let createdUserId: string | null = null;

  if (!authUser) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/workspace/invite`,
      data: { orbyven_invited: true },
    });
    if (error || !data.user) {
      throw error ?? new ControlCenterHttpError(500, "invite_failed", "Invitația nu a putut fi creată.");
    }
    authUser = {
      id: data.user.id,
      email: data.user.email ?? email,
      created_at: data.user.created_at,
      last_sign_in_at: data.user.last_sign_in_at ?? null,
      email_confirmed_at: data.user.email_confirmed_at ?? null,
      banned_until: data.user.banned_until ?? null,
    };
    invited = true;
    createdUserId = data.user.id;
  }

  await ensureUserNotInAnotherOrganization(admin, authUser.id, organizationId);

  const { error: membershipError } = await admin.from("organization_members").upsert(
    {
      organization_id: organizationId,
      user_id: authUser.id,
      role,
      access_status: "active",
    },
    { onConflict: "organization_id,user_id" }
  );

  if (membershipError) {
    if (createdUserId) {
      await admin.auth.admin.deleteUser(createdUserId).catch(() => undefined);
    }
    throw membershipError;
  }

  await recordAudit(admin, actor, actorRole, invited ? "member.invite" : "member.attach_existing", {
    organizationId,
    targetType: "user",
    targetId: authUser.id,
    metadata: { email, role },
  });

  return { user_id: authUser.id, invited };
}

export async function sendControlCenterAccessEmail(
  admin: SupabaseClient,
  actor: User,
  actorRole: OrbyvenStaffRole,
  input: Record<string, unknown>,
  origin: string
) {
  const organizationId = requireText(input.organization_id, "organization_id", 10, 80);
  const email = requireEmail(input.email);

  const authUser = await findAuthUserByEmail(admin, email);
  if (!authUser) {
    throw new ControlCenterHttpError(404, "user_not_found", "Nu există un cont Auth pentru acest email.");
  }

  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("user_id", authUser.id)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) {
    throw new ControlCenterHttpError(404, "membership_not_found", "Userul nu aparține acestei organizații.");
  }

  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/workspace/reset-password`,
  });
  if (error) throw error;

  await recordAudit(admin, actor, actorRole, "member.access_email", {
    organizationId,
    targetType: "user",
    targetId: authUser.id,
    metadata: { email },
  });
}

export async function upsertPlatformStaff(
  admin: SupabaseClient,
  actor: User,
  actorRole: OrbyvenStaffRole,
  input: Record<string, unknown>
) {
  const userId = requireText(input.user_id, "user_id", 10, 80);
  const role = requireStaffRoleValue(input.role);

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !userData.user) {
    throw new ControlCenterHttpError(404, "user_not_found", "Supabase Auth user not found.");
  }

  const { error } = await admin.from("platform_staff").upsert(
    {
      user_id: userId,
      role,
      enabled: true,
      created_by: actor.id,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;

  await recordAudit(admin, actor, actorRole, "platform_staff.upsert", {
    targetType: "platform_staff",
    targetId: userId,
    metadata: { role },
  });
}

export async function removePlatformStaff(
  admin: SupabaseClient,
  actor: User,
  actorRole: OrbyvenStaffRole,
  input: Record<string, unknown>
) {
  const userId = requireText(input.user_id, "user_id", 10, 80);

  const { data: target, error: targetError } = await admin
    .from("platform_staff")
    .select("role,enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (targetError) throw targetError;
  if (!target) return;

  if (target.role === "platform_owner" && target.enabled) {
    const { count, error: countError } = await admin
      .from("platform_staff")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "platform_owner")
      .eq("enabled", true);
    if (countError) throw countError;
    if ((count ?? 0) <= 1) {
      throw new ControlCenterHttpError(
        409,
        "last_platform_owner_protected",
        "Nu poți elimina ultimul platform_owner activ."
      );
    }
  }

  const { error } = await admin.from("platform_staff").delete().eq("user_id", userId);
  if (error) throw error;

  await recordAudit(admin, actor, actorRole, "platform_staff.remove", {
    targetType: "platform_staff",
    targetId: userId,
  });
}
