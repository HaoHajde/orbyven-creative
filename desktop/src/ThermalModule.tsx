import {useCallback,useEffect,useMemo,useState} from "react";
import ThermalSketchPanel from "@/components/modules/ThermalSketchPanel";
import {listWorkTaskClients,listWorkTasks,type WorkTask,type WorkTaskClient} from "@/lib/modules/tasks";
import {orbyvenSupabase} from "@/lib/orbyven-supabase";
import type {OrbyvenWorkspace} from "@/lib/orbyven-workspace";
import type {OrbyvenModuleId} from "@/lib/orbyven-modules";
import type {WorkspaceOpenOptions} from "@/lib/workspace-navigation";

type SketchMeta={task_id:string;revision:number;updated_at:string};
type Props={
  organizationId:string;
  locale:string;
  role:OrbyvenWorkspace["membership"]["role"];
  enabledModules:OrbyvenModuleId[];
  onOpenModule:(moduleId:OrbyvenModuleId,options?:WorkspaceOpenOptions)=>void;
  initialTaskId?:string;
};

function formatDate(value:string,locale:string){
  return new Intl.DateTimeFormat(locale,{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(value));
}

export default function ThermalPlannerModule({organizationId,locale,role,enabledModules,onOpenModule,initialTaskId}:Props){
  const [works,setWorks]=useState<WorkTask[]>([]);
  const [clients,setClients]=useState<WorkTaskClient[]>([]);
  const [sketches,setSketches]=useState<SketchMeta[]>([]);
  const [selectedTaskId,setSelectedTaskId]=useState<string|null>(initialTaskId??null);
  const [openTaskId,setOpenTaskId]=useState<string|null>(null);
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const canWrite=role!=="viewer";

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const [allTasks,nextClients,sketchResult]=await Promise.all([
        listWorkTasks(organizationId),
        listWorkTaskClients(organizationId),
        orbyvenSupabase.from("thermal_sketches")
          .select("task_id,revision,updated_at")
          .eq("organization_id",organizationId)
          .order("updated_at",{ascending:false}),
      ]);
      if(sketchResult.error)throw sketchResult.error;
      const nextWorks=allTasks.filter(task=>task.kind==="work");
      setWorks(nextWorks);
      setClients(nextClients);
      setSketches((sketchResult.data??[]) as SketchMeta[]);
      setSelectedTaskId(current=>current&&nextWorks.some(task=>task.id===current)?current:initialTaskId&&nextWorks.some(task=>task.id===initialTaskId)?initialTaskId:nextWorks[0]?.id??null);
    }catch(reason){
      console.error(reason);
      setError("Planșele termice nu au putut fi încărcate.");
    }finally{setLoading(false);}
  },[organizationId,initialTaskId]);

  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer);},[load]);

  const clientById=useMemo(()=>new Map(clients.map(client=>[client.id,client])),[clients]);
  const sketchByTask=useMemo(()=>new Map(sketches.map(sketch=>[sketch.task_id,sketch])),[sketches]);
  const filtered=useMemo(()=>{
    const q=query.trim().toLocaleLowerCase(locale);
    if(!q)return works;
    return works.filter(work=>{
      const client=work.client_id?clientById.get(work.client_id):null;
      return [work.title,work.location,client?.name,client?.company].filter(Boolean).join(" ").toLocaleLowerCase(locale).includes(q);
    });
  },[works,query,locale,clientById]);
  const selected=works.find(work=>work.id===selectedTaskId)??null;
  const openTask=works.find(work=>work.id===openTaskId)??null;
  const lastUpdated=sketches[0]?.updated_at??null;

  return <div className="pb-24 md:pb-8">
    <section className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">Specializat · Alpha 0.65</p>
        <h1 className="mt-2.5 text-[34px] font-semibold leading-[1.04] tracking-[-0.055em] sm:text-[42px]">Planșă Termică</h1>
        <p className="mt-2.5 max-w-2xl text-[13px] leading-5 text-[var(--muted)]">
          Schițe 2D pentru instalații termice, pereți, încăperi, radiatoare, tur/retur și estimări termice orientative.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {enabledModules.includes("tasks")&&<button type="button" onClick={()=>onOpenModule("tasks",{create:true})}
          className="h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">+ Lucrare nouă</button>}
        <button type="button" onClick={()=>void load()} className="h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">↻ Actualizează</button>
      </div>
    </section>

    <section className="mt-8 grid gap-3 sm:grid-cols-3">
      <Metric label="Lucrări disponibile" value={String(works.length)} note="context pentru planșe"/>
      <Metric label="Planșe salvate" value={String(sketches.length)} note="se păstrează chiar dacă ascunzi modulul"/>
      <Metric label="Ultima modificare" value={lastUpdated?formatDate(lastUpdated,locale):"—"} note="salvare automată"/>
    </section>

    {error&&<div role="alert" className="mt-4 rounded-[18px] border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400">{error}</div>}

    <section className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="rounded-[24px] border border-[var(--border)] bg-[color:var(--surface)]/72 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">Lucrări</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">Alege proiectul</h2></div>
          <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[10px] text-[var(--muted)]">{filtered.length}</span>
        </div>
        <input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Caută lucrare, client sau locație"
          className="mt-4 h-10 w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg)] px-3 text-xs outline-none focus:border-[var(--accent)]"/>
        <div className="mt-3 max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {loading&&<p role="status" className="py-8 text-center text-xs text-[var(--muted)]">Se încarcă lucrările…</p>}
          {!loading&&filtered.map(work=>{
            const client=work.client_id?clientById.get(work.client_id):null;
            const sketch=sketchByTask.get(work.id);
            const active=selectedTaskId===work.id;
            return <button key={work.id} type="button" onClick={()=>setSelectedTaskId(work.id)}
              className={"w-full rounded-[15px] border p-3 text-left transition "+(active?"border-[var(--accent)] bg-[var(--accent-soft)]":"border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-[12px] font-semibold">{work.title}</p>
                  <p className="mt-1 truncate text-[10px] text-[var(--muted)]">{client?.company||client?.name||work.location||"Fără client asociat"}</p></div>
                <span className={"shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold "+(sketch?"bg-emerald-400/10 text-emerald-300":"bg-[var(--bg)] text-[var(--muted)]")}>{sketch?"Salvată":"Nouă"}</span>
              </div>
              {sketch&&<p className="mt-2 text-[9px] text-[var(--muted-2)]">rev. {sketch.revision} · {formatDate(sketch.updated_at,locale)}</p>}
            </button>;
          })}
          {!loading&&!filtered.length&&<div className="rounded-[14px] border border-dashed border-[var(--border-strong)] p-5 text-center">
            <p className="text-xs font-semibold">Nu există lucrări disponibile.</p>
            <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">Planșa rămâne modul separat, dar fiecare schiță este legată de o lucrare pentru context și istoric.</p>
          </div>}
        </div>
      </article>

      <article className="rounded-[24px] border border-[var(--border)] bg-[color:var(--surface)]/72 p-5 sm:p-6">
        {!selected?<div className="flex min-h-[320px] flex-col items-center justify-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-[18px] border border-[var(--border)] bg-[var(--surface-2)] text-xl">⌗</div>
          <h2 className="mt-4 text-lg font-semibold">Selectează o lucrare</h2>
          <p className="mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">Modulul nu creează planșe fără context. Lucrarea păstrează legătura cu clientul, devizul și istoricul.</p>
        </div>:<SelectedWork work={selected} client={selected.client_id?clientById.get(selected.client_id):undefined}
          sketch={sketchByTask.get(selected.id)} locale={locale} canWrite={canWrite}
          onOpen={()=>setOpenTaskId(selected.id)}/>}
      </article>
    </section>

    <div className="mt-4 rounded-[16px] border border-amber-400/20 bg-amber-400/[0.05] px-4 py-3 text-[11px] leading-5 text-amber-100/85">
      Calculele termice sunt orientative. Planșa nu reprezintă proiect tehnic, dimensionare autorizată sau certificat energetic.
    </div>

    {openTask&&canWrite&&<ThermalSketchPanel key={openTask.id} organizationId={organizationId} taskId={openTask.id}
      taskTitle={openTask.title} onClose={()=>{setOpenTaskId(null);void load();}}/>}
  </div>;
}

function SelectedWork({work,client,sketch,locale,canWrite,onOpen}:{work:WorkTask;client?:WorkTaskClient;sketch?:SketchMeta;locale:string;canWrite:boolean;onOpen:()=>void}){
  return <>
    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">Planșă selectată</p>
    <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.045em]">{work.title}</h2>
    <p className="mt-2 text-xs text-[var(--muted)]">{client?.company||client?.name||"Fără client asociat"}{work.location?" · "+work.location:""}</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <Info label="Status lucrare" value={work.status==="done"?"Finalizată":work.status==="in_progress"?"În lucru":work.status==="blocked"?"Blocată":work.status==="cancelled"?"Anulată":"Planificată"}/>
      <Info label="Planșă" value={sketch?("Salvată · rev. "+sketch.revision):"Nu a fost creată"}/>
      <Info label="Ultima salvare" value={sketch?formatDate(sketch.updated_at,locale):"—"}/>
      <Info label="Mod de lucru" value="Autosave + versiune protejată"/>
    </div>
    <div className="mt-7 rounded-[18px] border border-[var(--border)] bg-[var(--surface-2)]/70 p-4">
      <p className="text-xs font-semibold">Editor smart Alpha 0.65</p>
      <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">Pereți exteriori/interiori, camere, uși și ferestre cu snap, radiatoare și echipamente pe perete, trasee tur/retur cu checkpointuri și ramificații în T.</p>
      <button type="button" disabled={!canWrite} onClick={onOpen}
        className="mt-4 h-10 rounded-full bg-[var(--button)] px-5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">
        {sketch?"Deschide planșa →":"Creează planșa →"}
      </button>
      {!canWrite&&<p className="mt-2 text-[10px] text-[var(--muted-2)]">Rolul Viewer poate vedea modulul, dar editarea planșei este dezactivată.</p>}
    </div>
  </>;
}
function Metric({label,value,note}:{label:string;value:string;note:string}){return <article className="rounded-[18px] border border-[var(--border)] bg-[color:var(--surface)]/70 p-4"><p className="text-[10px] text-[var(--muted)]">{label}</p><p className="mt-2 text-[22px] font-semibold tracking-[-0.04em]">{value}</p><p className="mt-1 text-[10px] text-[var(--muted-2)]">{note}</p></article>}
function Info({label,value}:{label:string;value:string}){return <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)]/55 p-3"><p className="text-[9px] uppercase tracking-[0.12em] text-[var(--muted-2)]">{label}</p><p className="mt-1 text-xs font-semibold">{value}</p></div>}
