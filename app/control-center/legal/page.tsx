"use client";

import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type Organization = { id: string; name: string; legal_name: string | null };
type Contract = {
  id:string;document_type:string;title:string;document_version:string;
  sha256:string;evidence_reference:string;evidence_status:string;recorded_at:string;
  merchant_legal_name:string|null;
};
type Acceptance = {
  id:string;document_type:string;document_version:string;accepted_from:string;
  accepted_at:string;merchant_legal_name:string|null;
};
type Subscription = {id:string;plan_id:string;status:string;merchant_legal_name:string|null};
type PrivacyCase = {
  id:string;organization_id:string|null;subject_reference:string;request_type:string;
  processing_role:string;status:string;received_at:string;due_at:string;last_action:string|null;
};
type Payload = {
  organizations:Organization[];contracts:Contract[];checkouts:Acceptance[];
  subscriptions:Subscription[];privacyCases:PrivacyCase[];
};
const EMPTY:Payload = {organizations:[],contracts:[],checkouts:[],subscriptions:[],privacyCases:[]};
const INPUT = "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-indigo-400";
const BUTTON = "rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium hover:border-indigo-400 disabled:opacity-50";
const statuses = ["received","identity_check","triage","in_progress","responded","closed"] as const;
const nextStatus:Record<string,string[]> = {
  received:["identity_check","triage"],identity_check:["triage"],triage:["in_progress"],
  in_progress:["responded"],responded:["closed"],closed:[],
};
const kindLabels:Record<string,string> = {
  access:"Acces",rectification:"Rectificare",erasure:"Ștergere",
  portability:"Portabilitate",restriction:"Restricționare",objection:"Opoziție",other:"Alta",
};
function date(value:string) {
  return new Intl.DateTimeFormat("ro-RO",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
}

export default function LegalOperationsPage() {
  const router=useRouter();
  const [organizationId,setOrganizationId]=useState("");
  const [payload,setPayload]=useState<Payload>(EMPTY);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [contract,setContract]=useState({
    documentType:"contract",title:"",documentVersion:"",sha256:"",evidenceReference:"",
  });
  const [privacy,setPrivacy]=useState({
    subjectReference:"",requestType:"access",processingRole:"undetermined",channel:"email",
  });
  const [caseNotes,setCaseNotes]=useState<Record<string,string>>({});
  const [caseStates,setCaseStates]=useState<Record<string,string>>({});

  const headers=useCallback(async()=>{
    const {data}=await orbyvenSupabase.auth.getSession();
    if (!data.session) throw new Error("Sesiunea a expirat. Autentifică-te în Control Center.");
    return {Authorization:"Bearer "+data.session.access_token,"Content-Type":"application/json"};
  },[]);

  const load=useCallback(async(id:string)=>{
    setLoading(true);setError("");
    try {
      const response=await fetch("/api/control-center/compliance"+
        (id?"?organizationId="+encodeURIComponent(id):""),{
        headers:await headers(),cache:"no-store",
      });
      if(response.status===401){router.replace("/control-center/login");return;}
      const data=await response.json() as Payload & {error?:string};
      if(!response.ok)throw new Error(data.error==="compliance_migration_required"
        ?"Migrarea Legal & Trust nu este aplicată în baza de date."
        :"Acces indisponibil ("+(data.error||response.status)+").");
      setPayload(data);
    }catch(e){setError(e instanceof Error?e.message:"Registru indisponibil.");}
    finally{setLoading(false);}
  },[headers,router]);
  useEffect(()=>{void load(organizationId);},[load,organizationId]);

  async function post(body:Record<string,unknown>){
    setBusy(true);setError("");setNotice("");
    try {
      const response=await fetch("/api/control-center/compliance",{
        method:"POST",headers:await headers(),body:JSON.stringify(body),cache:"no-store",
      });
      const data=await response.json() as {error?:string;message?:string};
      if(!response.ok)throw new Error(data.message||data.error||"Operația a eșuat.");
      setNotice("Înregistrare salvată. Verifică separat documentele și comunicările externe.");
      await load(organizationId);
      return true;
    }catch(e){setError(e instanceof Error?e.message:"Operația a eșuat.");return false;}
    finally{setBusy(false);}
  }
  async function registerContract(event:FormEvent){
    event.preventDefault();
    if(!organizationId)return;
    const ok=await post({action:"register_contract",organizationId,...contract});
    if(ok)setContract({...contract,title:"",sha256:"",evidenceReference:""});
  }
  async function registerPrivacy(event:FormEvent){
    event.preventDefault();
    const ok=await post({action:"create_privacy_case",
      organizationId:organizationId||null,...privacy});
    if(ok)setPrivacy({...privacy,subjectReference:""});
  }
  const selected=payload.organizations.find(o=>o.id===organizationId);
  return (
    <main className="min-h-screen bg-[#080a12] px-5 py-10 text-[#f5f5f7] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/control-center" className="text-sm text-indigo-300 hover:underline">← Control Center</Link>
        <div className="mt-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-indigo-300">ORBYVEN / acces intern</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Legal & Trust</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
              Dosar contractual și registru operațional GDPR. Aceste înregistrări nu certifică
              o semnătură, nu aprobă juridic un contract și nu șterg automat date.
            </p>
          </div>
          <button type="button" onClick={()=>void load(organizationId)} className={BUTTON}>Actualizează</button>
        </div>
        <label className="mt-9 block max-w-xl text-sm">
          <span className="mb-2 block text-white/70">Organizație</span>
          <select value={organizationId} onChange={e=>setOrganizationId(e.target.value)} className={INPUT}>
            <option value="">ORBYVEN intern / toate cererile GDPR</option>
            {payload.organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        {error&&<p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}
        {notice&&<p role="status" className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">{notice}</p>}
        {loading?<p className="mt-10 text-white/60">Se încarcă datele autorizate…</p>:<>
          <section className="mt-10 rounded-[24px] border border-white/10 bg-white/[.04] p-5 sm:p-7">
            <h2 className="text-xl font-semibold">Dosar contractual {selected?"· "+selected.name:""}</h2>
            {!organizationId?<p className="mt-3 text-sm text-white/60">Selectează o organizație pentru dovezile contractuale.</p>:<>
              <p className="mt-3 text-sm text-white/60">
                Acceptările checkout provin direct din billing_terms_acceptances. Înregistrările manuale
                sunt doar referințe interne până la verificarea dovezii originale.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 p-4">
                  <h3 className="font-medium">Termeni acceptați la checkout ({payload.checkouts.length})</h3>
                  {payload.checkouts.length===0&&<p className="mt-3 text-sm text-white/50">Nu există acceptări înregistrate.</p>}
                  {payload.checkouts.map(a=><div key={a.id} className="mt-3 border-t border-white/10 pt-3 text-xs leading-6">
                    <span className="font-semibold">{a.document_type}</span> · {a.document_version}<br/>
                    {date(a.accepted_at)} · {a.accepted_from}<br/>
                    Emitent: {a.merchant_legal_name||"Necompletat în înregistrarea istorică"}
                  </div>)}
                </div>
                <div className="rounded-2xl border border-white/10 p-4">
                  <h3 className="font-medium">Abonamente ({payload.subscriptions.length})</h3>
                  {payload.subscriptions.length===0&&<p className="mt-3 text-sm text-white/50">Nu există abonamente înregistrate.</p>}
                  {payload.subscriptions.map(s=><p key={s.id} className="mt-3 border-t border-white/10 pt-3 text-xs leading-6">
                    {s.plan_id} · {s.status}<br/>Emitent: {s.merchant_legal_name||"Necompletat"}
                  </p>)}
                </div>
              </div>
              <h3 className="mt-8 text-base font-semibold">Documente arhivate manual</h3>
              {payload.contracts.length===0&&<p className="mt-3 text-sm text-white/50">Niciun document de referință.</p>}
              <div className="mt-3 space-y-3">
                {payload.contracts.map(c=><article key={c.id} className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
                  <div className="flex flex-wrap justify-between gap-2"><strong>{c.title}</strong><span className="text-amber-200">Înregistrat intern · neverificat</span></div>
                  <p className="mt-2 text-xs text-white/60">{c.document_type} · v. {c.document_version} · {date(c.recorded_at)}</p>
                  <p className="mt-2 break-all text-xs text-white/60">Referință: {c.evidence_reference}<br/>SHA-256: {c.sha256}</p>
                </article>)}
              </div>
              <form onSubmit={e=>void registerContract(e)} className="mt-6 grid gap-3 rounded-2xl border border-indigo-400/20 bg-indigo-400/[.04] p-4 sm:grid-cols-2">
                <h3 className="sm:col-span-2 font-semibold">Înregistrează o referință verificabilă</h3>
                <select aria-label="Tip document" value={contract.documentType} onChange={e=>setContract({...contract,documentType:e.target.value})} className={INPUT}>
                  {["contract","order_form","dpa","amendment","other"].map(x=><option key={x} value={x}>{x}</option>)}
                </select>
                <input aria-label="Titlu document" required placeholder="Titlu document" value={contract.title} onChange={e=>setContract({...contract,title:e.target.value})} className={INPUT}/>
                <input aria-label="Versiune" required placeholder="Versiune document" value={contract.documentVersion} onChange={e=>setContract({...contract,documentVersion:e.target.value})} className={INPUT}/>
                <input aria-label="Referință internă" required placeholder="Referință privată (ID sau cale arhivă)" value={contract.evidenceReference} onChange={e=>setContract({...contract,evidenceReference:e.target.value})} className={INPUT}/>
                <input aria-label="SHA256" required placeholder="SHA-256 document (64 caractere hex)" value={contract.sha256} onChange={e=>setContract({...contract,sha256:e.target.value})} className={INPUT+" sm:col-span-2"}/>
                <p className="text-xs text-amber-100/80 sm:col-span-2">Nu introduce date personale sau URL public. Documentul original trebuie păstrat separat în arhivă autorizată; înregistrarea nu înseamnă că semnătura este verificată.</p>
                <button disabled={busy} className={BUTTON+" sm:col-span-2"}>Înregistrează documentul fără modificări ulterioare</button>
              </form>
            </>}
          </section>
          <section className="mt-7 rounded-[24px] border border-white/10 bg-white/[.04] p-5 sm:p-7">
            <h2 className="text-xl font-semibold">Cereri GDPR ({payload.privacyCases.length})</h2>
            <p className="mt-3 text-sm text-white/60">
              {organizationId?"Filtrate pentru această organizație.":"Toate organizațiile și cererile interne."}
              {" "}Termenul afișat este orientativ; o prelungire cere evaluare și comunicare separată.
              Nu se execută automat exportul, ștergerea sau notificarea solicitantului.
            </p>
            <form onSubmit={e=>void registerPrivacy(e)} className="mt-5 grid gap-3 rounded-2xl border border-white/10 p-4 sm:grid-cols-2">
              <input aria-label="Referință pseudonimă" required placeholder="Referință pseudonimă internă (nu email/CI)" value={privacy.subjectReference} onChange={e=>setPrivacy({...privacy,subjectReference:e.target.value})} className={INPUT+" sm:col-span-2"}/>
              <select aria-label="Tip cerere" value={privacy.requestType} onChange={e=>setPrivacy({...privacy,requestType:e.target.value})} className={INPUT}>
                {Object.entries(kindLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
              <select aria-label="Rol GDPR" value={privacy.processingRole} onChange={e=>setPrivacy({...privacy,processingRole:e.target.value})} className={INPUT}>
                <option value="undetermined">Rol de stabilit</option><option value="controller">Operator</option><option value="processor">Împuternicit</option>
              </select>
              <select aria-label="Canal" value={privacy.channel} onChange={e=>setPrivacy({...privacy,channel:e.target.value})} className={INPUT}>
                <option value="email">Email</option><option value="form">Formular</option><option value="other">Alt canal</option>
              </select>
              <button disabled={busy} className={BUTTON}>Înregistrează cererea</button>
            </form>
            <div className="mt-6 space-y-4">
              {payload.privacyCases.length===0&&<p className="text-sm text-white/50">Nu există cereri în acest filtru.</p>}
              {payload.privacyCases.map(c=><article key={c.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <strong>{kindLabels[c.request_type]||c.request_type} · {c.subject_reference}</strong>
                  <span className={new Date(c.due_at)<new Date()&&c.status!=="closed"?"text-rose-300":"text-amber-200"}>{c.status}</span>
                </div>
                <p className="mt-3 text-xs leading-6 text-white/60">Primit: {date(c.received_at)} · Termen inițial: {date(c.due_at)}<br/>
                  Rol: {c.processing_role} · Organizație: {payload.organizations.find(o=>o.id===c.organization_id)?.name||"ORBYVEN intern"}<br/>
                  Ultima acțiune: {c.last_action||"—"}
                </p>
                {nextStatus[c.status]?.length>0&&<div className="mt-4 grid gap-2 sm:grid-cols-[auto_1fr_auto]">
                  <select aria-label="Următorul status" className={INPUT} value={caseStates[c.id]||nextStatus[c.status][0]} onChange={e=>setCaseStates({...caseStates,[c.id]:e.target.value})}>
                    {nextStatus[c.status].map(s=><option key={s} value={s}>{statuses.includes(s as typeof statuses[number])?s:s}</option>)}
                  </select>
                  <input aria-label="Acțiune efectuată" className={INPUT} placeholder="Acțiune efectuată (fără date sensibile)" value={caseNotes[c.id]||""} onChange={e=>setCaseNotes({...caseNotes,[c.id]:e.target.value})}/>
                  <button disabled={busy} className={BUTTON} onClick={()=>void post({
                    action:"advance_privacy_case",id:c.id,status:caseStates[c.id]||nextStatus[c.status][0],actionNote:caseNotes[c.id]||"",
                  })}>Actualizează</button>
                </div>}
              </article>)}
            </div>
          </section>
          <p className="mt-8 text-xs text-white/40">Acces exclusiv echipei ORBYVEN autorizate. Exportul, ștergerea și certificarea legală rămân operațiuni distincte.</p>
        </>}
      </div>
    </main>
  );
}
