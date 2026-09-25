"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type { Estimate, EstimateItem } from "@/lib/modules/estimates";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import {
  addMaterialRequirement, addRequirementsFromRecipe, advanceMaterialStatus,
  makeClientOfferDraft, markOfferManually, makeInvoiceDraft,
} from "@/lib/ecosystem/actions";

type MaterialRow = {
  id:string; description:string; quantity:number; unit:string; unit_cost_cents:number;
  vendor:string|null; status:"planned"|"ordered"|"bought"; source_estimate_item_id:string|null;
};
type DocumentRow = {
  id:string; reference:string; document_type:"offer"|"invoice_draft"; status:string;
  generated_from_updated_at:string|null;
};
type BudgetRow = {id:string;source_type:"materials"|"invoice";direction:"income"|"expense";amount_cents:number};
type RecipeRow = {id:string;name:string};
type Tone="ready"|"progress"|"waiting"|"future";
const statuses:Record<MaterialRow["status"],string>={planned:"De cumpărat",ordered:"Comandat",bought:"Cumpărat"};
const money=(n:number,currency:string,locale:string)=>new Intl.NumberFormat(locale,{style:"currency",currency:currency||"RON"}).format(n/100);
const buttonClass="rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-[11px] font-semibold transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40";
const fieldClass="h-10 min-w-0 w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-3 text-[12px] text-[var(--text)] outline-none focus:border-[var(--accent)]";
function Step({index,title,status,tone}:{index:string;title:string;status:string;tone:Tone}){
  const palette:Record<Tone,string>={
    ready:"border-emerald-400/25 bg-emerald-400/[0.07]",
    progress:"border-[var(--accent)]/35 bg-[var(--accent-soft)]",
    waiting:"border-[var(--border)] bg-[var(--surface-2)]/70",
    future:"border-[var(--border)] bg-[var(--bg)]/50",
  };
  return <div className={"min-w-[105px] flex-1 rounded-[12px] border px-3 py-3 "+palette[tone]}>
    <span className="text-[9px] font-semibold tracking-[0.15em] text-[var(--muted-2)]">{index}</span>
    <p className="mt-1.5 text-[11px] font-semibold">{title}</p>
    <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">{status}</p>
  </div>;
}

