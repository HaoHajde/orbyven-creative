"use client";

import BrandLogo from "@/components/BrandLogo";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

const availableModules = [
  { id: "clients", name: "Clienți", description: "Contacte, istoric și relația cu clienții." },
  { id: "jobs", name: "Lucrări", description: "Lucrări, statusuri și activitatea din teren." },
  { id: "bookings", name: "Rezervări", description: "Programări și disponibilitate." },
  { id: "quotes", name: "Oferte", description: "Oferte comerciale și urmărirea lor." },
];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export default function PlatformOnboardingPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>(["clients"]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const slug = useMemo(() => slugify(companyName), [companyName]);

  useEffect(() => {
    const verify = async () => {
      const { data: authData, error: authError } = await orbyvenSupabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/platform/login");
        return;
      }

      const { data } = await orbyvenSupabase
        .from("organization_memberships")
        .select("organization_id")
        .eq("user_id", authData.user.id)
        .limit(1)
        .maybeSingle();

      if (data) {
        router.replace("/platform");
        return;
      }

      setLoading(false);
    };

    verify();
  }, [router]);

  const toggleModule = (id: string) => {
    setSelectedModules((current) =>
      current.includes(id)
        ? current.filter((moduleId) => moduleId !== id)
        : [...current, id]
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (companyName.trim().length < 2) {
      setErrorMessage("Introdu numele companiei.");
      return;
    }

    if (slug.length < 3) {
      setErrorMessage("Numele companiei trebuie să genereze un identificator valid.");
      return;
    }

    setSubmitting(true);

    const { error } = await orbyvenSupabase.rpc("bootstrap_organization", {
      p_name: companyName.trim(),
      p_slug: slug,
      p_module_ids: selectedModules.length > 0 ? selectedModules : ["clients"],
    });

    if (error) {
      console.error(error);
      const message = error.message.toLowerCase();
      setErrorMessage(
        message.includes("duplicate") || message.includes("unique")
          ? "Acest identificator de companie este deja folosit. Modifică puțin numele și încearcă din nou."
          : "Workspace-ul nu a putut fi creat. Verifică migrarea Supabase și încearcă din nou."
      );
      setSubmitting(false);
      return;
    }

    router.replace("/platform");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-sm text-[#6e6e73] dark:bg-black dark:text-[#a1a1a6]">
        Pregătim configurarea ORBYVEN...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] antialiased dark:bg-black dark:text-[#f5f5f7]">
      <div className="mx-auto max-w-[1180px] px-6 py-8 md:px-10 md:py-12">
        <header className="flex items-center justify-between">
          <BrandLogo compact />
          <span className="rounded-full bg-black/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73] dark:bg-white/[0.08] dark:text-[#a1a1a6]">
            Configurare inițială
          </span>
        </header>

        <section className="mx-auto mt-16 max-w-3xl text-center md:mt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#86868b]">ORBYVEN · START</p>
          <h1 className="mt-5 text-[48px] font-semibold leading-[0.96] tracking-[-0.055em] sm:text-[62px] md:text-[72px]">
            Construim workspace-ul companiei tale.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-7 text-[#6e6e73] dark:text-[#a1a1a6]">
            Spune-ne cum se numește compania și ce instrumente vrei să vezi. Restul complexității rămâne în spate.
          </p>
        </section>

        <form onSubmit={submit} className="mx-auto mt-12 max-w-4xl space-y-6">
          <section className="rounded-[34px] border border-black/[0.07] bg-white p-6 dark:border-white/[0.1] dark:bg-[#111113] md:p-8">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">Companie</span>
              <input
                type="text"
                required
                value={companyName}
                onChange={(event) => {
                  setCompanyName(event.target.value);
                  setErrorMessage("");
                }}
                placeholder="Ex. Neagu Costică SRL"
                className="mt-3 w-full rounded-[20px] border border-black/[0.08] bg-[#fbfbfd] px-5 py-4 text-lg font-medium outline-none focus:border-[#4b46ee] focus:ring-4 focus:ring-[#4b46ee]/10 dark:border-white/[0.1] dark:bg-black"
              />
            </label>

            <div className="mt-4 rounded-[18px] bg-black/[0.035] px-4 py-3 text-xs text-[#6e6e73] dark:bg-white/[0.06] dark:text-[#a1a1a6]">
              Identificator intern: <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{slug || "—"}</span>
            </div>
          </section>

          <section className="rounded-[34px] border border-black/[0.07] bg-white p-6 dark:border-white/[0.1] dark:bg-[#111113] md:p-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#86868b]">Module inițiale</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Alege doar ce îți trebuie acum.</h2>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {availableModules.map((module) => {
                const active = selectedModules.includes(module.id);
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => toggleModule(module.id)}
                    className={`rounded-[24px] border p-5 text-left transition ${
                      active
                        ? "border-[#4b46ee] bg-[#4b46ee]/[0.06]"
                        : "border-black/[0.07] bg-[#fbfbfd] hover:border-black/[0.14] dark:border-white/[0.1] dark:bg-black dark:hover:border-white/[0.2]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold tracking-[-0.025em]">{module.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#6e6e73] dark:text-[#a1a1a6]">{module.description}</p>
                      </div>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${active ? "border-[#4b46ee] bg-[#4b46ee] text-white" : "border-black/[0.14] dark:border-white/[0.2]"}`}>
                        {active ? "✓" : ""}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {errorMessage && (
            <div className="rounded-[20px] border border-red-500/20 bg-red-500/[0.06] px-5 py-4 text-sm text-red-500">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-13 w-full items-center justify-center rounded-full bg-[#1d1d1f] px-6 text-sm font-medium text-white transition-opacity disabled:opacity-60 dark:bg-[#f5f5f7] dark:text-black"
          >
            {submitting ? "Se creează workspace-ul..." : "Creează workspace-ul ORBYVEN"}
          </button>
        </form>
      </div>
    </main>
  );
}
