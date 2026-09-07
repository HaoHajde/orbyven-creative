import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import {
  EMPTY_ENTITLEMENT_SNAPSHOT,
  type ControlCenterAuthUser,
  type ControlCenterMember,
  type ControlCenterModuleAssignment,
  type ControlCenterOrganization,
  type ControlCenterOrganizationProfile,
  type ControlCenterPayload,
  type OrbyvenPlatformRole,
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
const VALID_MODULE_IDS = new Set<OrbyvenModuleId>(
  ORBYVEN_MODULES.map((module) => module.id)
);
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

export class ControlCenterHttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

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

export async function authorizeControlCenter(request: Request): Promise<{
  admin: SupabaseClient;
  user: User;
}> {
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

  const emails = allowedAdminEmails();
  const userIds = allowedAdminUserIds();

  if (emails.size === 0 && userIds.size === 0) {
    throw new ControlCenterHttpError(
      503,
      "admin_allowlist_missing",
      "Configure ORBYVEN_CONTROL_CENTER_ADMIN_EMAILS or ORBYVEN_CONTROL_CENTER_ADMIN_USER_IDS."
    );
  }

  const email = data.user.email?.toLowerCase() ?? "";
  if (!emails.has(email) && !userIds.has(data.user.id)) {
    throw new ControlCenterHttpError(403, "not_platform_admin", "Control Center access denied.");
  }

  return { admin, user: data.user };
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
      }))
    );

    if (data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

type RawProfile = ControlCenterOrganizationProfile & {
  organization_id: string;
  updated_at: string;
};

type RawMember = {
  organization_id: string;
  user_id: string;
  role: OrbyvenPlatformRole;
  created_at: string;
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
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function loadControlCenterPayload(
  admin: SupabaseClient
): Promise<ControlCenterPayload> {
  const [organizationsResult, profilesResult, membersResult, modulesResult, authUsers] =
    await Promise.all([
      admin
        .from("organizations")
        .select("id,name,slug,legal_name,created_by,created_at,updated_at")
        .order("created_at", { ascending: false }),
      admin
        .from("organization_profiles")
        .select(
          "organization_id,display_name,greeting_name,logo_url,timezone,locale,settings,updated_at"
        ),
      admin
        .from("organization_members")
        .select("organization_id,user_id,role,created_at")
        .order("created_at", { ascending: true }),
      admin
        .from("organization_modules")
        .select("organization_id,module_id,enabled,settings,updated_at"),
      listAllAuthUsers(admin),
    ]);

  if (organizationsResult.error) throw organizationsResult.error;
  if (profilesResult.error) throw profilesResult.error;
  if (membersResult.error) throw membersResult.error;
  if (modulesResult.error) throw modulesResult.error;

  const emailByUser = new Map(authUsers.map((user) => [user.id, user.email]));
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
        .map((member) => ({
          user_id: member.user_id,
          email: emailByUser.get(member.user_id) ?? null,
          role: member.role,
          created_at: member.created_at,
        }));
      const organizationModules: ControlCenterModuleAssignment[] = modules
        .filter(
          (module) =>
            module.organization_id === organization.id &&
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
      const hasOwner = organizationMembers.some((member) => member.role === "owner");
      const timestamps = [
        organization.updated_at,
        rawProfile?.updated_at ?? null,
        ...organizationModules.map((module) => module.updated_at),
      ].filter((value): value is string => Boolean(value));
      const lastConfigUpdate = timestamps.sort().at(-1) ?? null;

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
          state:
            rawProfile && hasOwner && organizationMembers.length > 0
              ? "healthy"
              : "attention",
          checks: {
            profile: Boolean(rawProfile),
            owner: hasOwner,
            members: organizationMembers.length > 0,
          },
          member_count: organizationMembers.length,
          enabled_module_count: enabledModuleCount,
          last_config_update: lastConfigUpdate,
        },
        subscription: { ...EMPTY_ENTITLEMENT_SNAPSHOT },
      };
    }
  );

  return {
    organizations,
    auth_users: authUsers,
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

export async function createControlCenterOrganization(
  admin: SupabaseClient,
  actor: User,
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

  return organization.id as string;
}

export async function updateControlCenterOrganization(
  admin: SupabaseClient,
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
}

export async function assignControlCenterMember(
  admin: SupabaseClient,
  input: Record<string, unknown>
) {
  const organizationId = requireText(input.organization_id, "organization_id", 10, 80);
  const userId = requireText(input.user_id, "user_id", 10, 80);
  const role = requireRole(input.role);

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !userData.user) {
    throw new ControlCenterHttpError(404, "user_not_found", "Supabase Auth user not found.");
  }

  const { error } = await admin.from("organization_members").upsert(
    {
      organization_id: organizationId,
      user_id: userId,
      role,
    },
    { onConflict: "organization_id,user_id" }
  );
  if (error) throw error;
}

export async function removeControlCenterMember(
  admin: SupabaseClient,
  input: Record<string, unknown>
) {
  const organizationId = requireText(input.organization_id, "organization_id", 10, 80);
  const userId = requireText(input.user_id, "user_id", 10, 80);

  const { error } = await admin
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function setControlCenterModules(
  admin: SupabaseClient,
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
}
