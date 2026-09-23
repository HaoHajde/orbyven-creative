"use client";

import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import { useEffect, useRef, useState } from "react";

type SearchHit = { module: "leads" | "tasks" | "estimates"; id: string; label: string; description: string };
type Props = {
  organizationId: string;
  enabledModules: OrbyvenModuleId[];
  onOpenModule: (id: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
};

export default function WorkspaceSearch({ organizationId, enabledModules, onOpenModule }: Props) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const searchModules = enabledModules.filter((id) => ["leads", "tasks", "estimates"].includes(id));
  const searchKey = searchModules.join("|");

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2 || !searchKey || !organizationId) return;
    const currentRequest = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        // Escaping LIKE wildcards avoids a search term becoming an arbitrary match.
        const pattern = "%" + needle.replace(/[\\%_]/g, "\\$&") + "%";
        const results = await Promise.all([
          searchModules.includes("leads")
            ? orbyvenSupabase.from("crm_leads").select("id,name,company")
                .eq("organization_id", organizationId).ilike("name", pattern).limit(5)
            : Promise.resolve(null),
          searchModules.includes("tasks")
            ? orbyvenSupabase.from("ops_tasks").select("id,title,status")
                .eq("organization_id", organizationId).ilike("title", pattern).limit(5)
            : Promise.resolve(null),
          searchModules.includes("estimates")
            ? orbyvenSupabase.from("sales_estimates").select("id,title,reference")
                .eq("organization_id", organizationId).ilike("title", pattern).limit(5)
            : Promise.resolve(null),
        ]);
        if (currentRequest !== requestId.current) return;
        for (const result of results) {
          if (result?.error) throw result.error;
        }
        const [leads, tasks, estimates] = results;
        setHits([
          ...(leads?.data ?? []).map((item) => ({ module: "leads" as const, id: item.id, label: item.name, description: item.company || "Client / cerere" })),
          ...(tasks?.data ?? []).map((item) => ({ module: "tasks" as const, id: item.id, label: item.title, description: "Lucrare · " + item.status })),
          ...(estimates?.data ?? []).map((item) => ({ module: "estimates" as const, id: item.id, label: item.title, description: "Ofertă · " + item.reference })),
        ]);
      } catch (reason) {
        if (currentRequest !== requestId.current) return;
        console.error(reason);
        setError("Căutarea nu este disponibilă acum.");
        setHits([]);
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    }, 280);
    return () => {
      ++requestId.current;
      window.clearTimeout(timer);
    };
    // searchKey is the stable set of visible, enabled searchable modules.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchKey, organizationId]);

  const choose = (hit: SearchHit) => {
    setOpen(false);
    setQuery("");
    setHits([]);
    onOpenModule(hit.module, { recordId: hit.id });
  };
  const validQuery = query.trim().length >= 2;

  return (
    <div ref={root} className="relative w-full max-w-[430px]">
      <label className="flex h-10 items-center gap-2.5 rounded-[11px] border border-[var(--border-strong)] bg-[var(--surface-2)]/75 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] focus-within:border-[var(--accent)]">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-[var(--muted)]"><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.4 4.4" /></svg>
        <span className="sr-only">Caută în firma ta</span>
        <input
          type="search"
          autoComplete="off"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); if (event.key === "Enter" && hits[0] && open) { event.preventDefault(); choose(hits[0]); } }}
          placeholder="Caută client, lucrare, ofertă..."
          className="w-full min-w-0 bg-transparent text-[12px] text-[var(--text)] outline-none placeholder:text-[var(--muted-2)]"
        />
        {loading && <span className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-[var(--accent)]/65" aria-label="Se caută" />}
        <span className="hidden rounded-md border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted-2)] sm:inline">⌕</span>
      </label>
      {open && validQuery && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[90] max-h-[340px] overflow-y-auto rounded-[15px] border border-[var(--border-strong)] bg-[var(--surface)] p-2 shadow-[0_22px_60px_rgba(0,0,0,0.35)]">
          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">Rezultate în firma ta</p>
          {error ? <p role="alert" className="px-2 py-3 text-xs text-red-400">{error}</p> : hits.length ? hits.map((hit) => (
            <button key={hit.module + hit.id} type="button" onClick={() => choose(hit)} className="flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left transition hover:bg-[var(--accent-soft)]">
              <span className="min-w-0"><span className="block truncate text-[12px] font-semibold">{hit.label}</span><span className="mt-0.5 block truncate text-[10px] text-[var(--muted)]">{hit.description}</span></span>
              <span className="text-xs text-[var(--accent)]" aria-hidden="true">↗</span>
            </button>
          )) : !loading ? <p className="px-2 py-3 text-xs text-[var(--muted)]">Nu am găsit rezultate.</p> : <p className="px-2 py-3 text-xs text-[var(--muted)]">Se caută...</p>}
          <p className="border-t border-[var(--border)] px-2 pt-2 text-[10px] leading-4 text-[var(--muted-2)]">Caută după nume sau titlu. Doar modulele active sunt incluse.</p>
        </div>
      )}
    </div>
  );
}
