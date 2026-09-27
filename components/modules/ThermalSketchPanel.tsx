"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {orbyvenSupabase} from "@/lib/orbyven-supabase";

const APP="orbyven-thermal-v1";
type Sketch={
  rooms:unknown[];walls:unknown[];openings:unknown[];components:unknown[];
  routes:unknown[];zones:unknown[];settings:Record<string,unknown>;
  metadata:Record<string,unknown>;
};
type EventData={app?:string;kind?:string;session?:string;state?:unknown};
type Stored={plan:Sketch;revision:number};
const valid=(s:unknown):s is Sketch=>{
  if(!s||typeof s!=="object"||Array.isArray(s))return false;
  const p=s as Record<string,unknown>;
  if(!["rooms","walls","openings","components","routes","zones"].every(k=>Array.isArray(p[k])&&(p[k] as unknown[]).length<=1500))return false;
  if(!p.settings||typeof p.settings!=="object"||Array.isArray(p.settings)||!p.metadata||typeof p.metadata!=="object"||Array.isArray(p.metadata))return false;
  try{return new TextEncoder().encode(JSON.stringify(s)).length<=230000;}catch{return false;}
};
export default function ThermalSketchPanel({organizationId,taskId,taskTitle,onClose}:{
  organizationId:string;taskId:string;taskTitle:string;onClose:()=>void;
}){
  const iframe=useRef<HTMLIFrameElement>(null);
  const session=useRef<string>("");
  if(!session.current)session.current=crypto.randomUUID();
  const revision=useRef(-1);
  const current=useRef<Sketch|null>(null);
  const pending=useRef<Sketch|null>(null);
  const processing=useRef(false);
  const blocked=useRef(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [record,setRecord]=useState<Stored|null|undefined>(undefined);
  const [ready,setReady]=useState(false);
  const [status,setStatus]=useState<"loading"|"ready"|"saving"|"saved"|"error">("loading");
  const [error,setError]=useState("");

  const flush=useCallback(async()=>{
    if(processing.current||blocked.current)return;
    if(timer.current){clearTimeout(timer.current);timer.current=null;}
    processing.current=true;
    try{
      while(pending.current){
        const next=pending.current;
        pending.current=null;
        setStatus("saving");
        if(revision.current<0){
          const {data,error:insertError}=await orbyvenSupabase.from("thermal_sketches")
            .insert({organization_id:organizationId,task_id:taskId,plan:next,revision:0})
            .select("revision").single();
          if(insertError||!data){
            if(insertError?.code==="23505")blocked.current=true;
            throw insertError??new Error("Schița nu a putut fi creată.");
          }
          revision.current=Number(data.revision);
        }else{
          const {data,error:updateError}=await orbyvenSupabase.from("thermal_sketches")
            .update({plan:next,revision:revision.current+1})
            .eq("organization_id",organizationId).eq("task_id",taskId)
            .eq("revision",revision.current).select("revision").maybeSingle();
          if(updateError||!data){
            if(!updateError)blocked.current=true;
            throw updateError??new Error("Schița a fost schimbată de altă sesiune. Exportă versiunea curentă înainte de a reîncărca pagina.");
          }
          revision.current=Number(data.revision);
        }
        setStatus("saved");
      }
    }catch(reason){
      console.error(reason);
      setError(reason instanceof Error?reason.message:"Nu s-a putut salva schița.");
      setStatus("error");
      // Never silently discard the latest unsaved changes on network failure.
      if(!pending.current)pending.current=current.current;
    }finally{processing.current=false;}
  },[organizationId,taskId]);

  useEffect(()=>{
    let active=true;
    async function load(){
      setStatus("loading");setRecord(undefined);setReady(false);
      revision.current=-1;current.current=null;pending.current=null;blocked.current=false;
      try{
        const {data,error:queryError}=await orbyvenSupabase.from("thermal_sketches")
          .select("plan,revision").eq("organization_id",organizationId)
          .eq("task_id",taskId).maybeSingle();
        if(queryError)throw queryError;
        if(!active)return;
        if(data&& !valid(data.plan))throw new Error("Schița stocată are un format incompatibil. Nu o suprascriem.");
        revision.current=data?Number(data.revision):-1;
        setRecord(data?{plan:data.plan as Sketch,revision:revision.current}:null);
        setStatus("ready");
      }catch(reason){
        if(!active)return;
        setError(reason instanceof Error?reason.message:"Schița nu poate fi încărcată.");
        setStatus("error");
      }
    }
    void load();
    return()=>{active=false;if(timer.current)clearTimeout(timer.current);void flush();};
  },[organizationId,taskId,flush]);

  useEffect(()=>{
    function onMessage(event:MessageEvent<EventData>){
      if(event.source!==iframe.current?.contentWindow||event.origin!=="null")return;
      const data=event.data;
      if(!data||data.app!==APP)return;
      if(data.kind==="ready"){setReady(true);return;}
      if(data.session!==session.current||record===undefined)return;
      if(data.kind==="save"){
        if(!valid(data.state)){setError("Schița este prea mare sau are date invalide. Exportă schița și simplifică planșa.");setStatus("error");return;}
        if(blocked.current){setError("Versiune modificată în altă sesiune. Nu suprascriem datele existente.");setStatus("error");return;}
        current.current=data.state;
        pending.current=data.state;
        setStatus("saving");
        if(timer.current)clearTimeout(timer.current);
        timer.current=setTimeout(()=>void flush(),800);
      }
    }
    window.addEventListener("message",onMessage);
    return()=>window.removeEventListener("message",onMessage);
  },[record,flush]);

  useEffect(()=>{
    if(!ready||record===undefined||!iframe.current?.contentWindow)return;
    iframe.current.contentWindow.postMessage({
      app:APP,kind:"load",session:session.current,state:record?.plan??null,
      title:taskTitle,
    },"*");
  },[ready,record,taskTitle]);

  const close=async()=>{
    if(timer.current){clearTimeout(timer.current);timer.current=null;}
    await flush();
    if(pending.current||processing.current){
      if(!window.confirm("Schița are modificări nesalvate. O poți exporta din planșă înainte să închizi. Închizi oricum?"))return;
    }
    onClose();
  };

  return <div role="dialog" aria-modal="true" aria-label={"Planșă termică · "+taskTitle}
    className="fixed inset-0 z-[100] flex min-h-0 flex-col bg-[#070b16] text-[#eef4ff]">
    <div className="flex min-h-[54px] flex-wrap items-center justify-between gap-2 border-b border-white/15 bg-[#0b1527] px-4 py-2">
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#91afff]">ORBYVEN · LUCRĂRI / ALPHA 0.65</p>
        <h2 className="truncate text-sm font-semibold">{taskTitle} · Planșă termică</h2></div>
      <div className="flex items-center gap-2">
        <span role="status" className="text-[11px] text-[#aab8d2]">{status==="saved"?"✓ Salvată":status==="saving"?"Se salvează…":status==="loading"?"Se încarcă…":status==="error"?"Salvare necesită atenție":"Schiță orientativă"}</span>
        {status==="error"&&pending.current&&<button type="button" onClick={()=>{blocked.current=false;void flush();}} className="rounded-lg border border-white/30 px-3 py-2 text-xs">Reîncearcă salvarea</button>}
        <button type="button" onClick={()=>void close()} className="rounded-lg border border-[#8da9ec]/50 bg-[#1c2f51] px-4 py-2 text-xs font-semibold">Închide ✕</button>
      </div>
    </div>
    {error&&<div role="alert" className="border-b border-rose-400/30 bg-rose-400/10 px-4 py-2 text-xs text-rose-200">{error}</div>}
    {record===undefined?<div className="flex flex-1 items-center justify-center text-sm text-[#aab8d2]">
      {status==="error"?"Schița nu poate fi deschisă în siguranță.": "Se pregătește planșa lucrării…"}
    </div>:<iframe ref={iframe} title={"Editor Planșă Termică: "+taskTitle}
      src="/thermal-planner/index.html" sandbox="allow-scripts allow-downloads"
      onLoad={()=>setReady(true)} className="min-h-0 w-full flex-1 border-0" />}
  </div>;
}
