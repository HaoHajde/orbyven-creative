"use client";

import { useEffect, useState } from "react";

import AiWebDesignEntry from "@/components/AiWebDesignEntry";
import WebDesignStudio from "@/components/ai/WebDesignStudio";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";

type Mode = "checking" | "public" | "studio";

export default function AiWebDesignRouter() {
  const [mode, setMode] = useState<Mode>("checking");

  useEffect(() => {
    let active = true;

    void orbyvenSupabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setMode(data.session ? "studio" : "public");
      })
      .catch((error) => {
        console.warn("ORBYVEN AI Design session check unavailable", error);
        if (active) setMode("public");
      });

    return () => {
      active = false;
    };
  }, []);

  if (mode === "studio") return <WebDesignStudio />;
  if (mode === "public") return <AiWebDesignEntry />;

  return (
    <main className="grid min-h-screen place-items-center bg-[#07080d] text-white">
      <p className="text-[11px] text-white/45">Se deschide AI Design…</p>
    </main>
  );
}
