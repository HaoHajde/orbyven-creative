"use client";

import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

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
type OrderEvidence = {
  id:string;plan_id:string;offer_sha256:string;accepted_at:string;status:string;
  stripe_checkout_session_id:string|null;checkout_final_amount_minor:number|null;
  checkout_tax_amount_minor:number|null;checkout_discount_amount_minor:number|null;
  checkout_currency:string|null;checkout_payment_status:string|null;checkout_completed_at:string|null;
  checkout_buyer_name:string|null;checkout_buyer_tax_id:string|null;
  offer_snapshot:{
    plan_name:string;displayed_monthly_amount_minor:number;displayed_currency:string;
    displayed_tax_label:string;commitment_months:number;displayed_commitment_total_minor:number;merchant_legal_name:string|null;
    legal_document_version:string;acknowledgement_text:string;
  };
};
type ExitCase = {
  id:string;organization_id:string;status:string;requested_at:string;
  package_sha256:string|null;package_generated_at:string|null;
  action_note:string;closure_reference:string|null;
};
type PrivacyCase = {
  id:string;organization_id:string|null;subject_reference:string;request_type:string;
  processing_role:string;status:string;received_at:string;due_at:string;last_action:string|null;
};
type Payload = {
  organizations:Organization[];contracts:Contract[];checkouts:Acceptance[];
  subscriptions:Subscription[];privacyCases:PrivacyCase[];orderEvidence:OrderEvidence[];exitCases:ExitCase[];offboardingConfigured:boolean;
};
type View = "contracts" | "offboarding" | "privacy";

const EMPTY:Payload = {organizations:[],contracts:[],checkouts:[],subscriptions:[],privacyCases:[],orderEvidence:[],exitCases:[],offboardingConfigured:false};
const INPUT = "h-10 w-full rounded-[12px] border border-white/[0.08] bg-black/35 px-3 text-xs text-[#e8e8eb] outline-none transition placeholder:text-[#55555c] focus:border-indigo-400/50";
const BUTTON = "h-10 rounded-[12px] border border-white/[0.1] px-4 text-[11px] font-semibold text-[#c8c8cd] transition hover:border-white/20 hover:text-white disabled:opacity-45";
const PRIMARY = "h-10 rounded-[12px] bg-white px-4 text-[11px] font-semibold text-black transition hover:bg-[#ececef] disabled:opacity-45";
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
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("ro-RO",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"}).format(parsed);
}

function Dot({ tone = "ok" }: { tone?: "ok" | "warn" | "danger" }) {
  return <span className={`h-2 w-2 rounded-full ${tone === "ok" ? "bg-emerald-400" : tone === "warn" ? "bg-amber-300" : "bg-rose-400"}`} />;
}

