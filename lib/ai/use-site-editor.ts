"use client";
import { useEffect,useState,type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_SITE,readSiteDraft,type EditableSite } from "@/lib/ai/site-editor";
import { getCurrentWorkspace,getWorkspaceEntryPath,type OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type { SiteEditorMessage } from "@/components/ai/SiteEditorChat";

export function useSiteEditor(){
  const router=useRouter();
  const [workspace,setWorkspace]=useState<OrbyvenWorkspace|null>(null);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [history,setHistory]=useState<EditableSite[]>([DEFAULT_SITE]);
  const [messages,setMessages]=useState<SiteEditorMessage[]>([{role:"assistant",text:"Bun venit! Spune-mi ce ai vrea să schimbi la titlu, descriere sau culori."}]);
  const [prompt,setPrompt]=useState("");
  const [busy,setBusy]=useState(false);
  const [view,setView]=useState<"desktop"|"mobile">("desktop");
  const site=history[history.length-1];
  const allowed=workspace?.membership.role==="owner"||workspace?.membership.role==="admin";

  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      try{
        const current=await getCurrentWorkspace();
        if(!current){router.replace(await getWorkspaceEntryPath());return;}
        if(cancelled)return;
        setWorkspace(current);
        if(current.membership.role!=="owner"&&current.membership.role!=="admin"){
          setError("Doar Owner sau Admin poate personaliza site-ul.");setReady(true);return;
        }
        let loaded:EditableSite|null=null;
        try{const saved=window.localStorage.getItem("orbyven-site-editor:"+current.organization.id+":"+current.user.id);loaded=saved?readSiteDraft(JSON.parse(saved)):null;}catch{/* corrupt local draft */}
        setHistory([loaded??{...DEFAULT_SITE,brand:current.organization.name.slice(0,70)||DEFAULT_SITE.brand}]);
        setReady(true);
      }catch{if(!cancelled){setError("Editorul nu a putut fi inițializat.");setReady(true);}}
    };
    void load();return()=>{cancelled=true;};
  },[router]);

  const save=()=>{
    if(!workspace||!allowed)return;
    try{window.localStorage.setItem("orbyven-site-editor:"+workspace.organization.id+":"+workspace.user.id,JSON.stringify(site));setNotice("Draft salvat pe acest dispozitiv. Site-ul public nu a fost modificat.");}
    catch{setError("Draftul nu a putut fi salvat pe acest dispozitiv.");}
  };
  const undo=()=>{setHistory(current=>current.length>1?current.slice(0,-1):current);setNotice("Am revenit la modificarea precedentă.");};
  const send=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(!workspace||!allowed||busy||prompt.trim().length<4)return;
    const requestText=prompt.trim();setPrompt("");setNotice("");setError("");
    setMessages(current=>[...current,{role:"user",text:requestText}]);setBusy(true);
    try{
      const {data}=await orbyvenSupabase.auth.getSession();
      if(!data.session?.access_token)throw Error("Sesiunea a expirat. Autentifică-te din nou.");
      const response=await fetch("/api/ai/site-editor",{method:"POST",cache:"no-store",headers:{Authorization:"Bearer "+data.session.access_token,"Content-Type":"application/json"},body:JSON.stringify({organizationId:workspace.organization.id,prompt:requestText,draft:site})});
      const result=await response.json() as {message?:string;draft?:EditableSite;error?:string};
      if(!response.ok||!result.draft)throw Error(result.error||"AI-ul este indisponibil.");
      const next=readSiteDraft(result.draft);
      if(!next)throw Error("Modificarea primită nu este validă.");
      if(JSON.stringify(next)!==JSON.stringify(site))setHistory(current=>[...current.slice(-14),next]);
      setMessages(current=>[...current,{role:"assistant",text:result.message||"Preview actualizat."}]);
    }catch(e){const message=e instanceof Error?e.message:"Nu am putut procesa cererea.";setError(message);setMessages(current=>[...current,{role:"assistant",text:message}]);}
    finally{setBusy(false);}
  };
  return {workspace,ready,allowed,error,notice,history,messages,prompt,setPrompt,busy,view,setView,site,save,undo,send};
}
