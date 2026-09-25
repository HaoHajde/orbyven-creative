"use client";

import {
  createEstimate,
  deleteEstimate,
  listEstimateClients,
  listEstimateItems,
  listEstimates,
  listEstimateTasks,
  setEstimateStatus,
  type Estimate,
  type EstimateItem,
  type EstimateLink,
  type EstimateStatus,
  type EstimateTaskLink,
} from "@/lib/modules/estimates";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import { useWorkspaceRecordFocus } from "@/components/modules/useWorkspaceRecordFocus";
import CommercialWorkflowPanel from "@/components/modules/CommercialWorkflowPanel";
import MaterialsLibraryPanel from "@/components/modules/MaterialsLibraryPanel";
import EstimateProfitabilityPanel from "@/components/modules/EstimateProfitabilityPanel";
import { addRequirementsFromRecipe } from "@/lib/ecosystem/actions";
import {
  loadMaterialLibrary,recipeEstimatePreview,
  type MaterialLibrary,
} from "@/lib/modules/materials-catalog";
import { Field, ModuleEmpty, ModuleError, ModuleHeader, ModuleMetric, moduleInputClass } from "@/components/modules/ModuleKit";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Props = {
  organizationId: string;
  locale: string;
  role: OrbyvenWorkspace["membership"]["role"];
  enabledModules: OrbyvenModuleId[];
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
  initialCreate?: boolean;
  initialRecordId?: string;
  initialClientId?: string;
  initialTaskId?: string;
};

type DraftLine = { key: string; description: string; quantity: string; price: string };
type FormState = {
  title: string;
  clientId: string;
  taskId: string;
  validUntil: string;
  taxRate: string;
  discount: string;
  notes: string;
  plannedLabor: string;
  otherCosts: string;
};

const emptyForm: FormState = { title: "", clientId: "", taskId: "", validUntil: "", taxRate: "", discount: "", notes: "", plannedLabor: "", otherCosts: "" };
const statusLabels: Record<EstimateStatus, string> = {
  draft: "Draft",
  sent: "Trimisă",
  accepted: "Acceptată",
  rejected: "Respinsă",
  expired: "Expirată",
};

function newLine(): DraftLine {
  return { key: crypto.randomUUID(), description: "", quantity: "1", price: "" };
}

function formatMoney(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: currency || "RON", maximumFractionDigits: 2 }).format((cents || 0) / 100);
}

