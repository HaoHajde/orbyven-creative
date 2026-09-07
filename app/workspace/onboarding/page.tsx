"use client";

import BrandLogo from "@/components/BrandLogo";
import {
  ORBYVEN_MODULES,
  type OrbyvenModuleId,
} from "@/lib/orbyven-modules";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export default function WorkspaceOnboardingPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [selectedModules, setSelectedModules] = useState<OrbyvenModuleId[]>([
    "overview",
    "leads",
    "tasks",
  ]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const slug = useMemo(() => slugify(companyName), [companyName]);

  useEffect(() => {
    const check = async () => {
      const { data: authData } = await orbyvenSupabase.auth.getUser();
      if (!authData.user) {
        router.replace("/workspace/login");
        return;
      }

      const { data } = await orbyvenSupabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", authData.user.id)
        .limit(1)
        .maybeSingle();

      if (data) {
        router.replace("/workspace");
        return;
      }

      setChecking(false);
    };

    check();
  }, [router]);

  const toggleModule = (id: OrbyvenModuleId) => {
    if (id === "overview") return;

    setSelectedModules((current) =>
      current.includes(id)
        ? current.filter((moduleId) => moduleId !== id)
        : [...current, id]
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (companyName.trim().length < 2 || slug.length < 3) {
      setErrorMessage("Introdu un nume valid pentru companie.");
      return;
    }

    setLoading(true);

    const { error } = await orbyvenSupabase.rpc("bootstrap_organization", {
      p_name: companyName.trim(),
      p_slug: slug,
      p_module_ids: Array.from(
        new Set<OrbyvenModuleId>(["overview", ...selectedModules])
      ),
    });

    if (error) {
      console.error(error);
      setErrorMessage(
        error.message.toLowerCase().includes("duplicate")
          ? "Identificatorul companiei este deja folosit. Modifică puțin numele și încearcă din nou."
          : "Compania nu a putut fi creată. Verifică integrarea Supabase și încearcă din nou."
      );
      setLoading(false);
      return;
    }

    router.replace("/workspace");
  };

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-sm text-[#6e6e73] dark:bg-black dark:text-[#a1a1a6]">
        Se verifică workspace-ul...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] antialiased dark:bg-black dark:text-[#f5f5f7]">
      <div className="mx-auto max-w-[1180px] px-6 py-6 md:px-10">
        <header className="flex items-center justify-between">
          <BrandLogo compact />
          <span className="rounded-full bg-black/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73] dark:bg-white/[0.08] dark:text-[#a1a1a6]">
            Configurare
          </span>
        </header>

        <form onSubmit={submit} className="py-14 md:py-20">
          <section className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#86868b]">
              ORBYVEN · PRIMUL PAS
            </p>
            <h1 className="mt-5 text-[48px] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[64px] md:text-[76px]">
              Construim doar ce îți trebuie.
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[#6e6e73] dark:text-[#a1a1a6]">
              Spune-ne numele companiei și alege instrumentele cu care vrei să începi. Le poți modifica ulterior din workspace.
            </p>
          </section>

          <section className="mt-12 rounded-[32px] border border-black/[0.07] bg-white p-6 dark:border-white/[0.1] dark:bg-[#111113] sm:p-8">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.13em] text-[#86868b]">
                Companie
              </span>
              <input
                value={companyName}
                onChange={(event) => {
                  setCompanyName(event.target.value);
                  setErrorMessage("");
                }}
                required
                autoFocus
                placeholder="Ex. Neagu Costică SRL"
                className="mt-4 w-full rounded-[20px] border border-black/[0.08] bg-[#f5f5f7] px-5 py-4 text-base outline-none focus:border-[#4b46ee] focus:ring-4 focus:ring-[#4b46ee]/10 dark:border-white/[0.1] dark:bg-black"
              />
            </label>

            <div className="mt-4 text-xs text-[#86868b]">
              Workspace: <span className="font-medium">{slug || "numele-companiei"}</span>
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#86868b]">
                Module inițiale
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                Ce folosește compania acum?
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {ORBYVEN_MODULES.map((module) => {
                const selected = selectedModules.includes(module.id);
                const core = module.id === "overview";

                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => toggleModule(module.id)}
                    className={`min-h-[220px] rounded-[28px] border p-6 text-left transition ${
                      selected
                        ? "border-[#4b46ee]/35 bg-[#4b46ee]/[0.06] shadow-[0_16px_45px_rgba(75,70,238,0.08)]"
                        : "border-black/[0.07] bg-white hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.05)] dark:border-white/[0.1] dark:bg-[#111113]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: module.color }}
                      />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#86868b]">
                        {core ? "Inclus" : selected ? "Activ" : "Opțional"}
                      </span>
                    </div>
                    <h3 className="mt-7 text-xl font-semibold tracking-[-0.035em]">
                      {module.shortName}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#6e6e73] dark:text-[#a1a1a6]">
                      {module.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {errorMessage && (
            <div className="mt-6 rounded-[20px] border border-red-500/20 bg-red-500/[0.06] px-5 py-4 text-sm text-red-500">
              {errorMessage}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-full bg-[#1d1d1f] px-7 text-sm font-medium text-white disabled:opacity-60 dark:bg-[#f5f5f7] dark:text-black"
            >
              {loading ? "Se configurează..." : "Creează workspace-ul →"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
