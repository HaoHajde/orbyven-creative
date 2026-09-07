"use client";

import WorkspaceAuthShell from "@/components/WorkspaceAuthShell";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { getWorkspaceAccessState } from "@/lib/orbyven-workspace";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STATE_COPY = {
  member_suspended: {
    title: "Accesul contului este suspendat.",
    description: "Contul tău este asociat companiei, dar accesul la workspace este momentan dezactivat. Contactează administratorul companiei sau ORBYVEN.",
  },
  organization_provisioning: {
    title: "Workspace-ul este în configurare.",
    description: "Compania ta este creată, iar ORBYVEN finalizează configurarea înainte să îți deschidă accesul.",
  },
  organization_suspended: {
    title: "Workspace-ul companiei este suspendat.",
    description: "Accesul la această organizație este momentan oprit la nivel de platformă. Contactează ORBYVEN pentru detalii.",
  },
  organization_archived: {
    title: "Workspace-ul a fost arhivat.",
    description: "Organizația este păstrată în ORBYVEN, dar nu mai acceptă acces în workspace.",
  },
} as const;

export default function WorkspaceAccessPage() {
  const router = useRouter();
  const [state, setState] = useState<keyof typeof STATE_COPY | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const nextState = await getWorkspaceAccessState();
      if (cancelled) return;
      if (nextState === "login") {
        router.replace("/workspace/login");
        return;
      }
      if (nextState === "workspace") {
        router.replace("/workspace");
        return;
      }
      if (nextState === "onboarding") {
        router.replace("/workspace/onboarding");
        return;
      }
      setState(nextState);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const copy = state ? STATE_COPY[state] : null;

  const logout = async () => {
    await orbyvenSupabase.auth.signOut();
    router.replace("/workspace/login");
  };

  return (
    <WorkspaceAuthShell
      eyebrow="ORBYVEN · ACCESS"
      title={copy?.title ?? "Se verifică accesul..."}
      description={copy?.description ?? "Verificăm starea workspace-ului tău."}
    >
      <div className="text-center">
        <div className="rounded-[18px] bg-[#f5f5f7] px-4 py-4 text-sm leading-6 text-[#6e6e73] dark:bg-black dark:text-[#a1a1a6]">
          Datele companiei rămân izolate și nu sunt afișate cât timp accesul este suspendat.
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 h-11 rounded-full border border-black/[0.1] px-5 text-xs font-semibold dark:border-white/[0.12]"
        >
          Ieșire din cont
        </button>
      </div>
    </WorkspaceAuthShell>
  );
}