export default function LegalOperationsPage() {
  const router=useRouter();
  const [view,setView]=useState<View>("contracts");
  const [organizationId,setOrganizationId]=useState("");
  const [payload,setPayload]=useState<Payload>(EMPTY);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [contract,setContract]=useState({documentType:"contract",title:"",documentVersion:"",sha256:"",evidenceReference:""});
  const [privacy,setPrivacy]=useState({subjectReference:"",requestType:"access",processingRole:"undetermined",channel:"email"});
  const [caseNotes,setCaseNotes]=useState<Record<string,string>>({});
  const [caseRoles,setCaseRoles]=useState<Record<string,string>>({});
  const [exitNotes,setExitNotes]=useState<Record<string,string>>({});
  const [exitRefs,setExitRefs]=useState<Record<string,string>>({});
  const [caseStates,setCaseStates]=useState<Record<string,string>>({});

  const headers=useCallback(async()=>{
    const {data}=await orbyvenSupabase.auth.getSession();
    if (!data.session) throw new Error("Sesiunea a expirat.");
    return {Authorization:"Bearer "+data.session.access_token,"Content-Type":"application/json"};
  },[]);

  const load=useCallback(async(id:string)=>{
    setLoading(true);setError("");
    try {
      const response=await fetch("/api/control-center/compliance"+(id?"?organizationId="+encodeURIComponent(id):""),{
        headers:await headers(),cache:"no-store",
      });
      if(response.status===401){router.replace("/control-center/login");return;}
      const data=await response.json() as Payload & {error?:string};
      if(!response.ok)throw new Error(data.error==="compliance_migration_required"?"Legal migration required.":"Acces indisponibil ("+(data.error||response.status)+").");
      setPayload(data);
    }catch(e){setError(e instanceof Error?e.message:"Registru indisponibil.");}
    finally{setLoading(false);}
  },[headers,router]);

  useEffect(()=>{
    const frame=window.requestAnimationFrame(()=>{void load(organizationId);});
    return ()=>window.cancelAnimationFrame(frame);
  },[load,organizationId]);

  async function post(body:Record<string,unknown>){
    setBusy(true);setError("");setNotice("");
    try {
      const response=await fetch("/api/control-center/compliance",{
        method:"POST",headers:await headers(),body:JSON.stringify(body),cache:"no-store",
      });
      const data=await response.json() as {error?:string;message?:string};
      if(!response.ok)throw new Error(data.message||data.error||"Operația a eșuat.");
      setNotice("Saved");
      await load(organizationId);
      window.setTimeout(()=>setNotice(""),1600);
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
    const ok=await post({action:"create_privacy_case",organizationId:organizationId||null,...privacy});
    if(ok)setPrivacy({...privacy,subjectReference:""});
  }

  const selected=payload.organizations.find(o=>o.id===organizationId);
  const openPrivacy=useMemo(()=>payload.privacyCases.filter(item=>item.status!=="closed").length,[payload.privacyCases]);
  const overduePrivacy=useMemo(()=>payload.privacyCases.filter(item=>item.status!=="closed"&&new Date(item.due_at)<new Date()).length,[payload.privacyCases]);
  const activeExit=useMemo(()=>payload.exitCases.filter(item=>item.status!=="closed").length,[payload.exitCases]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_55%_-15%,rgba(79,70,229,.12),transparent_32%),#08080a] pb-24 text-[#f5f5f7] antialiased">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#09090b]/86 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-[68px] max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#66666d]">CONTROL CENTER</p>
              <h1 className="mt-1 text-sm font-semibold">Legal & Trust</h1>
            </div>
            <span className="hidden h-5 w-px bg-white/[0.08] sm:block" />
            <div className="hidden items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6f6f76] sm:flex">
              <Dot /> Owner
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={organizationId} onChange={e=>setOrganizationId(e.target.value)} className="h-9 max-w-[240px] rounded-[12px] border border-white/[0.08] bg-black/30 px-3 text-[10px] text-[#b4b4ba] outline-none">
              <option value="">All / internal</option>
              {payload.organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <button type="button" onClick={()=>void load(organizationId)} className="grid h-9 w-9 place-items-center rounded-[12px] border border-white/[0.08] text-[#77777d] hover:text-white" aria-label="Refresh">↻</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        {error&&<div role="alert" className="fixed right-4 top-20 z-[80] max-w-sm rounded-[14px] border border-rose-400/20 bg-rose-950/85 px-4 py-3 text-[11px] text-rose-200 shadow-2xl">{error}</div>}
        {notice&&<div role="status" className="fixed right-4 top-20 z-[80] rounded-[14px] border border-emerald-400/20 bg-emerald-950/85 px-4 py-3 text-[11px] text-emerald-200 shadow-2xl">{notice}</div>}

        <section className="grid gap-2 sm:grid-cols-3">
          <Metric label="Evidence" value={payload.contracts.length+payload.checkouts.length+payload.orderEvidence.length} />
          <Metric label="Offboarding" value={activeExit} tone={activeExit>0?"warn":"ok"} />
          <Metric label="GDPR open" value={openPrivacy} tone={overduePrivacy>0?"danger":openPrivacy>0?"warn":"ok"} note={overduePrivacy?`${overduePrivacy} overdue`:undefined} />
        </section>

        <div className="mt-4 flex w-fit max-w-full gap-1 overflow-x-auto rounded-[15px] border border-white/[0.07] bg-white/[0.025] p-1">
          {([
            ["contracts","Contracts",payload.contracts.length+payload.checkouts.length],
            ["offboarding","Offboarding",payload.exitCases.length],
            ["privacy","GDPR",payload.privacyCases.length],
          ] as const).map(([id,label,count])=><button key={id} type="button" onClick={()=>setView(id)} className={`h-9 whitespace-nowrap rounded-[11px] px-3 text-[10px] font-semibold transition ${view===id?"bg-white text-black":"text-[#77777d] hover:text-white"}`}>{label}<span className={`ml-2 ${view===id?"text-black/50":"text-[#505056]"}`}>{count}</span></button>)}
        </div>

        {loading ? <div className="grid min-h-[45vh] place-items-center"><span className="h-5 w-5 animate-spin rounded-full border border-white/15 border-t-white" /></div> : <>
          {view==="contracts"&&<ContractsView
            selected={selected}
            organizationId={organizationId}
            payload={payload}
            contract={contract}
            setContract={setContract}
            busy={busy}
            registerContract={registerContract}
          />}

          {view==="offboarding"&&<OffboardingView
            payload={payload}
            busy={busy}
            exitNotes={exitNotes}
            setExitNotes={setExitNotes}
            exitRefs={exitRefs}
            setExitRefs={setExitRefs}
            post={post}
          />}

          {view==="privacy"&&<PrivacyView
            payload={payload}
            organizationId={organizationId}
            privacy={privacy}
            setPrivacy={setPrivacy}
            busy={busy}
            registerPrivacy={registerPrivacy}
            caseRoles={caseRoles}
            setCaseRoles={setCaseRoles}
            caseNotes={caseNotes}
            setCaseNotes={setCaseNotes}
            caseStates={caseStates}
            setCaseStates={setCaseStates}
            post={post}
          />}
        </>}
      </div>
    </main>
  );
}

function ContractsView({selected,organizationId,payload,contract,setContract,busy,registerContract}:{
  selected:Organization|undefined;organizationId:string;payload:Payload;
  contract:{documentType:string;title:string;documentVersion:string;sha256:string;evidenceReference:string};
  setContract:(value:{documentType:string;title:string;documentVersion:string;sha256:string;evidenceReference:string})=>void;
  busy:boolean;registerContract:(event:FormEvent)=>Promise<void>;
}) {
  if(!organizationId)return <Empty title="Select a tenant" />;
  return <section className="mt-4 grid gap-3 xl:grid-cols-[.72fr_1.28fr]">
    <div className="space-y-3">
      <Panel title="Terms" count={payload.checkouts.length}>
        <ListEmpty show={payload.checkouts.length===0}/>
        {payload.checkouts.map(a=><Row key={a.id} title={`${a.document_type} · ${a.document_version}`} meta={`${date(a.accepted_at)} · ${a.accepted_from}`} />)}
      </Panel>
      <Panel title="Subscriptions" count={payload.subscriptions.length}>
        <ListEmpty show={payload.subscriptions.length===0}/>
        {payload.subscriptions.map(s=><Row key={s.id} title={s.plan_id} meta={s.status} />)}
      </Panel>
      <details className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4">
        <summary className="cursor-pointer text-xs font-semibold text-[#c8c8cd]">+ Reference</summary>
        <form onSubmit={e=>void registerContract(e)} className="mt-4 grid gap-2">
          <select aria-label="Tip document" value={contract.documentType} onChange={e=>setContract({...contract,documentType:e.target.value})} className={INPUT}>
            {["contract","order_form","dpa","amendment","other"].map(x=><option key={x} value={x}>{x}</option>)}
          </select>
          <input aria-label="Titlu document" required placeholder="Title" value={contract.title} onChange={e=>setContract({...contract,title:e.target.value})} className={INPUT}/>
          <input aria-label="Versiune" required placeholder="Version" value={contract.documentVersion} onChange={e=>setContract({...contract,documentVersion:e.target.value})} className={INPUT}/>
          <input aria-label="Referință internă" required placeholder="Private reference" value={contract.evidenceReference} onChange={e=>setContract({...contract,evidenceReference:e.target.value})} className={INPUT}/>
          <input aria-label="SHA256" required placeholder="SHA-256" value={contract.sha256} onChange={e=>setContract({...contract,sha256:e.target.value})} className={INPUT}/>
          <button disabled={busy} className={PRIMARY}>Register</button>
        </form>
        <p className="mt-3 text-[9px] leading-4 text-[#55555b]">Reference only · original stays in authorized archive · no PII/public URL.</p>
      </details>
    </div>

    <div className="space-y-3">
      <Panel title={`Orders${selected?` · ${selected.name}`:""}`} count={payload.orderEvidence.length}>
        <ListEmpty show={payload.orderEvidence.length===0}/>
        <div className="grid gap-2 lg:grid-cols-2">
          {payload.orderEvidence.map(o=><article key={o.id} className="rounded-[15px] border border-white/[0.06] bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3"><strong className="truncate text-[11px]">{o.offer_snapshot.plan_name}</strong><Status value={o.status}/></div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Mini label="Monthly" value={`${o.offer_snapshot.displayed_monthly_amount_minor/100} ${o.offer_snapshot.displayed_currency.toUpperCase()}`} />
              <Mini label="Term" value={`${o.offer_snapshot.commitment_months}m`} />
              <Mini label="Total" value={`${o.offer_snapshot.displayed_commitment_total_minor/100} RON`} />
            </div>
            <details className="mt-3 border-t border-white/[0.06] pt-2 text-[9px] leading-4 text-[#66666d]">
              <summary className="cursor-pointer">Evidence</summary>
              <p className="mt-2 break-all">{o.offer_sha256}</p>
              {o.checkout_completed_at&&<p className="mt-1">Stripe · {(o.checkout_final_amount_minor??0)/100} {(o.checkout_currency||"ron").toUpperCase()} · {o.checkout_payment_status||"—"}</p>}
            </details>
          </article>)}
        </div>
      </Panel>

      <Panel title="Manual archive" count={payload.contracts.length}>
        <ListEmpty show={payload.contracts.length===0}/>
        {payload.contracts.map(c=><div key={c.id} className="border-t border-white/[0.06] py-3 first:border-0 first:pt-0">
          <div className="flex items-center justify-between gap-3"><strong className="truncate text-[11px]">{c.title}</strong><span className="text-[9px] text-amber-300">UNVERIFIED</span></div>
          <p className="mt-1 text-[9px] text-[#626268]">{c.document_type} · v{c.document_version} · {date(c.recorded_at)}</p>
          <details className="mt-1 text-[9px] text-[#55555b]"><summary className="cursor-pointer">Reference</summary><p className="mt-1 break-all">{c.evidence_reference}<br/>{c.sha256}</p></details>
        </div>)}
      </Panel>
    </div>
  </section>;
}

function OffboardingView({payload,busy,exitNotes,setExitNotes,exitRefs,setExitRefs,post}:{
  payload:Payload;busy:boolean;exitNotes:Record<string,string>;setExitNotes:(value:Record<string,string>)=>void;
  exitRefs:Record<string,string>;setExitRefs:(value:Record<string,string>)=>void;post:(body:Record<string,unknown>)=>Promise<boolean>;
}) {
  return <section className="mt-4">
    {!payload.offboardingConfigured&&<div className="mb-3 rounded-[15px] border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3 text-[10px] text-amber-100">Migration required · export remains blocked.</div>}
    <div className="space-y-2">
      {payload.exitCases.length===0&&<Empty title="No exit cases" />}
      {payload.exitCases.map(c=>{
        const next=c.status==="requested"?"authorized":c.status==="package_generated"?"retention_review":c.status==="retention_review"?"closed":null;
        return <article key={c.id} className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0"><strong className="block truncate text-xs">{payload.organizations.find(o=>o.id===c.organization_id)?.name||c.organization_id}</strong><span className="mt-1 block text-[9px] text-[#606066]">{date(c.requested_at)}</span></div>
            <Status value={c.status}/>
          </div>
          {(c.package_sha256||c.closure_reference)&&<details className="mt-3 text-[9px] leading-4 text-[#626268]"><summary className="cursor-pointer">Evidence</summary>{c.package_sha256&&<p className="mt-2 break-all">Package · {c.package_sha256}</p>}{c.closure_reference&&<p className="mt-1">Closure · {c.closure_reference}</p>}</details>}
          {next&&<div className={`mt-3 grid gap-2 ${next==="closed"?"lg:grid-cols-[1fr_1fr_auto]":"lg:grid-cols-[1fr_auto]"}`}>
            <input aria-label="Notă de predare sau retenție" className={INPUT} placeholder="Documented action" value={exitNotes[c.id]||""} onChange={e=>setExitNotes({...exitNotes,[c.id]:e.target.value})}/>
            {next==="closed"&&<input aria-label="Referință închidere" className={INPUT} placeholder="Closure reference" value={exitRefs[c.id]||""} onChange={e=>setExitRefs({...exitRefs,[c.id]:e.target.value})}/>} 
            <button type="button" className={PRIMARY} disabled={busy} onClick={()=>void post({action:"advance_exit_case",id:c.id,status:next,actionNote:exitNotes[c.id]||"",closureReference:exitRefs[c.id]||""})}>{next==="authorized"?"Authorize":next==="retention_review"?"Review":"Close"}</button>
          </div>}
        </article>;
      })}
    </div>
    <p className="mt-3 text-[9px] text-[#505056]">No automatic deletion · retention and external systems remain manual review.</p>
  </section>;
}

function PrivacyView({payload,organizationId,privacy,setPrivacy,busy,registerPrivacy,caseRoles,setCaseRoles,caseNotes,setCaseNotes,caseStates,setCaseStates,post}:{
  payload:Payload;organizationId:string;privacy:{subjectReference:string;requestType:string;processingRole:string;channel:string};
  setPrivacy:(value:{subjectReference:string;requestType:string;processingRole:string;channel:string})=>void;busy:boolean;registerPrivacy:(event:FormEvent)=>Promise<void>;
  caseRoles:Record<string,string>;setCaseRoles:(value:Record<string,string>)=>void;caseNotes:Record<string,string>;setCaseNotes:(value:Record<string,string>)=>void;
  caseStates:Record<string,string>;setCaseStates:(value:Record<string,string>)=>void;post:(body:Record<string,unknown>)=>Promise<boolean>;
}) {
  return <section className="mt-4 grid gap-3 xl:grid-cols-[330px_minmax(0,1fr)]">
    <form onSubmit={e=>void registerPrivacy(e)} className="h-fit rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xs font-semibold">New request</h2><span className="text-[9px] text-[#55555b]">{organizationId?"TENANT":"INTERNAL"}</span></div>
      <div className="mt-4 grid gap-2">
        <input aria-label="Referință pseudonimă" required placeholder="Pseudonymous reference" value={privacy.subjectReference} onChange={e=>setPrivacy({...privacy,subjectReference:e.target.value})} className={INPUT}/>
        <select aria-label="Tip cerere" value={privacy.requestType} onChange={e=>setPrivacy({...privacy,requestType:e.target.value})} className={INPUT}>{Object.entries(kindLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
        <select aria-label="Rol GDPR" value={privacy.processingRole} onChange={e=>setPrivacy({...privacy,processingRole:e.target.value})} className={INPUT}><option value="undetermined">Role pending</option><option value="controller">Operator</option><option value="processor">Processor</option></select>
        <select aria-label="Canal" value={privacy.channel} onChange={e=>setPrivacy({...privacy,channel:e.target.value})} className={INPUT}><option value="email">Email</option><option value="form">Form</option><option value="other">Other</option></select>
        <button disabled={busy} className={PRIMARY}>Register</button>
      </div>
      <p className="mt-3 text-[9px] leading-4 text-[#505056]">Use an internal pseudonymous reference. No email/ID.</p>
    </form>

    <div className="space-y-2">
      {payload.privacyCases.length===0&&<Empty title="No GDPR requests" />}
      {payload.privacyCases.map(c=>{
        const overdue=new Date(c.due_at)<new Date()&&c.status!=="closed";
        return <article key={c.id} className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0"><strong className="block truncate text-xs">{kindLabels[c.request_type]||c.request_type} · {c.subject_reference}</strong><p className="mt-1 text-[9px] text-[#5c5c62]">Due {date(c.due_at)} · {c.processing_role}</p></div>
            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase ${overdue?"border-rose-400/20 text-rose-300":"border-white/[0.08] text-amber-200"}`}>{c.status}</span>
          </div>
          {c.last_action&&<details className="mt-3 text-[9px] leading-4 text-[#626268]"><summary className="cursor-pointer">Last action</summary><p className="mt-1">{c.last_action}</p></details>}
          {c.processing_role==="undetermined"&&<div className="mt-3 grid gap-2 sm:grid-cols-[160px_1fr_auto]">
            <select aria-label="Rol GDPR stabilit" className={INPUT} value={caseRoles[c.id]||"controller"} onChange={e=>setCaseRoles({...caseRoles,[c.id]:e.target.value})}><option value="controller">Operator</option><option value="processor">Processor</option></select>
            <input aria-label="Notă rol" className={INPUT} placeholder="Documented note" value={caseNotes[c.id]||""} onChange={e=>setCaseNotes({...caseNotes,[c.id]:e.target.value})}/>
            <button type="button" disabled={busy} className={BUTTON} onClick={()=>void post({action:"assess_case_role",id:c.id,processingRole:caseRoles[c.id]||"controller",actionNote:caseNotes[c.id]||""})}>Set role</button>
          </div>}
          {nextStatus[c.status]?.length>0&&<div className="mt-3 grid gap-2 sm:grid-cols-[160px_1fr_auto]">
            <select aria-label="Următorul status" className={INPUT} value={caseStates[c.id]||nextStatus[c.status][0]} onChange={e=>setCaseStates({...caseStates,[c.id]:e.target.value})}>{nextStatus[c.status].map(s=><option key={s} value={s}>{statuses.includes(s as typeof statuses[number])?s:s}</option>)}</select>
            <input aria-label="Acțiune efectuată" className={INPUT} placeholder="Documented action" value={caseNotes[c.id]||""} onChange={e=>setCaseNotes({...caseNotes,[c.id]:e.target.value})}/>
            <button type="button" disabled={busy} className={PRIMARY} onClick={()=>void post({action:"advance_privacy_case",id:c.id,status:caseStates[c.id]||nextStatus[c.status][0],actionNote:caseNotes[c.id]||""})}>Update</button>
          </div>}
        </article>;
      })}
    </div>
  </section>;
}

function Panel({title,count,children}:{title:string;count:number;children:React.ReactNode}) {
  return <section className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-center gap-2"><h2 className="text-xs font-semibold">{title}</h2><span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[9px] text-[#66666c]">{count}</span></div><div className="mt-3">{children}</div></section>;
}

function Metric({label,value,tone="ok",note}:{label:string;value:number;tone?:"ok"|"warn"|"danger";note?:string}) {
  return <article className="rounded-[18px] border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#5f5f66]">{label}</p><p className="mt-1 text-2xl font-semibold tracking-[-0.05em]">{value}</p></div><Dot tone={tone}/></div>{note&&<p className="mt-2 text-[9px] text-rose-300">{note}</p>}</article>;
}

function Row({title,meta}:{title:string;meta:string}) {
  return <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] py-2.5 first:border-0 first:pt-0"><span className="truncate text-[10px] font-medium text-[#c4c4ca]">{title}</span><span className="shrink-0 text-[9px] text-[#55555b]">{meta}</span></div>;
}

function Mini({label,value}:{label:string;value:string}) {
  return <div className="min-w-0"><p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#4f4f55]">{label}</p><p className="mt-1 truncate text-[9px] text-[#9b9ba1]">{value}</p></div>;
}

function Status({value}:{value:string}) {
  return <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[9px] font-semibold uppercase text-amber-200">{value}</span>;
}

function Empty({title}:{title:string}) {
  return <div className="grid min-h-[160px] place-items-center rounded-[20px] border border-dashed border-white/[0.07] text-[10px] text-[#55555b]">{title}</div>;
}

function ListEmpty({show}:{show:boolean}) {
  return show?<p className="py-3 text-[10px] text-[#55555b]">None</p>:null;
}
