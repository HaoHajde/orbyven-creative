"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect,useState } from "react";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { getCurrentWorkspace } from "@/lib/orbyven-workspace";

type ExitCase = {
  id:string;status:string;requested_at:string;action_note:string;
  package_sha256:string|null;package_generated_at:string|null;
  closure_reference:string|null;
};
async function authorization() {
  const {data}=await orbyvenSupabase.auth.getSession();
  if(!data.session?.access_token)throw new Error("Sesiunea a expirat.");
  return {Authorization:"Bearer "+data.session.access_token,"Content-Type":"application/json"};
}

export default function WorkspaceDataExportPage() {
  const router=useRouter();
  const [organizationId,setOrganizationId]=useState("");
  const [organizationName,setOrganizationName]=useState("");
  const [cases,setCases]=useState<ExitCase[]>([]);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    let cancelled=false;
    const run=async()=>{
      try{
        const workspace=await getCurrentWorkspace();
        if(!workspace){router.replace("/workspace/login");return;}
        if(workspace.membership.role!=="owner"){
          if(!cancelled){setError("Exportul integral este rezervat titularului organizației.");setLoading(false);}
          return;
        }
        if(!cancelled){
          setOrganizationId(workspace.organization.id);
          setOrganizationName(workspace.organization.name);
        }
        const response=await fetch("/api/workspace/data-export?organizationId="+
          encodeURIComponent(workspace.organization.id),{
          headers:await authorization(),cache:"no-store",
        });
        const data=await response.json() as {cases?:ExitCase[];error?:string};
        if(!response.ok)throw new Error(data.error||"Registrul de export nu poate fi citit.");
        if(!cancelled){setCases(data.cases??[]);setLoading(false);}
      }catch(e){if(!cancelled){setError(e instanceof Error?e.message:"Export indisponibil.");setLoading(false);}}
    };
    void run();return()=>{cancelled=true;};
  },[router]);

  const refresh=async()=>{
    const response=await fetch("/api/workspace/data-export?organizationId="+
      encodeURIComponent(organizationId),{headers:await authorization(),cache:"no-store"});
    const data=await response.json() as {cases?:ExitCase[];error?:string};
    if(!response.ok)throw new Error(data.error||"Starea nu poate fi încărcată.");
    setCases(data.cases??[]);
  };

  const requestExport=async()=>{
    setBusy(true);setError("");setNotice("");
    try{
      const response=await fetch("/api/workspace/data-export",{
        method:"POST",headers:await authorization(),cache:"no-store",
        body:JSON.stringify({organizationId,action:"request_export"}),
      });
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error||"Cererea nu a putut fi înregistrată.");
      await refresh();
      setNotice("Solicitarea este înregistrată. Echipa ORBYVEN va verifica și autoriza exportul.");
    }catch(e){setError(e instanceof Error?e.message:"Operația a eșuat.");}
    finally{setBusy(false);}
  };
  const download=async(item:ExitCase)=>{
    setBusy(true);setError("");setNotice("");
    try{
      const response=await fetch("/api/workspace/data-export?organizationId="+
        encodeURIComponent(organizationId)+"&caseId="+encodeURIComponent(item.id),{
          headers:await authorization(),cache:"no-store",
        });
      if(!response.ok){
        const result=await response.json() as {error?:string;reason?:string};
        throw new Error(result.reason||result.error||"Export indisponibil.");
      }
      const blob=await response.blob();
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");
      link.href=url;
      link.download="orbyven-export-"+organizationId+"-"+item.id+".json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      await refresh();
      setNotice("Pachetul a fost generat. Păstrează fișierul securizat și confirmă separat primirea completă.");
    }catch(e){setError(e instanceof Error?e.message:"Descărcare indisponibilă.");}
    finally{setBusy(false);}
  };
  const active=cases.find(c=>c.status!=="closed");
  return <main className="min-h-screen bg-white px-6 py-12 text-[#1d1d1f] md:px-10">
    <div className="mx-auto max-w-4xl">
      <Link href="/workspace" className="text-sm text-[#6e6e73] hover:underline">← Workspace</Link>
      <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#86868b]">ORBYVEN · datele organizației</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Predarea datelor.</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6e6e73]">
        {organizationName||"Organizația"} · poți solicita o arhivă JSON cu datele principale
        din workspace. Solicitarea nu anulează automat abonamentul și nu șterge datele.
        Echipa ORBYVEN verifică separat documentele, backupurile, Storage, sistemele externe și
        obligațiile de păstrare.
      </p>
      {error&&<p role="alert" className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</p>}
      {notice&&<p role="status" className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">{notice}</p>}
      {loading?<p className="mt-8 text-sm text-[#86868b]">Se încarcă…</p>:<>
        {!active&&organizationId&&<button type="button" disabled={busy}
          onClick={()=>void requestExport()}
          className="mt-9 rounded-full bg-[#1d1d1f] px-6 py-3 text-sm font-semibold text-white disabled:opacity-40">
          Solicită exportul datelor
        </button>}
        <div className="mt-9 space-y-4">
          {cases.map(c=><article key={c.id} className="rounded-[24px] border border-black/10 p-6">
            <div className="flex flex-wrap justify-between gap-4">
              <h2 className="text-lg font-semibold">Cerere · {new Date(c.requested_at).toLocaleDateString("ro-RO")}</h2>
              <span className="text-xs font-medium text-[#6e6e73]">{c.status}</span>
            </div>
            <p className="mt-3 text-sm text-[#6e6e73]">{c.action_note}</p>
            {(c.status==="authorized"||c.status==="package_generated")&&
              <button type="button" disabled={busy} onClick={()=>void download(c)}
                className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-3 text-sm text-white disabled:opacity-40">
                Descarcă arhiva JSON
              </button>}
            {c.package_sha256&&<p className="mt-4 break-all text-xs text-[#86868b]">
              Integritatea pachetului generat · SHA-256: {c.package_sha256}
            </p>}
            {c.closure_reference&&<p className="mt-3 text-xs text-[#86868b]">Referință de închidere: {c.closure_reference}</p>}
          </article>)}
          {cases.length===0&&<p className="text-sm text-[#86868b]">Nu ai cereri anterioare.</p>}
        </div>
      </>}
      <p className="mt-8 text-xs leading-6 text-[#86868b]">
        Arhiva nu include fișierele binare Storage, credențialele Auth, metodele de plată,
        backupurile ori sistemele externe; acestea necesită predare separată.
        Dacă datele se modifică după generarea arhivei, cere un nou export asistat.
      </p>
    </div>
  </main>;
}