/** Fits directly inside the current EstimatesModule detail card. */
export default function CommercialWorkflowPanel({
  organizationId,estimate,items,locale,role,
}:{
  organizationId:string;estimate:Estimate;items:EstimateItem[];locale:string;
  role:OrbyvenWorkspace["membership"]["role"];
}){
  const [materials,setMaterials]=useState<MaterialRow[]>([]);
  const [documents,setDocuments]=useState<DocumentRow[]>([]);
  const [budget,setBudget]=useState<BudgetRow[]>([]);
  const [recipes,setRecipes]=useState<RecipeRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [refresh,setRefresh]=useState(0);
  const [materialOpen,setMaterialOpen]=useState(false);
  const [description,setDescription]=useState("");
  const [quantity,setQuantity]=useState("1");
  const [unit,setUnit]=useState("buc");
  const [unitCost,setUnitCost]=useState("");
  const [vendor,setVendor]=useState("");
  const [sourceItem,setSourceItem]=useState("");
  const [recipeId,setRecipeId]=useState("");
  const canWrite=role!=="viewer";
  const financeVisible=["owner","admin","manager"].includes(role);

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const [materialResult,docResult,recipeResult,budgetResult]=await Promise.all([
        orbyvenSupabase.from("sales_material_requirements").select("id,description,quantity,unit,unit_cost_cents,vendor,status,source_estimate_item_id")
          .eq("organization_id",organizationId).eq("estimate_id",estimate.id).order("position"),
        orbyvenSupabase.from("sales_commercial_documents").select("id,reference,document_type,status,generated_from_updated_at")
          .eq("organization_id",organizationId).eq("estimate_id",estimate.id),
        orbyvenSupabase.from("ops_material_recipes").select("id,name").eq("organization_id",organizationId).order("name"),
        financeVisible?orbyvenSupabase.from("finance_budget_entries").select("id,source_type,direction,amount_cents")
          .eq("organization_id",organizationId).eq("estimate_id",estimate.id):Promise.resolve(null),
      ]);
      if(materialResult.error||docResult.error||recipeResult.error||budgetResult?.error)
        throw materialResult.error??docResult.error??recipeResult.error??budgetResult?.error??new Error("Date indisponibile.");
      setMaterials((materialResult.data??[]) as MaterialRow[]);
      setDocuments((docResult.data??[]) as DocumentRow[]);
      setRecipes((recipeResult.data??[]) as RecipeRow[]);
      setBudget((budgetResult?.data??[]) as BudgetRow[]);
    }catch(reason){
      console.error(reason);
      setMaterials([]);setDocuments([]);setRecipes([]);setBudget([]);
      setError("Circuitul nu a putut fi încărcat. Reîncearcă.");
    }finally{setLoading(false);}
  },[organizationId,estimate.id,financeVisible]);
  useEffect(()=>{
    const timer=window.setTimeout(()=>void load(),0);
    return ()=>window.clearTimeout(timer);
  },[load,refresh,estimate.updated_at]);
  const reload=()=>setRefresh(value=>value+1);
  const offer=documents.find(doc=>doc.document_type==="offer");
  const invoice=documents.find(doc=>doc.document_type==="invoice_draft");
  const staleOffer=Boolean(offer&&(!offer.generated_from_updated_at||Date.parse(offer.generated_from_updated_at)<Date.parse(estimate.updated_at)));
  const staleInvoice=Boolean(invoice&&(!invoice.generated_from_updated_at||Date.parse(invoice.generated_from_updated_at)<Date.parse(estimate.updated_at)));
  const totalCost=useMemo(()=>materials.reduce((sum,row)=>sum+Math.round(row.quantity*row.unit_cost_cents),0),[materials]);
  const plannedBudget=budget.filter(row=>row.source_type==="materials"&&row.direction==="expense").reduce((sum,row)=>sum+row.amount_cents,0);
  const readyForOffer=canWrite&&!offer&&Boolean(estimate.client_id&&estimate.task_id&&items.length)&&!["rejected","expired"].includes(estimate.status);
  const readyForDraft=canWrite&&!invoice&&Boolean(offer&&!staleOffer&&offer.status==="accepted"&&estimate.status==="accepted"&&estimate.tax_rate!==null);

  const run=async(operation:()=>Promise<void>,success:string):Promise<boolean>=>{
    if(busy||!canWrite)return false;
    setBusy(true);setError("");setMessage("");
    try{await operation();setMessage(success);reload();return true;}
    catch(reason){console.error(reason);setError(reason instanceof Error?reason.message:"Acțiunea nu a reușit.");return false;}
    finally{setBusy(false);}
  };
  const addManualMaterial=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const qty=Number(quantity),unitCostCents=Math.round(Number(unitCost)*100);
    const success=await run(()=>addMaterialRequirement(organizationId,estimate.id,{
      description,quantity:qty,unit,unitCostCents,vendor,estimateItemId:sourceItem||undefined,
    }),"Materialul a fost adăugat.");
    if(success){setMaterialOpen(false);setDescription("");setUnitCost("");setVendor("");}
  };

  const steps:Array<{title:string;status:string;tone:Tone}>=[
    {title:"Deviz",status:"Salvat · "+estimate.reference,tone:"ready"},
    {title:"Materiale",status:materials.length?materials.length+" poziții":"Necesar gol",tone:materials.length?"ready":"waiting"},
    {title:"Ofertă client",status:offer?(staleOffer?"De revizuit":offer.status):"Negenerată",tone:offer?(staleOffer?"progress":"ready"):"waiting"},
    {title:"Factură",status:invoice?"Doar ciornă":"Inexistentă",tone:invoice?"progress":"waiting"},
    {title:"ANAF",status:"Neconectat",tone:"future"},
  ];
  return <section aria-label="Circuitul devizului" className="mt-5 rounded-[18px] border border-[var(--border-strong)] bg-[color:var(--surface)]/65 p-4 sm:p-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">ORBYVEN · BUSINESS FLOW</p>
        <h3 className="mt-1.5 text-[17px] font-semibold tracking-[-0.035em]">Circuitul acestui deviz</h3>
        <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">Materiale, ofertă și ciornă fiscală conectate la aceeași lucrare.</p>
      </div>
      <button type="button" onClick={reload} disabled={loading||busy} className={buttonClass}>↻ Actualizează</button>
    </header>

    {loading?<p role="status" className="mt-4 text-xs text-[var(--muted)]">Se verifică documentele asociate…</p>:
      <>
        {error&&<p role="alert" className="mt-3 rounded-[10px] border border-rose-400/30 bg-rose-400/10 p-3 text-[12px] text-rose-300">{error}</p>}
        {message&&<p role="status" className="mt-3 rounded-[10px] border border-emerald-400/25 bg-emerald-400/10 p-3 text-[12px] text-emerald-300">{message}</p>}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{steps.map((step,index)=><Step key={step.title} index={String(index+1).padStart(2,"0")} {...step}/>)}</div>
        {(!estimate.client_id||!estimate.task_id)&&<p className="mt-3 rounded-[10px] border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2.5 text-[11px] leading-5 text-amber-200">Pentru circuitul complet asociază devizul cu un client și o lucrare.</p>}
        {(staleOffer||staleInvoice)&&<p className="mt-3 rounded-[10px] border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2 text-[11px] text-sky-200">Devizul a fost actualizat după generarea documentului. Trebuie revizuit; documentele anterioare nu sunt suprascrise automat.</p>}

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          <article className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)]/60 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[12px] font-semibold">Necesar materiale</p>
              {canWrite&&["draft","sent"].includes(estimate.status)&&<button type="button" className={buttonClass} onClick={()=>setMaterialOpen(v=>!v)}>{materialOpen?"Închide":"+ Material"}</button>}</div>
            <p className="mt-1 text-[10px] text-[var(--muted)]">{materials.length?materials.length+" poziții legate de deviz":"Nu există încă o listă asociată."}</p>
            {materials.length>0&&<div className="mt-3 space-y-2">{materials.map(row=><div key={row.id} className="border-t border-[var(--border)] pt-2 text-[11px]">
              <div className="flex justify-between gap-3"><span className="min-w-0 truncate text-[var(--muted)]">{row.description} · {row.quantity} {row.unit}</span><strong className="shrink-0">{money(Math.round(row.quantity*row.unit_cost_cents),estimate.currency,locale)}</strong></div>
              <div className="mt-1 flex items-center justify-between gap-2"><span className="text-[10px] text-[var(--muted-2)]">{statuses[row.status]}{row.vendor?" · "+row.vendor:""}</span>
                {canWrite&&row.status!=="bought"&&<button type="button" disabled={busy} onClick={()=>void run(()=>advanceMaterialStatus(organizationId,estimate.id,row.id,row.status), "Status actualizat.")} className="text-[10px] font-semibold text-[var(--accent)] disabled:opacity-40">{row.status==="planned"?"Comandă →":"Cumpărat →"}</button>}
              </div>
            </div>)}</div>}
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-[11px]"><span className="text-[var(--muted)]">Cost estimat materiale</span><strong>{money(totalCost,estimate.currency,locale)}</strong></div>
            {financeVisible&&plannedBudget>0&&<p className="mt-1 text-[10px] text-[var(--muted-2)]">Buget materiale existent: {money(plannedBudget,estimate.currency,locale)} · afișat separat, fără dublare.</p>}
            {materialOpen&&canWrite&&<form onSubmit={(event)=>void addManualMaterial(event)} className="mt-3 grid gap-2 rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)] p-3">
              <p className="text-[11px] font-semibold">Adaugă material la deviz</p>
              <input required value={description} onChange={e=>setDescription(e.target.value)} placeholder="Material / descriere" className={fieldClass}/>
              <div className="grid grid-cols-[1fr_1fr] gap-2"><input required type="number" min="0.001" step="any" value={quantity} onChange={e=>setQuantity(e.target.value)} aria-label="Cantitate" className={fieldClass}/>
                <input required value={unit} onChange={e=>setUnit(e.target.value)} placeholder="Unitate" aria-label="Unitate" className={fieldClass}/></div>
              <input required type="number" min="0" step="0.01" value={unitCost} onChange={e=>setUnitCost(e.target.value)} placeholder="Cost unitar (lei)" aria-label="Cost unitar lei" className={fieldClass}/>
              <input value={vendor} onChange={e=>setVendor(e.target.value)} placeholder="Furnizor (opțional)" className={fieldClass}/>
              <select value={sourceItem} onChange={e=>setSourceItem(e.target.value)} aria-label="Poziție deviz" className={fieldClass}><option value="">Fără poziție specifică</option>{items.map(item=><option key={item.id} value={item.id}>{item.description}</option>)}</select>
              <button disabled={busy} className={buttonClass}>{busy?"Se salvează…":"Salvează materialul"}</button>
            </form>}
            {canWrite&&["draft","sent"].includes(estimate.status)&&recipes.length>0&&<div className="mt-3 grid gap-2 border-t border-[var(--border)] pt-3">
              <p className="text-[11px] font-semibold">Aplică o rețetă existentă</p>
              <select value={sourceItem} onChange={e=>setSourceItem(e.target.value)} aria-label="Poziția pentru rețetă" className={fieldClass}><option value="">Selectează poziția devizului</option>{items.map(item=><option key={item.id} value={item.id}>{item.description} · {item.quantity}</option>)}</select>
              <select value={recipeId} onChange={e=>setRecipeId(e.target.value)} aria-label="Rețetă de materiale" className={fieldClass}><option value="">Selectează o rețetă</option>{recipes.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
              <button type="button" disabled={busy||!sourceItem||!recipeId} onClick={()=>void run(()=>addRequirementsFromRecipe(organizationId,estimate.id,sourceItem,recipeId),"Rețeta a fost adăugată fără a șterge lista existentă.")} className={buttonClass}>Generează necesarul din rețetă</button>
            </div>}
          </article>

          <article className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)]/60 p-3.5">
            <p className="text-[12px] font-semibold">Documente comerciale</p>
            <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">Ofertă și ciornă separate de deviz; nu emit facturi fiscale.</p>
            <div className="mt-4 space-y-3 text-[11px]">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[var(--muted)]">Ofertă client</span><strong>{offer?offer.reference+" · "+offer.status:"Negenerată"}</strong></div>
              {readyForOffer&&<button type="button" disabled={busy} className={buttonClass} onClick={()=>void run(()=>makeClientOfferDraft(organizationId,estimate.id),"Ciorna ofertei este salvată.")}>Generează oferta client</button>}
              {canWrite&&offer&&!staleOffer&&offer.status==="draft"&&<button type="button" disabled={busy} className={buttonClass} onClick={()=>{if(window.confirm("Confirmi că ai transmis oferta clientului în afara ORBYVEN?")) void run(()=>markOfferManually(organizationId,estimate.id,"sent"),"Oferta este marcată trimisă.");}}>Confirmă trimiterea externă</button>}
              {canWrite&&offer&&!staleOffer&&offer.status==="sent"&&estimate.status==="accepted"&&<button type="button" disabled={busy} className={buttonClass} onClick={()=>{if(window.confirm("Confirmi acceptarea ofertei de către client?")) void run(()=>markOfferManually(organizationId,estimate.id,"accepted"),"Acceptarea ofertei este înregistrată manual.");}}>Confirmă acceptarea clientului</button>}
              <div className="border-t border-[var(--border)] pt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-[var(--muted)]">Ciornă factură</span><strong>{invoice?invoice.reference:"Inexistentă"}</strong></div>
              {readyForDraft&&<button type="button" disabled={busy} className={buttonClass} onClick={()=>void run(()=>makeInvoiceDraft(organizationId,estimate.id),"Ciornă pregătită; NU este factură fiscală emisă.")}>Creează ciornă factură</button>}
              {invoice&&<p className="text-[10px] leading-4 text-amber-300">Document de lucru. Referința PRE nu este serie și număr fiscal.</p>}
              <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between gap-2"><span className="text-[var(--muted)]">RO e-Factura / ANAF</span><strong className="text-[var(--muted-2)]">Neconectat</strong></div>
              <button disabled type="button" className={buttonClass} title="Necesită profil fiscal validat, emitere autorizată, XML și conexiune ANAF">Emiterea / trimiterea ANAF — indisponibilă</button>
            </div>
          </article>
        </div>
        <p className="mt-3 text-[10px] leading-4 text-[var(--muted-2)]">ORBYVEN nu emite și nu transmite facturi reale prin acest panou. Nu confundăm ciornele comerciale cu factura fiscală sau cu factura abonamentului ORBYVEN.</p>
      </>
    }
  </section>;
}