export default function EstimatesModule({
  organizationId, locale, role, enabledModules, onOpenModule, initialCreate = false, initialRecordId,
  initialClientId, initialTaskId,
}: Props) {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [clients, setClients] = useState<EstimateLink[]>([]);
  const [tasks, setTasks] = useState<EstimateTaskLink[]>([]);
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialRecordId ?? null);
  const [createOpen, setCreateOpen] = useState(initialCreate && role !== "viewer");
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    clientId: initialClientId ?? "",
    taskId: initialTaskId ?? "",
  }));
  const [lines, setLines] = useState<DraftLine[]>(() => [newLine()]);
  const [library,setLibrary]=useState<MaterialLibrary>({materials:[],recipes:[],ingredients:[]});
  const [recipeId,setRecipeId]=useState("");
  const [recipeQty,setRecipeQty]=useState("1");
  const [recipeSale,setRecipeSale]=useState("");
  const [recipeLines,setRecipeLines]=useState<Record<string,string>>({});
  const [revisionSource,setRevisionSource]=useState<string|null>(null);
  const [profitRefresh,setProfitRefresh]=useState(0);
  const [recipeWarning,setRecipeWarning]=useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canWrite = role !== "viewer";
  const canDelete = role === "owner" || role === "admin" || role === "manager";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextEstimates, nextClients, nextTasks, nextLibrary] = await Promise.all([
        listEstimates(organizationId),
        listEstimateClients(organizationId),
        listEstimateTasks(organizationId),
        loadMaterialLibrary(organizationId),
      ]);
      setEstimates(nextEstimates);
      setClients(nextClients);
      setTasks(nextTasks);
      setLibrary(nextLibrary);
      if (initialCreate && initialTaskId) {
        const task = nextTasks.find((item) => item.id === initialTaskId);
        if (task) setForm((current) => ({ ...current, title: current.title || task.title, clientId: task.client_id || current.clientId }));
      }
      setSelectedId((current) => current && nextEstimates.some((item) => item.id === current) ? current : nextEstimates[0]?.id ?? null);
    } catch (loadError) {
      console.error(loadError);
      setError("Ofertele nu au putut fi încărcate.");
    } finally {
      setLoading(false);
    }
  }, [organizationId, initialCreate, initialTaskId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void listEstimateItems(organizationId, selectedId)
        .then((nextItems) => { if (active) setItems(nextItems); })
        .catch((itemError) => {
          console.error(itemError);
          if (active) setError("Pozițiile devizului nu au putut fi încărcate.");
        });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [organizationId, selectedId]);

  const selected = useMemo(() => estimates.find((estimate) => estimate.id === selectedId) ?? null, [estimates, selectedId]);
  useWorkspaceRecordFocus(initialRecordId, selectedId, loading);
  const clientById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);

  const refreshLibrary=async()=>{setLibrary(await loadMaterialLibrary(organizationId));};
  const addRecipeLine=()=>{
    if(!recipeId)return;
    try{
      const preview=recipeEstimatePreview(recipeId,Number(recipeQty),Number(recipeSale),library);
      if(library.ingredients.filter(item=>item.recipe_id===recipeId).length===0)
        throw new Error("Adaugă materiale în rețetă înainte să pregătești devizul.");
      const line={key:crypto.randomUUID(),description:preview.description,quantity:String(preview.quantity),price:String(preview.unitPriceLei)};
      setLines(current=>current.length===1&&!current[0].description.trim()?[line]:[...current,line]);
      setRecipeLines(current=>({...current,[line.key]:recipeId}));
      setRecipeWarning("");
      if(!form.title.trim())setForm(current=>({...current,title:preview.description}));
    }catch(reason){setRecipeWarning(reason instanceof Error?reason.message:"Datele rețetei nu sunt valide.");}
  };
  const startRevision=()=>{
    if(!selected||!canWrite||!items.length)return;
    const root=selected.source_estimate_id||selected.id;
    setRevisionSource(root);
    setForm({
      title:selected.title,clientId:selected.client_id||"",taskId:selected.task_id||"",
      validUntil:selected.valid_until||"",taxRate:selected.tax_rate===null?"":String(selected.tax_rate),
      discount:String(selected.discount_cents/100),notes:selected.notes||"",
      plannedLabor:String(selected.planned_labor_cents/100),otherCosts:String(selected.other_cost_cents/100),
    });
    setLines(items.map(item=>({key:crypto.randomUUID(),description:item.description,quantity:String(item.quantity),price:String(item.unit_price_cents/100)})));
    setRecipeLines({});
    setCreateOpen(true);
    setRecipeWarning("Revizie nouă: documentele și necesarul original rămân intacte. Verifică materialele și reaplică rețetele noii versiuni.");
    window.scrollTo({top:0,behavior:"smooth"});
  };
  const chooseTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    setForm((current) => ({
      ...current,
      taskId,
      clientId: task?.client_id || current.clientId,
      title: !current.title.trim() && task ? task.title : current.title,
    }));
  };

  const metrics = useMemo(() => {
    const accepted = estimates.filter((item) => item.status === "accepted");
    return {
      total: estimates.length,
      waiting: estimates.filter((item) => item.status === "sent").length,
      accepted: accepted.length,
      acceptedValue: accepted.reduce((sum, item) => sum + item.total_cents, 0),
    };
  }, [estimates]);

  const previewTotal = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.price) || 0), 0);
    const taxable = Math.max(0, subtotal - Math.max(0, Number(form.discount) || 0));
    return taxable * (1 + Math.max(0, Math.min(100, Number(form.taxRate) || 0)) / 100);
  }, [form.discount, form.taxRate, lines]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || saving) return;
    setSaving(true);
    setError("");
    try {
      const preparedLines=lines.filter(line=>line.description.trim()&&Number(line.quantity)>0);
      const recipeLaborCents=preparedLines.reduce((sum,line)=>{
        const recipe=library.recipes.find(item=>item.id===recipeLines[line.key]);
        return sum+(recipe?Math.round(recipe.labor_cost_cents*Number(line.quantity)):0);
      },0);
      if(!Number.isFinite(recipeLaborCents)||recipeLaborCents<0)throw new Error("Costul manoperei nu este valid.");
      const created = await createEstimate(organizationId, {
        title: form.title,
        clientId: form.clientId || null,
        taskId: form.taskId || null,
        validUntil: form.validUntil || null,
        taxRate: form.taxRate ? Number(form.taxRate) : null,
        discountLei: form.discount ? Number(form.discount) : 0,
        notes: form.notes,
        plannedLaborLei: form.plannedLabor!==""?Number(form.plannedLabor):recipeLaborCents/100,
        otherCostLei: form.otherCosts!==""?Number(form.otherCosts):0,
        sourceEstimateId: revisionSource,
        items: preparedLines.map((line) => ({ description: line.description, quantity: Number(line.quantity), unitPriceLei: Number(line.price) })),
      });
      setEstimates((current) => [created, ...current]);
      setSelectedId(created.id);
      const savedItems=await listEstimateItems(organizationId,created.id);
      setItems(savedItems);
      setCreateOpen(false);
      setForm(emptyForm);
      setLines([newLine()]);
      setRevisionSource(null);
      setRecipeLines({});
      const failures:string[]=[];
      for(let index=0;index<preparedLines.length;index++){
        const recipe=recipeLines[preparedLines[index].key],item=savedItems[index];
        if(recipe&&item){
          try{await addRequirementsFromRecipe(organizationId,created.id,item.id,recipe);}
          catch(reason){failures.push(preparedLines[index].description+" — "+(reason instanceof Error?reason.message:"Materiale negenerate"));}
        }
      }
      if(failures.length){
        setError("Devizul a fost salvat, dar unele materiale nu au fost generate. Deschide «Circuitul devizului» și aplică rețeta: "+failures.join("; "));
      }else if(Object.keys(recipeLines).length){setRecipeWarning("Deviz și necesar generate; verifică marja din detaliile devizului.");}
      setProfitRefresh(current=>current+1);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Oferta nu a putut fi creată.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status: EstimateStatus) => {
    if (!selected || !canWrite || saving) return;
    setSaving(true);
    setError("");
    try {
      const next = await setEstimateStatus(organizationId, selected.id, status);
      setEstimates((current) => current.map((item) => item.id === next.id ? next : item));
    } catch (statusError) {
      console.error(statusError);
      setError("Statusul ofertei nu a putut fi actualizat.");
    } finally {
      setSaving(false);
    }
  };

  const removeSelected = async () => {
    if (!selected || !canDelete || saving || !window.confirm(`Ștergi ${selected.reference}?`)) return;
    setSaving(true);
    try {
      await deleteEstimate(organizationId, selected.id);
      const next = estimates.filter((item) => item.id !== selected.id);
      setEstimates(next);
      setSelectedId(next[0]?.id ?? null);
      setItems([]);
    } catch (deleteError) {
      console.error(deleteError);
      setError("Oferta nu a putut fi ștearsă.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pb-24 text-sm text-[var(--muted)]">Se încarcă ofertele…</div>;

  return (
    <div className="pb-24 md:pb-8">
      <ModuleHeader
        eyebrow="Sales · Oferte & devize"
        title="Oferte"
        description="Construiești devizul lângă client și lucrare, apoi urmărești dacă a fost trimis, acceptat sau respins."
        action={canWrite ? <button type="button" onClick={() => {if(!createOpen){setRevisionSource(null);setForm(emptyForm);setLines([newLine()]);setRecipeLines({});}setCreateOpen(current=>!current);}} className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--button)] px-5 text-sm font-semibold text-[var(--button-text)]">{createOpen ? "Închide" : "+ Ofertă nouă"}</button> : null}
      />
      <div className="mt-8"><ModuleError message={error} /></div>

      <section className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ModuleMetric label="Total" value={String(metrics.total)} note="devize în workspace" />
        <ModuleMetric label="Așteaptă răspuns" value={String(metrics.waiting)} note="status trimisă" />
        <ModuleMetric label="Acceptate" value={String(metrics.accepted)} note="confirmate de client" />
        <ModuleMetric label="Valoare acceptată" value={formatMoney(metrics.acceptedValue, "RON", locale)} note="total orientativ" />
      </section>

      <MaterialsLibraryPanel organizationId={organizationId} role={role} library={library} onChanged={refreshLibrary} />

      {createOpen && canWrite ? (
        <form onSubmit={handleCreate} className="mt-5 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
          {revisionSource&&<p className="mb-4 rounded-[12px] border border-[var(--accent)] bg-[var(--accent-soft)] p-3 text-xs font-semibold">Revizie nouă · devizul și oferta anterioară nu sunt suprascrise.</p>}
          {recipeWarning&&<p role="status" className="mb-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs">{recipeWarning}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titlu ofertă *"><input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} className={moduleInputClass} placeholder="Ex. Înlocuire centrală + montaj" /></Field>
            <Field label="Client"><select value={form.clientId} disabled={Boolean(tasks.find((task) => task.id === form.taskId)?.client_id)} onChange={(e) => setForm((current) => ({ ...current, clientId: e.target.value }))} className={`${moduleInputClass} disabled:opacity-60`}><option value="">Fără client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.company ? ` · ${client.company}` : ""}</option>)}</select></Field>
            <Field label="Lucrare"><select value={form.taskId} onChange={(e) => chooseTask(e.target.value)} className={moduleInputClass}><option value="">Fără lucrare</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></Field>
            <Field label="Valabil până la"><input type="date" value={form.validUntil} onChange={(e) => setForm((c) => ({ ...c, validUntil: e.target.value }))} className={moduleInputClass} /></Field>
            <Field label="Discount (lei)"><input type="number" min="0" step="0.01" value={form.discount} onChange={(e) => setForm((c) => ({ ...c, discount: e.target.value }))} className={moduleInputClass} placeholder="0" /></Field>
            <Field label="Taxă / TVA (%) opțional"><input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(e) => setForm((c) => ({ ...c, taxRate: e.target.value }))} className={moduleInputClass} placeholder="0" /></Field>
            <Field label="Manoperă estimată (lei)"><input type="number" min="0" step="0.01" value={form.plannedLabor} onChange={(e) => setForm(c=>({...c,plannedLabor:e.target.value}))} className={moduleInputClass} placeholder="Din rețete dacă lași gol" /></Field>
            <Field label="Alte costuri estimate (lei)"><input type="number" min="0" step="0.01" value={form.otherCosts} onChange={(e) => setForm(c=>({...c,otherCosts:e.target.value}))} className={moduleInputClass} placeholder="Transport, deplasare etc." /></Field>
          </div>

          {library.recipes.length>0&&<section aria-label="Deviz din rețetă" className="mt-5 rounded-[16px] border border-[var(--border-strong)] bg-[var(--surface-2)]/70 p-4">
            <p className="text-xs font-semibold">Deviz inteligent · din biblioteca firmei</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Adaugi o poziție calculată; materialele se generează la salvarea devizului.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_90px_140px_auto] sm:items-end">
              <Field label="Rețetă"><select value={recipeId} onChange={e=>setRecipeId(e.target.value)} className={moduleInputClass}><option value="">Alege rețeta</option>{library.recipes.map(recipe=><option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}</select></Field>
              <Field label="Cantitate"><input type="number" min="0.001" step="any" value={recipeQty} onChange={e=>setRecipeQty(e.target.value)} className={moduleInputClass}/></Field>
              <Field label="Preț vânzare / unitate"><input type="number" min="0" step="0.01" value={recipeSale} onChange={e=>setRecipeSale(e.target.value)} className={moduleInputClass} placeholder="lei"/></Field>
              <button type="button" disabled={!recipeId||!recipeSale} onClick={addRecipeLine} className="h-11 rounded-[10px] border border-[var(--accent)] bg-[var(--accent-soft)] px-3 text-xs font-semibold disabled:opacity-40">+ Adaugă</button>
            </div>
          </section>}

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">Poziții deviz</p><button type="button" onClick={() => setLines((current) => [...current, newLine()])} className="text-xs font-semibold">+ Adaugă poziție</button></div>
            <div className="mt-3 space-y-3">
              {lines.map((line, index) => (
                <div key={line.key} className="grid gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--bg)] p-4 sm:grid-cols-[1fr_100px_150px_auto] sm:items-end">
                  <Field label={`Descriere ${index + 1}`}><input value={line.description} onChange={(e) => setLines((current) => current.map((item) => item.key === line.key ? { ...item, description: e.target.value } : item))} className={moduleInputClass} placeholder="Material / manoperă" /></Field>
                  <Field label="Cantitate"><input type="number" min="0.001" step="0.001" value={line.quantity} onChange={(e) => setLines((current) => current.map((item) => item.key === line.key ? { ...item, quantity: e.target.value } : item))} className={moduleInputClass} /></Field>
                  <Field label="Preț / unitate"><input type="number" min="0" step="0.01" value={line.price} onChange={(e) => setLines((current) => current.map((item) => item.key === line.key ? { ...item, price: e.target.value } : item))} className={moduleInputClass} placeholder="lei" /></Field>
                  <button type="button" disabled={lines.length === 1} onClick={() => {setLines(current=>current.filter(item=>item.key!==line.key));setRecipeLines(current=>{const next={...current};delete next[line.key];return next;});}} className="h-11 rounded-full border border-[var(--border)] px-4 text-xs disabled:opacity-30">Șterge</button>
                </div>
              ))}
            </div>
          </div>

          <Field label="Note" className="mt-5"><textarea value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} className={`${moduleInputClass} min-h-24 resize-y`} /></Field>
          <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center"><div><p className="text-xs text-[var(--muted)]">Total estimat</p><p className="mt-1 text-2xl font-semibold">{new Intl.NumberFormat(locale, { style: "currency", currency: "RON" }).format(previewTotal)}</p></div><button disabled={saving} className="h-12 rounded-full bg-[var(--button)] px-7 text-sm font-semibold text-[var(--button-text)] disabled:opacity-50">{saving ? "Se salvează…" : "Creează devizul"}</button></div>
        </form>
      ) : null}

      <section className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Toate ofertele</h2><span className="text-xs text-[var(--muted)]">{estimates.length}</span></div>
          {estimates.length ? <div className="space-y-2">{estimates.map((estimate) => (
            <button key={estimate.id} type="button" onClick={() => { setSelectedId(estimate.id); setItems([]); }} className={`w-full rounded-[18px] border p-4 text-left ${selectedId === estimate.id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--bg)]"}`}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{estimate.title}</p><p className="mt-1 text-[11px] text-[var(--muted)]">{estimate.reference} · {clientById.get(estimate.client_id || "")?.name || "Fără client"}</p></div><span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[10px] font-semibold">{statusLabels[estimate.status]}</span></div>
              <p className="mt-4 text-lg font-semibold">{formatMoney(estimate.total_cents, estimate.currency, locale)}</p>
            </button>
          ))}</div> : <ModuleEmpty title="Nicio ofertă încă" description="Prima ofertă poate porni direct de la un client și o lucrare existente." />}
        </div>

        <div data-workspace-record-focus={initialRecordId && selected?.id === initialRecordId ? "true" : undefined} className="scroll-mt-28 rounded-[28px] border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-7">
          {selected ? <>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">{selected.reference}</p><h2 className="mt-3 text-[30px] font-semibold tracking-[-0.045em]">{selected.title}</h2><p className="mt-2 text-sm text-[var(--muted)]">{clientById.get(selected.client_id || "")?.name || "Fără client"}{selected.task_id ? ` · ${taskById.get(selected.task_id)?.title || "Lucrare"}` : ""}</p></div><p className="text-[30px] font-semibold tracking-[-0.05em]">{formatMoney(selected.total_cents, selected.currency, locale)}</p></div>
            <div className="mt-6 grid grid-cols-3 gap-3"><ModuleMetric label="Status" value={statusLabels[selected.status]} /><ModuleMetric label="Poziții" value={String(items.length)} /><ModuleMetric label="Taxă" value={selected.tax_rate === null ? "—" : `${selected.tax_rate}%`} /></div>
            <div className="mt-6 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg)]">{items.length ? items.map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[var(--border)] px-4 py-3 last:border-b-0"><div><p className="text-sm font-medium">{item.description}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.quantity} × {formatMoney(item.unit_price_cents, selected.currency, locale)}</p></div><p className="text-sm font-semibold">{formatMoney(Math.round(item.quantity * item.unit_price_cents), selected.currency, locale)}</p></div>) : <p className="p-4 text-sm text-[var(--muted)]">Se încarcă pozițiile…</p>}</div>
            <CommercialWorkflowPanel key={selected.id} organizationId={organizationId} estimate={selected} items={items} locale={locale} role={role} onChanged={()=>setProfitRefresh(current=>current+1)} />
            {canDelete&&<EstimateProfitabilityPanel organizationId={organizationId} estimate={selected} locale={locale} refresh={profitRefresh} />}
            {canWrite&&items.length>0&&<button type="button" onClick={startRevision} className="mt-4 h-9 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-xs font-semibold">+ Creează revizie fără a modifica oferta anterioară</button>}
            {selected.source_estimate_id&&<p className="mt-3 text-[11px] text-[var(--muted)]">Revizie a devizului {estimates.find(item=>item.id===selected.source_estimate_id)?.reference||"inițial"}.</p>}
            {selected.notes ? <p className="mt-5 rounded-[18px] bg-[var(--bg)] p-4 text-sm leading-6 text-[var(--muted)]">{selected.notes}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {enabledModules.includes("leads") && selected.client_id && <button type="button" onClick={() => onOpenModule("leads", { recordId: selected.client_id! })} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">Deschide clientul ↗</button>}
              {enabledModules.includes("tasks") && selected.task_id && <button type="button" onClick={() => onOpenModule("tasks", { recordId: selected.task_id! })} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">Deschide lucrarea ↗</button>}
              {canWrite && enabledModules.includes("calendar") && (selected.client_id || selected.task_id) && <button type="button" onClick={() => onOpenModule("calendar", { create: true, clientId: selected.client_id ?? undefined, taskId: selected.task_id ?? undefined })} className="h-9 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)]">+ Programare</button>}
              {canDelete && enabledModules.includes("expenses") && <button type="button" onClick={() => onOpenModule("expenses", { create: true, clientId: selected.client_id ?? undefined, taskId: selected.task_id ?? undefined })} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">+ Cheltuială</button>}
            </div>
            {canWrite ? <div className="mt-6 flex flex-wrap gap-2">{(["draft", "sent", "accepted", "rejected"] as EstimateStatus[]).map((status) => <button key={status} type="button" disabled={saving || selected.status === status} onClick={() => void changeStatus(status)} className="h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold disabled:opacity-35">{statusLabels[status]}</button>)}{canDelete ? <button type="button" disabled={saving} onClick={() => void removeSelected()} className="h-10 rounded-full px-4 text-xs font-semibold text-red-500 disabled:opacity-35">Șterge</button> : null}</div> : null}
          </> : <ModuleEmpty title="Selectează o ofertă" description="Detaliile, pozițiile și statusul apar aici." />}
        </div>
      </section>
    </div>
  );
}
