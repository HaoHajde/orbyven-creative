"use client";

import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { getWorkspaceEntryPath } from "@/lib/orbyven-workspace";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WorkspaceAuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Se confirmă contul...");

  useEffect(() => {
    let cancelled = false;
    let routed = false;

    const routeSession = async () => {
      if (cancelled || routed) return;
      const { data } = await orbyvenSupabase.auth.getSession();
      if (!data.session) return;
      routed = true;
      const destination = await getWorkspaceEntryPath();
      if (!cancelled) {
        router.replace(destination === "/workspace/login" ? "/workspace/onboarding" : destination);
        router.refresh();
      }
    };

    void routeSession();
    const { data: listener } = orbyvenSupabase.auth.onAuthStateChange((_event, session) => {
      if (session) void routeSession();
    });

    const timeout = window.setTimeout(() => {
      if (!cancelled && !routed) {
        setMessage("Linkul nu mai este valid. Revino la autentificare și încearcă din nou.");
      }
    }, 5000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfbfd] px-6 text-center text-[#1d1d1f] dark:bg-[#09090a] dark:text-[#f5f5f7]">
      <div>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#4b46ee]/20 border-t-[#4b46ee]" />
        <p className="mt-5 text-sm text-[#6e6e73] dark:text-[#a1a1a6]">{message}</p>
      </div>
    </main>
  );
}
