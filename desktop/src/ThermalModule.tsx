import { useCallback, useEffect, useMemo, useState } from "react";
import { listWorkTaskClients, listWorkTasks, type WorkTask, type WorkTaskClient } from "@/lib/modules/tasks";
import { orbyvenSupabase } from "./client";
import ThermalSketchPanel from "./ThermalSketchPanel";

type SketchMeta = { task_id: string; revision: number; updated_at: string };

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function ThermalModule({ organizationId, locale, canWrite, onOpenTasks }: {
  organizationId: string; locale: string; canWrite: boolean; onOpenTasks: () => void;
}) {
  const [works, setWorks] = useState<WorkTask[]>([]);
  const [clients, setClients] = useState<WorkTaskClient[]>([]);
  const [sketches, setSketches] = useState<SketchMeta[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [tasks, nextClients, sketchResult] = await Promise.all([
        listWorkTasks(organizationId),
        listWorkTaskClients(organizationId),
        orbyvenSupabase.from("thermal_sketches")
          .select("task_id,revision,updated_at")
          .eq("organization_id", organizationId)
          .order("updated_at", { ascending: false }),
      ]);
      if (sketchResult.error) throw sketchResult.error;
      const nextWorks = tasks.filter((task) => task.kind === "work");
      setWorks(nextWorks);
      setClients(nextClients);
      setSketches((sketchResult.data ?? []) as SketchMeta[]);
      setSelectedTaskId((current) => current && nextWorks.some((task) => task.id === current) ? current : nextWorks[0]?.id ?? null);
    } catch (reason) {
      console.error(reason); setError("Planșele termice nu au putut fi încărcate.");
    } finally { setLoading(false); }
  }, [organizationId]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const clientById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const sketchByTask = useMemo(() => new Map(sketches.map((sketch) => [sketch.task_id, sketch])), [sketches]);
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(locale);
    if (!q) return works;
    return works.filter((work) => {
      const client = work.client_id ? clientById.get(work.client_id) : null;
      return [work.title, work.location, client?.name, client?.company].filter(Boolean).join(" ").toLocaleLowerCase(locale).includes(q);
    });
  }, [works, query, locale, clientById]);
  const selected = works.find((work) => work.id === selectedTaskId) ?? null;
  const openTask = works.find((work) => work.id === openTaskId) ?? null;
  const lastUpdated = sketches[0]?.updated_at ?? null;

  return <div className="thermal-module">
    <section className="thermal-heading">
      <div><p className="eyebrow">SPECIALIZAT · LIVE</p><h2>Planșă Termică</h2>
        <p>Schițe 2D pentru instalații termice, pereți, încăperi, radiatoare, tur/retur și estimări orientative.</p></div>
      <div><button className="secondary" onClick={onOpenTasks}>+ Lucrare nouă</button><button className="secondary" onClick={() => void load()}>↻ Actualizează</button></div>
    </section>

    <section className="thermal-metrics">
      <article><small>Lucrări disponibile</small><strong>{works.length}</strong><span>context pentru planșe</span></article>
      <article><small>Planșe salvate</small><strong>{sketches.length}</strong><span>persistă în ORBYVEN</span></article>
      <article><small>Ultima modificare</small><strong className="thermal-date">{lastUpdated ? formatDate(lastUpdated, locale) : "—"}</strong><span>salvare automată</span></article>
    </section>

    {error && <div className="error-banner">{error}</div>}
    <section className="thermal-grid">
      <article className="surface thermal-list">
        <div className="panel-heading"><div><span className="eyebrow">LUCRĂRI</span><h3>Alege proiectul</h3></div><small>{filtered.length}</small></div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Caută lucrare, client sau locație" />
        <div className="thermal-records">
          {loading && <p className="muted">Se încarcă lucrările…</p>}
          {!loading && filtered.map((work) => {
            const client = work.client_id ? clientById.get(work.client_id) : null;
            const sketch = sketchByTask.get(work.id);
            return <button key={work.id} className={"thermal-record " + (selectedTaskId === work.id ? "active" : "")}
              onClick={() => setSelectedTaskId(work.id)}>
              <span><strong>{work.title}</strong><small>{client?.company || client?.name || work.location || "Fără client asociat"}</small></span>
              <span className={sketch ? "thermal-saved" : "thermal-new"}>{sketch ? "Salvată" : "Nouă"}</span>
              {sketch && <em>rev. {sketch.revision} · {formatDate(sketch.updated_at, locale)}</em>}
            </button>;
          })}
          {!loading && !filtered.length && <div className="empty"><strong>Nu există lucrări disponibile.</strong><p>Creează o lucrare și revino aici.</p></div>}
        </div>
      </article>

      <article className="surface thermal-selected">
        {!selected ? <div className="empty"><strong>Selectează o lucrare</strong><p>Fiecare planșă este legată de o lucrare reală.</p></div> : <>
          <p className="eyebrow">PLANȘĂ SELECTATĂ</p><h2>{selected.title}</h2>
          <p className="muted">{selected.client_id ? (clientById.get(selected.client_id)?.company || clientById.get(selected.client_id)?.name) : "Fără client asociat"}{selected.location ? " · " + selected.location : ""}</p>
          <div className="thermal-info">
            <div><small>Status lucrare</small><strong>{selected.status}</strong></div>
            <div><small>Planșă</small><strong>{sketchByTask.has(selected.id) ? "Salvată · rev. " + sketchByTask.get(selected.id)?.revision : "Nu a fost creată"}</strong></div>
            <div><small>Mod de lucru</small><strong>Autosave + protecție versiune</strong></div>
            <div><small>Editor</small><strong>Sincronizat cu ORBYVEN live</strong></div>
          </div>
          <div className="thermal-editor-card"><strong>Editor smart</strong>
            <p>Pereți exteriori/interiori, camere, uși și ferestre, radiatoare și echipamente, trasee tur/retur, checkpoint-uri și ramificații.</p>
            <button className="primary" disabled={!canWrite} onClick={() => setOpenTaskId(selected.id)}>{sketchByTask.has(selected.id) ? "Deschide planșa →" : "Creează planșa →"}</button>
          </div>
        </>}
      </article>
    </section>
    <div className="thermal-note">Calculele termice sunt orientative. Planșa nu reprezintă proiect tehnic sau dimensionare autorizată.</div>
    {openTask && canWrite && <ThermalSketchPanel organizationId={organizationId} taskId={openTask.id} taskTitle={openTask.title}
      onClose={() => { setOpenTaskId(null); void load(); }} />}
  </div>;
}
