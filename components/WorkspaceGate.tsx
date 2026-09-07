"use client";

import ClientWorkspace from "@/components/ClientWorkspace";
import {
  ORBYVEN_MODULES,
  type OrbyvenModuleId,
} from "@/lib/orbyven-modules";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "orbyven-demo-enabled-modules";
const VALID_MODULE_IDS = new Set(ORBYVEN_MODULES.map((module) => module.id));

type Role = "owner" | "admin" | "manager" | "member" | "viewer";

type Organization = {
  id: string;
  name: string;
  slug: string;
};

type Membership = {
  organization_id: string;
  role: Role;
  organizations: Organization | Organization[] | null;
};

type OrganizationModuleRow = {
  module_id: string;
  enabled: boolean;
};

function normalizeOne<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function normalizeModuleIds(input: unknown): OrbyvenModuleId[] {
  if (!Array.isArray(input)) return ["overview"];

  const ids = input.filter(
    (value): value is OrbyvenModuleId =>
      typeof value === "string" && VALID_MODULE_IDS.has(value as OrbyvenModuleId)
  );

  return Array.from(new Set<OrbyvenModuleId>(["overview", ...ids]));
}

function sameModules(a: OrbyvenModuleId[], b: OrbyvenModuleId[]) {
  if (a.length !== b.length) return false;
  const right = new Set(b);
  return a.every((id) => right.has(id));
}

export default function WorkspaceGate() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [persistedModules, setPersistedModules] = useState<OrbyvenModuleId[]>([
    "overview",
  ]);
  const [workspaceKey, setWorkspaceKey] = useState(0);
  const syncingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setErrorMessage("");

      const { data: authData, error: authError } =
        await orbyvenSupabase.auth.getUser();

      if (cancelled) return;

      if (authError || !authData.user) {
        router.replace("/workspace/login");
        return;
      }

      const { data: membershipData, error: membershipError } =
        await orbyvenSupabase
          .from("organization_members")
          .select("organization_id,role,organizations(id,name,slug)")
          .eq("user_id", authData.user.id)
          .limit(1)
          .maybeSingle();

      if (cancelled) return;

      if (membershipError) {
        console.error(membershipError);
        setErrorMessage(
          "Workspace-ul nu poate fi încărcat. Verifică fundația multi-tenant din Supabase."
        );
        return;
      }

      if (!membershipData) {
        router.replace("/workspace/onboarding");
        return;
      }

      const membership = membershipData as Membership;
      const organization = normalizeOne(membership.organizations);

      if (!organization) {
        setErrorMessage("Compania asociată acestui cont nu a putut fi găsită.");
        return;
      }

      const { data: moduleRows, error: modulesError } = await orbyvenSupabase
        .from("organization_modules")
        .select("module_id,enabled")
        .eq("organization_id", membership.organization_id);

      if (cancelled) return;

      if (modulesError) {
        console.error(modulesError);
        setErrorMessage("Modulele companiei nu au putut fi încărcate.");
        return;
      }

      const enabled = normalizeModuleIds(
        ((moduleRows ?? []) as OrganizationModuleRow[])
          .filter((row) => row.enabled)
          .map((row) => row.module_id)
      );

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
      window.localStorage.setItem("orbyven-workspace-organization", organization.name);
      window.localStorage.setItem("orbyven-workspace-role", membership.role);

      setOrganizationId(membership.organization_id);
      setRole(membership.role);
      setPersistedModules(enabled);
      setReady(true);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!ready || !organizationId || !role) return;

    const canManageModules = role === "owner" || role === "admin";

    const syncModulePreferences = async () => {
      if (syncingRef.current) return;

      let desired: OrbyvenModuleId[];
      try {
        desired = normalizeModuleIds(
          JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")
        );
      } catch {
        desired = persistedModules;
      }

      if (sameModules(desired, persistedModules)) return;

      if (!canManageModules) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedModules));
        setWorkspaceKey((current) => current + 1);
        return;
      }

      syncingRef.current = true;

      const rows = ORBYVEN_MODULES.map((module) => ({
        organization_id: organizationId,
        module_id: module.id,
        enabled: desired.includes(module.id),
        settings: {},
        updated_at: new Date().toISOString(),
      }));

      const { error } = await orbyvenSupabase
        .from("organization_modules")
        .upsert(rows, { onConflict: "organization_id,module_id" });

      syncingRef.current = false;

      if (error) {
        console.error(error);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedModules));
        setWorkspaceKey((current) => current + 1);
        return;
      }

      setPersistedModules(desired);
    };

    const interval = window.setInterval(syncModulePreferences, 800);
    return () => window.clearInterval(interval);
  }, [organizationId, persistedModules, ready, role]);

  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-[#1d1d1f] dark:bg-black dark:text-[#f5f5f7]">
        <section className="w-full max-w-xl rounded-[30px] border border-black/[0.08] bg-[#f5f5f7] p-8 text-center dark:border-white/[0.1] dark:bg-[#111113]">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#86868b]">
            ORBYVEN · WORKSPACE
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
            Workspace indisponibil
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#6e6e73] dark:text-[#a1a1a6]">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 h-11 rounded-full bg-[#1d1d1f] px-5 text-sm font-medium text-white dark:bg-[#f5f5f7] dark:text-black"
          >
            Încearcă din nou
          </button>
        </section>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-sm text-[#6e6e73] dark:bg-black dark:text-[#a1a1a6]">
        Se pregătește workspace-ul ORBYVEN...
      </main>
    );
  }

  return <ClientWorkspace key={workspaceKey} />;
}
