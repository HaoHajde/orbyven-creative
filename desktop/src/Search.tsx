import { useEffect, useRef, useState } from "react";
import { orbyvenSupabase } from "./client";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";

type SearchHit = {
  module: "leads" | "tasks" | "estimates" | "inventory";
  id: string;
  label: string;
  description: string;
};

type Props = {
  organizationId: string;
  enabledModules: OrbyvenModuleId[];
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
  onOpenCommands: () => void;
};

export default function DesktopSearch({
  organizationId,
  enabledModules,
  onOpenModule,
  onOpenCommands,
}: Props) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const searchModules = enabledModules.filter((id) =>
    ["leads", "tasks", "estimates", "inventory"].includes(id),
  );
  const searchKey = searchModules.join("|");

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const keys = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("pointerdown", close);
    window.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", keys);
    };
  }, []);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2 || !searchKey || !organizationId) return;
    const currentRequest = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
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
          searchModules.includes("inventory")
            ? orbyvenSupabase.from("ops_material_catalog").select("id,name,unit")
                .eq("organization_id", organizationId).eq("stock_tracked", true).ilike("name", pattern).limit(5)
            : Promise.resolve(null),
        ]);
        if (currentRequest !== requestId.current) return;
        for (const result of results) if (result?.error) throw result.error;
        const [leads, tasks, estimates, inventory] = results;
        setHits([
          ...(leads?.data ?? []).map((item) => ({
            module: "leads" as const,
            id: item.id,
            label: item.name,
            description: item.company || "Client / cerere",
          })),
          ...(tasks?.data ?? []).map((item) => ({
            module: "tasks" as const,
            id: item.id,
            label: item.title,
            description: "Lucrare · " + item.status,
          })),
          ...(estimates?.data ?? []).map((item) => ({
            module: "estimates" as const,
            id: item.id,
            label: item.title,
            description: "Ofertă · " + item.reference,
          })),
          ...(inventory?.data ?? []).map((item) => ({
            module: "inventory" as const,
            id: item.id,
            label: item.name,
            description: "Stoc · " + item.unit,
          })),
        ]);
      } catch (cause) {
        if (currentRequest !== requestId.current) return;
        console.error("Desktop search:", cause);
        setError("Căutarea nu este disponibilă acum.");
        setHits([]);
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query, searchKey, organizationId]);

  const choose = (hit: SearchHit) => {
    ++requestId.current;
    setOpen(false);
    setQuery("");
    setHits([]);
    onOpenModule(hit.module, { recordId: hit.id });
  };

  const visibleHits = hits.filter((hit) => searchModules.includes(hit.module));
  const validQuery = query.trim().length >= 2;

  return (
    <div className="desktop-search" ref={root}>
      <label className="desktop-search-box">
        <span className="search-icon">⌕</span>
        <input ref={input} type="search" autoComplete="off" value={query}
          onChange={(event) => {
            ++requestId.current;
            const next = event.target.value;
            setQuery(next);
            setOpen(true);
            setHits([]);
            setError("");
            setLoading(next.trim().length >= 2 && Boolean(searchKey));
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && visibleHits[0] && open && !loading) {
              event.preventDefault();
              choose(visibleHits[0]);
            }
          }}
          placeholder="Caută client, lucrare, ofertă, material..." />
        {loading && <span className="search-loading" aria-label="Se caută" />}
        <button type="button" className="search-command" title="Navigare module" onClick={(event) => {
          event.preventDefault();
          onOpenCommands();
        }}>Ctrl K</button>
      </label>

      {open && validQuery && (
        <div className="desktop-search-results">
          <p className="eyebrow">REZULTATE ÎN FIRMA TA</p>
          {error ? <p className="search-error">{error}</p> :
            visibleHits.length ? visibleHits.map((hit) => (
              <button key={hit.module + hit.id} className="search-hit" onClick={() => choose(hit)}>
                <span><strong>{hit.label}</strong><small>{hit.description}</small></span><b>↗</b>
              </button>
            )) : !loading ? <p className="search-empty">Nu am găsit rezultate.</p> :
              <p className="search-empty">Se caută...</p>}
          <small className="search-hint">Doar modulele active sunt incluse.</small>
        </div>
      )}
    </div>
  );
}
