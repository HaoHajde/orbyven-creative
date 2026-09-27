import { useEffect, useRef, useState } from "react";
import { orbyvenSupabase } from "./client";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

type SearchModule = "leads" | "tasks" | "estimates";
export type DesktopRecordHit = {
  module: SearchModule;
  id: string;
  label: string;
  description: string;
};
type StoredResults = { key: string; query: string; hits: DesktopRecordHit[]; error: boolean; loading: boolean };

/** Reuse web dashboard query boundaries inside the existing desktop Ctrl+K palette. */
export function useDesktopRecordSearch({
  organizationId, enabledModules, query, open,
}: {
  organizationId: string;
  enabledModules: OrbyvenModuleId[];
  query: string;
  open: boolean;
}) {
  const [result, setResult] = useState<StoredResults>({ key: "", query: "", hits: [], error: false, loading: false });
  const requestId = useRef(0);
  const searchKey = (["leads", "tasks", "estimates"] as const).filter((id) => enabledModules.includes(id)).join("|");
  const needle = query.trim();
  const matching = open && needle.length >= 2 && Boolean(organizationId) && Boolean(searchKey);
  const visible = matching && result.key === searchKey && result.query === needle;

  useEffect(() => {
    if (!open || needle.length < 2 || !organizationId || !searchKey) {
      ++requestId.current;
      return;
    }
    const current = ++requestId.current;
    const modules = searchKey.split("|");
    const timer = window.setTimeout(async () => {
      setResult({ key: searchKey, query: needle, hits: [], error: false, loading: true });
      try {
        // Escaping LIKE wildcards matches the website's safe search semantics.
        const pattern = "%" + needle.replace(/[\\%_]/g, "\\$&") + "%";
        const [leads, tasks, estimates] = await Promise.all([
          modules.includes("leads")
            ? orbyvenSupabase.from("crm_leads").select("id,name,company")
              .eq("organization_id", organizationId).ilike("name", pattern).limit(5)
            : Promise.resolve(null),
          modules.includes("tasks")
            ? orbyvenSupabase.from("ops_tasks").select("id,title,status")
              .eq("organization_id", organizationId).ilike("title", pattern).limit(5)
            : Promise.resolve(null),
          modules.includes("estimates")
            ? orbyvenSupabase.from("sales_estimates").select("id,title,reference")
              .eq("organization_id", organizationId).ilike("title", pattern).limit(5)
            : Promise.resolve(null),
        ]);
        if (current !== requestId.current) return;
        for (const response of [leads, tasks, estimates]) if (response?.error) throw response.error;
        setResult({
          key: searchKey, query: needle, loading: false, error: false,
          hits: [
            ...(leads?.data ?? []).map((row) => ({
              module: "leads" as const, id: row.id, label: row.name, description: row.company || "Client / cerere",
            })),
            ...(tasks?.data ?? []).map((row) => ({
              module: "tasks" as const, id: row.id, label: row.title, description: "Lucrare · " + row.status,
            })),
            ...(estimates?.data ?? []).map((row) => ({
              module: "estimates" as const, id: row.id, label: row.title, description: "Ofertă · " + row.reference,
            })),
          ],
        });
      } catch {
        if (current !== requestId.current) return;
        setResult({ key: searchKey, query: needle, hits: [], error: true, loading: false });
      }
    }, 280);
    return () => { ++requestId.current; window.clearTimeout(timer); };
  }, [needle, open, searchKey, organizationId]);

  return {
    hits: visible ? result.hits : [],
    loading: matching && (!visible || result.loading),
    error: visible && result.error,
  };
}
