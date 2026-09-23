"use client";

import { useMemo, useState } from "react";
import { ECOSYSTEM_STEPS, missingRecommendedModules, unmetSteps, type EcosystemStepId } from "@/lib/orbyven-ecosystem";
import { ORBYVEN_MODULES, type OrbyvenModuleId } from "@/lib/orbyven-modules";

type PreviewLine = { name: string; kind: "material" | "labor"; unit: string; quantity: number; priceCents: number };
const SAMPLE_LINES: PreviewLine[] = [
  { name: "Țeavă multistrat", kind: "material", unit: "m", quantity: 36, priceCents: 1800 },
  { name: "Distribuitor", kind: "material", unit: "buc", quantity: 1, priceCents: 78000 },
  { name: "Montaj instalație", kind: "labor", unit: "ore", quantity: 12, priceCents: 12000 },
];
const currency = (cents: number) => new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(cents / 100);

export default function EcosystemPreview() {
  const [completed, setCompleted] = useState<EcosystemStepId[]>(["client", "work"]);
  const [selected, setSelected] = useState<EcosystemStepId>("estimate");
  const [enabled, setEnabled] = useState<OrbyvenModuleId[]>(["overview", "leads", "tasks", "estimates"]);
  const [lines, setLines] = useState<PreviewLine[]>(SAMPLE_LINES);
  const [offerAccepted, setOfferAccepted] = useState(false);
  const [notice, setNotice] = useState("");

  const total = useMemo(() => lines.reduce((sum, row) => sum + Math.round(row.quantity * row.priceCents), 0), [lines]);
  const materialTotal = useMemo(() => lines.filter((row) => row.kind === "material").reduce((sum, row) => sum + Math.round(row.quantity * row.priceCents), 0), [lines]);
  const selectedStep = ECOSYSTEM_STEPS.find((step) => step.id === selected)!;
  const prerequisites = unmetSteps(selected, completed);
  const hasModules = selectedStep.existingModules.every((id) => enabled.includes(id));
  const mayComplete = selectedStep.implementation === "available" || selectedStep.implementation === "prototype";
  const canMark = mayComplete && hasModules && prerequisites.length === 0 && (selected !== "offer" || offerAccepted);

  const editQuantity = (index: number, quantity: number) => {
    setLines((current) => current.map((line, at) => at === index ? { ...line, quantity: Math.max(0, Math.min(100000, Number.isFinite(quantity) ? quantity : 0)) } : line));
    setCompleted((current) => current.filter((id) => !["estimate", "materials", "offer", "invoice", "efactura"].includes(id)));
    setOfferAccepted(false);
  };
  const toggleModule = (id: OrbyvenModuleId) => setEnabled((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
  );
  const stepName = (id: EcosystemStepId) => ECOSYSTEM_STEPS.find((step) => step.id === id)?.title ?? id;

  return (
    <main className="relative min-h-screen bg-[#070b16] px-4 py-7 text-[#eef4ff] sm:px-8">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse 48% 42% at 9% 13%,rgba(33,81,225,0.23),transparent 82%),radial-gradient(ellipse 44% 46% at 100% 68%,rgba(83,48,195,0.2),transparent 83%)" }} />
      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[10px] font-bold tracking-[0.24em] text-[#92a8ef]">ORBYVEN / ECOSYSTEM LAB</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">O lucrare. Un singur ecosistem.</h1><p className="mt-2 text-sm text-[#a4b4d4]">Preview local · exemplu fictiv · fără date Supabase sau documente fiscale emise.</p></div>
          <span className="rounded-full border border-amber-300/35 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-200">DEV ONLY · NU ESTE LIVE</span>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[265px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-white/10 bg-[#111c31]/90 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9eacca]">Fluxul unei lucrări</p>
            <div className="mt-4 grid gap-2">
              {ECOSYSTEM_STEPS.map((step, index) => {
                const done = completed.includes(step.id);
                const active = selected === step.id;
                return <button key={step.id} type="button" onClick={() => { setSelected(step.id); setNotice(""); }} aria-current={active ? "step" : undefined}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${active ? "border-[#7894fa]/50 bg-[#294175]/55" : "border-transparent bg-[#17243a]/45 hover:border-white/10"}`}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-400/20 text-emerald-300" : "bg-[#293955] text-[#aebfe4]"}`}>{done ? "✓" : index + 1}</span>
                  <span className="min-w-0"><span className="block text-[13px] font-semibold">{step.title}</span><span className="mt-1 block text-[10px] text-[#9caed0]">{step.implementation === "available" ? "Modul existent" : step.implementation === "prototype" ? "Prototip local" : step.implementation === "regulated" ? "Integrare fiscală viitoare" : "În plan"}</span></span>
                </button>;
              })}
            </div>
            <button type="button" onClick={() => { setCompleted(["client", "work"]); setLines(SAMPLE_LINES); setOfferAccepted(false); setSelected("estimate"); setNotice(""); }} className="mt-5 w-full rounded-xl border border-white/15 px-3 py-2.5 text-xs text-[#bdc9e8] hover:bg-white/5">Repornește demonstrația ↺</button>
          </aside>

          <div className="grid content-start gap-3">
            <section className="rounded-2xl border border-white/10 bg-[#101b30]/90 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#91a5d1]">PASUL SELECTAT</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{selectedStep.title}</h2><p className="mt-2 text-sm text-[#a7b9d8]">{selectedStep.description}</p></div>
                <span className="rounded-lg border border-[#7c8fff]/25 bg-[#738cfb]/10 px-3 py-1.5 text-xs text-[#afc0ff]">{selectedStep.implementation === "available" ? "Existent" : selectedStep.implementation === "prototype" ? "Simulare" : "Neimplementat"}</span></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-[#0b1529] p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-[#93a7cb]">Depinde de</p><p className="mt-2 text-[13px]">{selectedStep.dependsOn.length ? selectedStep.dependsOn.map(stepName).join(" · ") : "Niciun pas anterior"}</p>{prerequisites.length ? <p className="mt-2 text-xs text-amber-200">Mai întâi: {prerequisites.map(stepName).join(", ")}</p> : <p className="mt-2 text-xs text-emerald-300">Pașii anteriori sunt pregătiți.</p>}</div>
                <div className="rounded-xl border border-white/10 bg-[#0b1529] p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-[#93a7cb]">Module necesare în flux</p><p className="mt-2 text-[13px]">{selectedStep.existingModules.length ? selectedStep.existingModules.map((id) => ORBYVEN_MODULES.find((module) => module.id === id)?.shortName).join(" · ") : "Modul fiscal viitor"}</p>{!hasModules && <p className="mt-2 text-xs text-amber-200">Activează modulele necesare în demo.</p>}</div>
              </div>
              {selectedStep.releaseGate && <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-xs text-amber-100"><strong>Condiție de lansare:</strong> {selectedStep.releaseGate}</p>}
              {selected === "offer" && <label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={offerAccepted} onChange={(e) => setOfferAccepted(e.target.checked)} /> Clientul a acceptat explicit oferta (simulare)</label>}
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" disabled={!canMark || completed.includes(selected)} onClick={() => setCompleted((current) => [...current, selected])}
                  className="rounded-xl bg-[#698dff] px-4 py-2.5 text-xs font-semibold text-[#071020] disabled:cursor-not-allowed disabled:opacity-40">{completed.includes(selected) ? "Pas demonstrat ✓" : "Marchează pasul în demo"}</button>
                {selected === "invoice" || selected === "efactura" ? <span className="self-center text-xs text-amber-200">Emiterea și transmiterea sunt intenționat dezactivate.</span> : null}
              </div>
              {notice && <p role="status" className="mt-3 text-xs text-amber-200">{notice}</p>}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#101b30]/90 p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9bafd3]">DEVIZ → NECESAR MATERIALE</p><h3 className="mt-1 text-lg font-semibold">Instalație termică · exemplu fictiv</h3></div><span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#aebddd]">RON · fără TVA în exemplu</span></div>
              <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[525px] text-left text-xs"><thead className="border-b border-white/10 text-[#8fa5cc]"><tr><th className="pb-3">Poziție</th><th className="pb-3">Tip</th><th className="pb-3">Cantitate</th><th className="pb-3 text-right">Preț / unitate</th><th className="pb-3 text-right">Total</th></tr></thead><tbody>{lines.map((line,index)=><tr key={line.name} className="border-b border-white/[0.06]"><td className="py-3 font-medium">{line.name}</td><td className="text-[#adc0df]">{line.kind === "material" ? "Material" : "Manoperă"}</td><td><input aria-label={"Cantitate " + line.name} type="number" step="0.5" min="0" max="100000" value={line.quantity} onChange={e=>editQuantity(index, Number(e.target.value))} className="w-20 rounded-lg border border-white/15 bg-[#0b1529] px-2 py-1.5 text-white outline-none focus:border-[#738cfb]"/> {line.unit}</td><td className="text-right">{currency(line.priceCents)}</td><td className="text-right font-semibold">{currency(Math.round(line.quantity * line.priceCents))}</td></tr>)}</tbody></table></div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-[#0b1529] px-4 py-3 text-xs"><p className="text-[#98abcb]">Necesar materiale (fără manoperă)</p><p className="mt-1 text-xl font-semibold">{currency(materialTotal)}</p></div><div className="rounded-xl bg-[#0b1529] px-4 py-3 text-xs"><p className="text-[#98abcb]">Total comercial demo, fără TVA</p><p className="mt-1 text-xl font-semibold">{currency(total)}</p></div></div>
              <p className="mt-3 text-[11px] leading-5 text-[#9baed0]">Materialele provin din liniile marcate explicit „material”; în baza actuală a devizelor această clasificare încă nu există. Exemplul este doar un prototip local.</p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#101b30]/90 p-5 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#92a9d2]">DEPENDENȚE MODULE</p><h3 className="mt-2 text-lg font-semibold">Activează un modul și vezi ce îl completează</h3><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{ORBYVEN_MODULES.filter(module=>module.id!=="overview").map(module=>{const missing=missingRecommendedModules(module.id,enabled);return <button type="button" key={module.id} onClick={()=>toggleModule(module.id)} className={`rounded-xl border p-3 text-left transition ${enabled.includes(module.id)?"border-[#7894fa]/40 bg-[#293d69]/35":"border-white/10 bg-[#0b1529] hover:border-[#798cf5]/35"}`}><span className="flex justify-between gap-2 text-xs font-semibold"><span>{module.name}</span><span className={enabled.includes(module.id)?"text-emerald-300":"text-[#9aabc9]"}>{enabled.includes(module.id)?"Activ":"Inactiv"}</span></span><span className="mt-2 block text-[10px] leading-4 text-[#aab9d5]">{missing.length?"Recomandate: "+missing.map(id=>ORBYVEN_MODULES.find(item=>item.id===id)?.shortName).join(", "):"Dependențe recomandate îndeplinite."}</span></button>})}</div><p className="mt-3 text-[11px] text-[#a4b4d2]">Recomandările nu obligă activarea unui modul opțional. În fluxul comercial, fiecare pas verifică explicit precondițiile sale.</p></section>
          </div>
        </div>
      </div>
    </main>
  );
}
