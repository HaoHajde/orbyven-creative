"use client";

import BrandLogo from "@/components/BrandLogo";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Organization = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "trial" | "paused" | "cancelled";
};

type Membership = {
  organization_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  organizations: Organization | Organization[] | null;
};

type Module = {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string | null;
};

type OrganizationModule = {
  module_id: string;
  enabled: boolean;
  modules: Module | Module[] | null;
};

function normalizeOne<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default function PlatformPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [membership, setMembership] = useState<Membership | null>(null);
  const [organizationModules, setOrganizationModules] = useState<OrganizationModule[]>([]);

  const organization = useMemo(
    () => normalizeOne(membership?.organizations ?? null),
    [membership]
  );

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const { data: authData, error: authError } = await orbyvenSupabase.auth.getUser();

    if (authError || !authData.user) {
      router.replace("/platform/login");
      return;
    }

    const { data: membershipData, error: membershipError } = await orbyvenSupabase
      .from("organization_memberships")
      .select("organization_id,role,organizations(id,name,slug,status)")
      .eq("user_id", authData.user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error(membershipError);
      setErrorMessage("Nu am putut încărca spațiul companiei. Verifică migrarea platformei și regulile RLS.");
      setLoading(false);
      return;
    }

    if (!membershipData) {
      router.replace("/platform/onboarding");
      return;
    }

    const typedMembership = membershipData as Membership;
    setMembership(typedMembership);

    const { data: moduleData, error: moduleError } = await orbyvenSupabase
      .from("organization_modules")
      .select("module_id,enabled,modules(id,name,description,route,icon)")
      .eq("organization_id", typedMembership.organization_id)
      .eq("enabled", true)
      .order("module_id", { ascending: true });

    if (moduleError) {
      console.error(moduleError);
      setErrorMessage("Compania a fost găsită, dar modulele nu au putut fi încărcate.");
      setLoading(false);
      return;
    }

    setOrganizationModules((moduleData ?? []) as OrganizationModule[]);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const logout = async () => {
    await orbyvenSupabase.auth.signOut();
    router.replace("/platform/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-sm text-[#6e6e73] dark:bg-black dark:text-[#a1a1a6]">
        Se pregătește workspace-ul ORBYVEN...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] antialiased dark:bg-black dark:text-[#f5f5f7]">
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/85 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-black/85">
        <div className="mx-auto flex h-[74px] max-w-[1500px] items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-4">
            <BrandLogo compact />
            <span className="hidden text-xs font-medium text-[#86868b] sm:block">Workspace</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="h-10 rounded-full border border-black/[0.1] px-4 text-xs font-medium dark:border-white/[0.14]"
          >
            Ieșire
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-12 md:px-10 md:py-16">
        {errorMessage ? (
          <section className="mx-auto max-w-2xl rounded-[30px] border border-black/[0.08] bg-white p-8 text-center dark:border-white/[0.1] dark:bg-[#111113]">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#86868b]">ORBYVEN</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">Workspace indisponibil momentan</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#6e6e73] dark:text-[#a1a1a6]">{errorMessage}</p>
            <button
              type="button"
              onClick={loadWorkspace}
              className="mt-6 h-11 rounded-full bg-[#1d1d1f] px-5 text-sm font-medium text-white dark:bg-[#f5f5f7] dark:text-black"
            >
              Încearcă din nou
            </button>
          </section>
        ) : (
          <>
            <section className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#86868b]">
                  {organization?.status === "trial" ? "Perioadă de test" : "Workspace activ"}
                </p>
                <h1 className="mt-5 max-w-4xl text-[48px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[62px] md:text-[76px]">
                  Bun venit, {organization?.name ?? "în ORBYVEN"}.
                </h1>
                <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[#6e6e73] dark:text-[#a1a1a6]">
                  Tot ce contează pentru compania ta, într-un singur loc. Fără meniuri inutile și fără complexitate pusă în fața ta.
                </p>
              </div>

              <div className="rounded-full bg-black/[0.04] px-4 py-2 text-xs text-[#6e6e73] dark:bg-white/[0.08] dark:text-[#a1a1a6]">
                Rol: <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{membership?.role}</span>
              </div>
            </section>

            <section className="mt-14">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#86868b]">Modulele tale</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Alege ce vrei să faci.</h2>
                </div>
              </div>

              {organizationModules.length === 0 ? (
                <div className="rounded-[30px] border border-black/[0.07] bg-white p-8 text-sm text-[#6e6e73] dark:border-white/[0.1] dark:bg-[#111113] dark:text-[#a1a1a6]">
                  Nu există încă module activate pentru această companie.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {organizationModules.map((assignment) => {
                    const module = normalizeOne(assignment.modules);
                    if (!module) return null;

                    return (
                      <Link
                        key={assignment.module_id}
                        href={module.route}
                        className="group flex min-h-[230px] flex-col justify-between rounded-[30px] border border-black/[0.07] bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)] dark:border-white/[0.1] dark:bg-[#111113]"
                      >
                        <div>
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5f5f7] text-lg dark:bg-[#1c1c1e]">
                            {module.id === "clients" ? "◎" : module.id === "jobs" ? "◇" : module.id === "bookings" ? "□" : "↗"}
                          </div>
                          <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em]">{module.name}</h3>
                          <p className="mt-3 text-sm leading-6 text-[#6e6e73] dark:text-[#a1a1a6]">{module.description}</p>
                        </div>
                        <span className="mt-8 text-sm font-medium transition-transform duration-300 group-hover:translate-x-1">Deschide →</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
