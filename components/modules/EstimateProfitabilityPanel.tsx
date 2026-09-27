"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import {orbyvenSupabase} from "@/lib/orbyven-supabase";
import type {Estimate} from "@/lib/modules/estimates";
import {computeEstimateProfitability,type CostLine} from "@/lib/ecosystem/profitability";

type Expense={id:string;amount_cents:number;currency:string};
const lei=(value:number,currency:string,locale:string)=>
  new Intl.NumberFormat(locale,{style:"currency",currency:currency||"RON"}).format(value/100);
export default function EstimateProfitabilityPanel({
  organizationId,estimate,locale,refresh=0,
}:{organizationId:string;estimate:Estimate;locale:string;refresh?:number}){
  const [materials,setMaterials]=useState<CostLine[]>([]);
  const [expenses,setExpenses]=useState<Expense[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const [m,e]=await Promise.all([
        orbyvenSupabase.from("sales_material_requirements").select("quantity,unit_cost_cents")
          .eq("organization_id",organizationId).eq("estimate_id",estimate.id),
        orbyvenSupabase.from("finance_expenses").select("id,amount_cents,currency")
          .eq("organization_id",organizationId).eq("estimate_id",estimate.id),
      ]);
      if(m.error||e.error)throw m.error??e.error??new Error("Indisponibil.");
      setMaterials((m.data??[]) as CostLine[]);
      setExpenses((e.data??[]) as Expense[]);
    }catch(reason){
      console.error(reason);setError("Profitabilitatea nu a putut fi actualizată.");
    }finally{setLoading(false);}
  },[organizationId,estimate.id]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer);},[load,refresh]);
  const foreignExpenses=expenses.filter(e=>e.currency!==estimate.currency);
  const result=useMemo(()=>computeEstimateProfitability({
    subtotalCents:estimate.subtotal_cents,discountCents:estimate.discount_cents,
    materialLines:materials,plannedLaborCents:estimate.planned_labor_cents,
    otherCostCents:estimate.other_cost_cents,
    recordedExpensesCents:expenses.filter(e=>e.currency===estimate.currency).map(e=>e.amount_cents),
  }),[estimate,materials,expenses]);
  const rows=[
    ["Preț fără TVA",result.netPrice],
    ["Necesar materiale (estimat)",-result.estimatedMaterialCost],
    ["Manoperă (estimată)",-result.labor],
    ["Alte costuri (estimate)",-result.other],
  ] as const;
  return <section className="mt-4 rounded-[18px] border border-[var(--border-strong)] bg-[var(--surface)] p-4 sm:p-5" aria-label="Profitabilitate estimată">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted-2)]">ORBYVEN · FINANCIAL</p>
        <h3 className="mt-1 text-[16px] font-semibold">Profitabilitate pe lucrare</h3>
        <p className="mt-1 text-[11px] text-[var(--muted)]">Estimare operațională, fără TVA · nu reprezintă profit contabil.</p></div>
      <button type="button" onClick={()=>void load()} className="rounded-[10px] border border-[var(--border)] px-3 py-2 text-[11px] font-semibold">↻ Actualizează</button>
    </div>
    {loading?<p role="status" className="mt-4 text-xs text-[var(--muted)]">Se încarcă costurile…</p>:error?<p role="alert" className="mt-4 text-xs text-rose-400">{error}</p>:<>
      <div className="mt-4 grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[13px] border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
          <p className="text-[10px] text-[var(--muted)]">Marjă brută estimată</p>
          <p className={"mt-2 text-[27px] font-semibold tabular-nums "+(result.plannedMargin<0?"text-rose-400":"text-[var(--text)]")}>{lei(result.plannedMargin,estimate.currency,locale)}</p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">{result.plannedMarginPercent===null?"Fără venit":result.plannedMarginPercent.toFixed(1)+"% din prețul fără TVA"}</p>
          {materials.length===0&&<p className="mt-3 rounded-[9px] border border-amber-400/25 p-2 text-[10px] text-amber-300">Nu există necesar de materiale. Marja poate fi supraestimată.</p>}
          {estimate.planned_labor_cents===0&&<p className="mt-2 text-[10px] text-[var(--muted-2)]">Nu a fost bugetată manopera.</p>}
        </div>
        <div className="rounded-[13px] border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
          <div className="space-y-2">{rows.map(([label,value])=><div key={label} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-[var(--muted)]">{label}</span><strong className="tabular-nums">{lei(value,estimate.currency,locale)}</strong>
          </div>)}</div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3 text-[11px]">
            <span className="font-semibold">Cheltuieli efectiv înregistrate</span><strong>{lei(result.actualExpenses,estimate.currency,locale)}</strong>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[var(--muted-2)]">Doar cheltuieli asociate explicit acestui deviz. Sunt afișate separat pentru a nu dubla materiale deja bugetate.</p>
          {foreignExpenses.length>0&&<p className="mt-2 text-[10px] text-amber-300">{foreignExpenses.length} cheltuieli în alte monede nu sunt convertite automat.</p>}
        </div>
      </div>
    </>}
  </section>;
}
