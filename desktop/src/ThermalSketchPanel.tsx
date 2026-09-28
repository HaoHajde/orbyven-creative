import { useCallback, useEffect, useRef, useState } from "react";
import { orbyvenSupabase } from "./client";

const APP = "orbyven-thermal-v1";
type Sketch = {
  rooms: unknown[]; walls: unknown[]; openings: unknown[]; components: unknown[];
  routes: unknown[]; zones: unknown[]; settings: Record<string, unknown>; metadata: Record<string, unknown>;
};
type Stored = { plan: Sketch; revision: number };
type EventData = { app?: string; kind?: string; session?: string; state?: unknown };

function valid(value: unknown): value is Sketch {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  if (!["rooms","walls","openings","components","routes","zones"].every((k) => Array.isArray(p[k]) && (p[k] as unknown[]).length <= 1500)) return false;
  if (!p.settings || typeof p.settings !== "object" || Array.isArray(p.settings)) return false;
  if (!p.metadata || typeof p.metadata !== "object" || Array.isArray(p.metadata)) return false;
  try { return new TextEncoder().encode(JSON.stringify(value)).length <= 230000; } catch { return false; }
}

export default function ThermalSketchPanel({ organizationId, taskId, taskTitle, onClose }: {
  organizationId: string; taskId: string; taskTitle: string; onClose: () => void;
}) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [session] = useState(() => crypto.randomUUID());
  const revision = useRef(-1);
  const pending = useRef<Sketch | null>(null);
  const processing = useRef(false);
  const blocked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [record, setRecord] = useState<Stored | null | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"loading"|"ready"|"saving"|"saved"|"error">("loading");
  const [error, setError] = useState("");

  const flush = useCallback(async () => {
    if (processing.current || blocked.current) return;
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    processing.current = true;
    try {
      while (pending.current) {
        const next = pending.current; pending.current = null; setStatus("saving");
        if (revision.current < 0) {
          const result = await orbyvenSupabase.from("thermal_sketches")
            .insert({ organization_id: organizationId, task_id: taskId, plan: next, revision: 0 })
            .select("revision").single();
          if (result.error || !result.data) {
            if (result.error?.code === "23505") blocked.current = true;
            throw result.error ?? new Error("Schița nu a putut fi creată.");
          }
          revision.current = Number(result.data.revision);
        } else {
          const result = await orbyvenSupabase.from("thermal_sketches")
            .update({ plan: next, revision: revision.current + 1 })
            .eq("organization_id", organizationId).eq("task_id", taskId)
            .eq("revision", revision.current).select("revision").maybeSingle();
          if (result.error || !result.data) {
            if (!result.error) blocked.current = true;
            throw result.error ?? new Error("Schița a fost schimbată în altă sesiune.");
          }
          revision.current = Number(result.data.revision);
        }
        setStatus("saved");
      }
    } catch (reason) {
      console.error(reason); setError(reason instanceof Error ? reason.message : "Nu s-a putut salva schița."); setStatus("error");
    } finally { processing.current = false; }
  }, [organizationId, taskId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      setStatus("loading");
      const result = await orbyvenSupabase.from("thermal_sketches").select("plan,revision")
        .eq("organization_id", organizationId).eq("task_id", taskId).maybeSingle();
      if (!active) return;
      if (result.error) { setError("Planșa nu a putut fi încărcată."); setStatus("error"); setRecord(null); return; }
      if (result.data) { revision.current = Number(result.data.revision); setRecord(result.data as Stored); }
      else { revision.current = -1; setRecord(null); }
      setStatus("ready");
    })();
    return () => { active = false; };
  }, [organizationId, taskId]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<EventData>) => {
      if (event.source !== iframe.current?.contentWindow) return;
      const data = event.data;
      if (!data || data.app !== APP || data.session !== session) return;
      if (data.kind === "ready") {
        iframe.current?.contentWindow?.postMessage({ app: APP, kind: "load", session, state: record?.plan ?? null, title: taskTitle }, "*");
        return;
      }
      if (data.kind === "change" && valid(data.state)) {
        pending.current = data.state; setStatus("saving");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(), 800);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [record, flush, session, taskTitle]);

  useEffect(() => {
    if (ready && record !== undefined && iframe.current?.contentWindow) {
      iframe.current.contentWindow.postMessage({ app: APP, kind: "load", session, state: record?.plan ?? null, title: taskTitle }, "*");
    }
  }, [ready, record, session, taskTitle]);

  const close = async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    await flush();
    onClose();
  };

  return <div className="thermal-editor">
    <div className="thermal-editor-bar">
      <div><small>ORBYVEN · PLANȘĂ TERMICĂ / WEB PARITY</small><strong>{taskTitle}</strong></div>
      <div className="thermal-editor-actions"><span>{status === "saved" ? "✓ Salvată" : status === "saving" ? "Se salvează…" : status === "error" ? "Necesită atenție" : "Schiță orientativă"}</span>
        <button onClick={() => void close()}>Închide ✕</button></div>
    </div>
    {error && <div className="thermal-editor-error">{error}</div>}
    {record === undefined ? <div className="thermal-editor-loading">Se pregătește planșa…</div> :
      <iframe ref={iframe} title={"Editor Planșă Termică: " + taskTitle}
        src="/thermal-planner/index.html" sandbox="allow-scripts allow-downloads"
        onLoad={() => setReady(true)} />}
  </div>;
}
