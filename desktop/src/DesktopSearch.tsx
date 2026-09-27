import { useEffect, useRef, useState } from "react";
import { orbyvenSupabase } from "./client";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

type SearchModule = "leads" | "tasks" | "estimates";
type Hit = { id: string; module: SearchModule; label: string; description: string };
type Props = {
  organizationId: string;
  enabledModules: OrbyvenModuleId[];
  onOpen: (module: SearchModule, recordId: string) => void;
};

/** The desktop search mirrors the real web workspace search and keeps all reads RLS-scoped. */
export default function DesktopSearch({ organizationId, enabledModules, onOpen }: Props) {
  const [value, setValue] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const generation = useRef(0);
  const container = useRef<HTMLDivElement>(null);
  const searchable = (["leads", "tasks", "estimates"] as const).filter((id) => enabledModules.includes(id));
  const searchKey = searchable.join("|");

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  useEffect(() => {
    const needle = value.trim();
    if (needle.length < 2 || !searchKey) return;
    const request = ++generation.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const pattern = "%" + needle.replace(/[\\%_]/g, "\\$&") + "%";
        const [leads, tasks, estimates] = await Promise.all([
          searchable.includes("leads") ? orbyvenSupabase.from("crm_leads").select("id,name,company").eq("organization_id", organizationId).ilike("name", pattern).limit(5) : Promise.resolve(null),
          searchable.includes("tasks") ? orbyvenSupabase.from("ops_tasks").select("id,title,status").eq("organization_id", organizationId).ilike("title", pattern).limit(5) : Promise.resolve(null),
          searchable.includes("estimates") ? orbyvenSupabase.from("sales_estimates").select("id,title,reference").eq("organization_id", organizationId).ilike("title", pattern).limit(5) : Promise.resolve(null),
        ]);
        if (request !== generation.current) return;
        for (const response of [leads, tasks, estimates]) if (response?.error) throw response.error;
        setHits([
          ...(leads?.data ?? []).map((item) => ({ id: item.id, module: "leads" as const, label: item.name, description: item.company || "Client / cerere" })),
          ...(tasks?.data ?? []).map((item) => ({ id: item.id, module: "tasks" as const, label: item.title, description: "Lucrare · " + item.status })),
          ...(estimates?.data ?? []).map((item) => ({ id: item.id, module: "estimates" as const, label: item.title, description: "Ofertă · " + item.reference })),
        ]);
      } catch {
        if (request !== generation.current) return;
        setError(true);
        setHits([]);
      } finally {
        if (request === generation.current) setLoading(false);
      }
    }, 280);
    return () => { ++generation.current; window.clearTimeout(timer); };
    // searchKey encodes the current searchable permissions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, searchKey, organizationId]);

  const visibleHits = hits.filter((hit) => searchable.includes(hit.module));
  const choose = (hit: Hit) => {
    ++generation.current;
    setOpen(false);
    setHits([]);
    setValue("");
    onOpen(hit.module, hit.id);
  };

  return (
    <div className="desktop-global-search" ref={container}>
      <label className="desktop-search-input">
        <span aria-hidden="true" className="desktop-search-icon">⌕</span>
        <span className="sr-only">Caută în firma ta</span>
        <input
          type="search" value={value} autoComplete="off"
          placeholder="Caută client, lucrare, ofertă..."
          onChange={(event) => {
            ++generation.current;
            const next = event.target.value;
            setValue(next);
            setOpen(true);
            setHits([]);
            setError(false);
            setLoading(next.trim().length >= 2 && Boolean(searchKey));
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && open && !loading && visibleHits[0]) {
              event.preventDefault();
              choose(visibleHits[0]);
            }
          }}
        />
        {loading && <span className="online-dot" aria-label="Se caută" />}
      </label>
      {open && value.trim().length >= 2 && (
        <div className="desktop-search-results" role="listbox" aria-label="Rezultate în firma ta">
          <p>REZULTATE ÎN FIRMA TA</p>
          {error ? <small role="alert">Căutarea nu este disponibilă acum.</small>
            : visibleHits.length ? visibleHits.map((hit) => (
              <button type="button" key={hit.module + hit.id} onClick={() => choose(hit)} role="option" aria-selected={false}>
                <span><strong>{hit.label}</strong><small>{hit.description}</small></span><span>↗</span>
              </button>
            )) : <small>{loading ? "Se caută..." : "Nu am găsit rezultate."}</small>}
        </div>
      )}
    </div>
  );
}
