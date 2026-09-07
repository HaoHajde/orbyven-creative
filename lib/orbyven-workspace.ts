import { ORBYVEN_MODULES, type OrbyvenModuleId } from "@/lib/orbyven-modules";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";

export type OrbyvenOrganization = {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
};

export type OrbyvenMembership = {
  organization_id: string;
  role: "owner" | "admin" | "manager" | "member" | "viewer";
};

export type OrbyvenWorkspace = {
  user: {
    id: string;
    email: string | null;
  };
  organization: OrbyvenOrganization;
  membership: OrbyvenMembership;
  enabledModules: OrbyvenModuleId[];
  profile: {
    display_name: string | null;
    greeting_name: string | null;
    logo_url: string | null;
    timezone: string;
    locale: string;
  } | null;
};

export type WorkspaceEntryPath =
  | "/workspace/login"
  | "/workspace/onboarding"
  | "/workspace";

const validModuleIds = new Set<OrbyvenModuleId>(
  ORBYVEN_MODULES.map((module) => module.id)
);

export async function getWorkspaceEntryPath(): Promise<WorkspaceEntryPath> {
  const { data: authData, error: authError } = await orbyvenSupabase.auth.getUser();

  if (authError || !authData.user) return "/workspace/login";

  const { data, error } = await orbyvenSupabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? "/workspace" : "/workspace/onboarding";
}

export async function getCurrentWorkspace(): Promise<OrbyvenWorkspace | null> {
  const { data: authData, error: authError } = await orbyvenSupabase.auth.getUser();

  if (authError || !authData.user) return null;

  const { data: memberships, error: membershipError } = await orbyvenSupabase
    .from("organization_members")
    .select("organization_id,role")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (membershipError) throw membershipError;

  const membership = memberships?.[0] as OrbyvenMembership | undefined;
  if (!membership) return null;

  const [organizationResult, modulesResult, profileResult] = await Promise.all([
    orbyvenSupabase
      .from("organizations")
      .select("id,name,slug,legal_name")
      .eq("id", membership.organization_id)
      .single(),
    orbyvenSupabase
      .from("organization_modules")
      .select("module_id,enabled")
      .eq("organization_id", membership.organization_id)
      .eq("enabled", true),
    orbyvenSupabase
      .from("organization_profiles")
      .select("display_name,greeting_name,logo_url,timezone,locale")
      .eq("organization_id", membership.organization_id)
      .maybeSingle(),
  ]);

  if (organizationResult.error) throw organizationResult.error;
  if (modulesResult.error) throw modulesResult.error;
  if (profileResult.error) throw profileResult.error;

  const enabledModules = (modulesResult.data ?? [])
    .map((row) => row.module_id as OrbyvenModuleId)
    .filter((moduleId) => validModuleIds.has(moduleId));

  return {
    user: {
      id: authData.user.id,
      email: authData.user.email ?? null,
    },
    organization: organizationResult.data as OrbyvenOrganization,
    membership,
    enabledModules: [
      "overview",
      ...enabledModules.filter((moduleId) => moduleId !== "overview"),
    ],
    profile: profileResult.data,
  };
}

export async function setOrganizationModuleEnabled(
  organizationId: string,
  moduleId: OrbyvenModuleId,
  enabled: boolean
) {
  if (moduleId === "overview") return;

  const { error } = await orbyvenSupabase
    .from("organization_modules")
    .upsert(
      {
        organization_id: organizationId,
        module_id: moduleId,
        enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,module_id" }
    );

  if (error) throw error;
}

export async function ensureDefaultModules(
  organizationId: string,
  moduleIds: OrbyvenModuleId[]
) {
  const rows = moduleIds
    .filter((moduleId) => moduleId !== "overview")
    .map((moduleId) => ({
      organization_id: organizationId,
      module_id: moduleId,
      enabled: true,
    }));

  if (!rows.length) return;

  const { error } = await orbyvenSupabase
    .from("organization_modules")
    .upsert(rows, {
      onConflict: "organization_id,module_id",
      ignoreDuplicates: true,
    });

  if (error) throw error;
}
