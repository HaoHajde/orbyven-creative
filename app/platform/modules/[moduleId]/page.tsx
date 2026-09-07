"use client";

import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const names: Record<string, string> = {
  clients: "Clienți",
  jobs: "Lucrări",
  bookings: "Rezervări",
  quotes: "Oferte",
};

type AccessState = "loading" | "allowed" | "denied";

export default function ModulePlaceholder() {
  const params = useParams<{ moduleId: string }>();
  const router = useRouter();
  const moduleId = params.moduleId;
  const name = names[moduleId] ?? "Modul";
  const [access, setAccess] = useState<AccessState>("loading");

  useEffect(() => {
    const verifyAccess = async () => {
      const { data: authData, error: authError } = await orbyvenSupabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/platform/login");
        return;
      }

      const { data: membership, error: membershipError } = await orbyvenSupabase
        .from("organization_memberships")
        .select("organization_id")
        .eq("user_id", authData.user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError || !membership) {
        router.replace("/platform/onboarding");
        return;
      }

      const { data: assignment, error: assignmentError } = await orbyvenSupabase
        .from("organization_modules")
        .select("module_id")
        .eq("organization_id", membership.organization_id)
        .eq("module_id", moduleId)
        .eq("enabled", true)
        .maybeSingle();

      if (assignmentError || !assignment) {
        setAccess("denied");
        return;
      }

      setAccess("allowed");
    };

    verifyAccess();
  }, [moduleId, router]);

  if (access === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfbfd] text-sm text-[#6e6e73] dark:bg-black dark:text-[#a1a1a6]">
        Se verifică accesul la modul...
      </main>
    );
  }

  if (access === "denied") {
    return (
      <main className="min-h-screen bg-[#fbfbfd] px-6 py-10 text-[#1d1d1f] antialiased dark:bg-black dark:text-[#f5f5f7] md:px-10">
        <div className="mx-auto max-w-[900px]">
          <Link
            href="/platform"
            className="inline-flex h-10 items-center rounded-full border border-black/[0.1] px-4 text-sm font-medium dark:border-white/[0.14]"
          >
            ← Workspace
          </Link>
          <section className="mt-16 rounded-[34px] border border-black/[0.07] bg-white p-8 text-center dark:border-white/[0.1] dark:bg-[#111113] md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#86868b]">ORBYVEN · ACCES</p>
            <h1 className="mt-5 text-[42px] font-semibold leading-none tracking-[-0.05em] md:text-[58px]">Modul neactivat.</h1>
            <p className="mx-auto mt-6 max-w-xl text-[15px] leading-7 text-[#6e6e73] dark:text-[#a1a1a6]">
              Compania ta nu are momentan acces la acest modul. Modulele apar în workspace doar când sunt activate pentru organizația ta.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfbfd] px-6 py-10 text-[#1d1d1f] antialiased dark:bg-black dark:text-[#f5f5f7] md:px-10">
      <div className="mx-auto max-w-[1200px]">
        <Link
          href="/platform"
          className="inline-flex h-10 items-center rounded-full border border-black/[0.1] px-4 text-sm font-medium dark:border-white/[0.14]"
        >
          ← Workspace
        </Link>

        <section className="mt-16 rounded-[34px] border border-black/[0.07] bg-white p-8 md:p-12 dark:border-white/[0.1] dark:bg-[#111113]">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#86868b]">ORBYVEN · MODUL PORTABIL</p>
          <h1 className="mt-5 text-[48px] font-semibold leading-none tracking-[-0.055em] md:text-[68px]">{name}</h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[#6e6e73] dark:text-[#a1a1a6]">
            Accesul la modul a fost validat pentru compania ta. Implementarea funcțională poate fi montată aici fără să reconstruim autentificarea, organizația sau shell-ul ORBYVEN.
          </p>
        </section>
      </div>
    </main>
  );
}
