import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

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

export async function getCurrentWorkspace(): Promise<OrbyvenWorkspace | null> {
  const { data: authData, error: authError } = await orbyvenSupabase.auth.getUser();

  if (authError || !authData.user) return null;

  const { data: memberships, error: membershipError } = await orbyvenSupabase
    .from("organization_members")
    .select("organization_id,role")
    .eq("user_id", authData.user.id)
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

  return {
    organization: organizationResult.data as OrbyvenOrganization,
    membership,
    enabledModules: (modulesResult.data ?? []).map(
      (row) => row.module_id as OrbyvenModuleId
    ),
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
