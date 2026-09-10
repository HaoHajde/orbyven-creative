"use client";

import {
  addMaterialRequirement,
  applyMaterialRecipe,
  deleteMaterialRequirement,
  generateCommercialDocument,
  listActualExpensesForEstimate,
  listBudgetEntries,
  listCommercialDocuments,
  listMaterialRecipes,
  listMaterialRequirements,
  saveRequirementsAsRecipe,
  setCommercialDocumentStatus,
  setMaterialRequirementStatus,
  type BudgetEntry,
  type CommercialDocument,
  type CommercialDocumentStatus,
  type MaterialRecipe,
  type MaterialRequirement,
  type MaterialRequirementStatus,
  type WorkflowExpense,
} from "@/lib/modules/estimate-workflow";
import type { Estimate, EstimateItem } from "@/lib/modules/estimates";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import { Field, ModuleError, ModuleMetric, moduleInputClass } from "@/components/modules/ModuleKit";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Props = {
  organizationId: string;
  locale: string;
  role: OrbyvenWorkspace["membership"]["role"];
  estimate: Estimate;
  items: EstimateItem[];
};

type Step = "materials" | "offer" | "invoice" | "budget";
type MaterialForm = {
  description: string;
  quantity: string;
  unit: string;
  unitCost: string;
  vendor: string;
  estimateItemId: string;
};

const emptyMaterialForm: MaterialForm = {
  description: "",
  quantity: "1",
  unit: "buc",
  unitCost: "",
  vendor: "",
  estimateItemId: "",
};

const requirementStatusLabels: Record<MaterialRequirementStatus, string> = {
  planned: "Planificat",
  ordered: "Comandat",
  bought: "Cumpărat",
};

const documentStatusLabels: Record<CommercialDocumentStatus, string> = {
  draft: "Draft",
  sent: "Trimisă",
  accepted: "Acceptată",
  issued: "Emisă",
  paid: "Încasată",
  cancelled: "Anulată",
};

function money(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "RON",
    maximumFractionDigits: 2,
  }).format((Number(cents) || 0) / 100);
}

export default function EstimateWorkflowPanel({
  organizationId,
  locale,
  role,
  estimate,
  items,
}: Props) {
  const [activeStep, setActiveStep] = useState<Step>("materials");
  const [recipes, setRecipes] = useState<MaterialRecipe[]>([]);
  const [requirements, setRequirements] = useState<MaterialRequirement[]>([]);
  const [documents, setDocuments] = useState<CommercialDocument[]>([]);
  const [budget, setBudget] = useState<BudgetEntry[]>([]);
  const [actualExpenses, setActualExpenses] = useState<WorkflowExpense[]>([]);
  const [materialForm, setMaterialForm] = useState<MaterialForm>(emptyMaterialForm);
  const [recipeId, setRecipeId] = useState("");
  const [recipeMultiplier, setRecipeMultiplier] = useState("1");
  const [recipeName, setRecipeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const canWrite = role !== "viewer";
  const canDelete = role === "owner" || role === "admin" || role === "manager";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextRecipes, nextRequirements, nextDocuments, nextBudget, nextExpenses] =
        await Promise.all([
          listMaterialRecipes(organizationId),
          listMaterialRequirements(organizationId, estimate.id),
          listCommercialDocuments(organizationId, estimate.id),
          listBudgetEntries(organizationId, estimate.id),
          listActualExpensesForEstimate(organizationId, estimate.id, estimate.task_id),
        ]);
      setRecipes(nextRecipes);
      setRequirements(nextRequirements);
      setDocuments(nextDocuments);
      setBudget(nextBudget);
      setActualExpenses(nextExpenses);
      setRecipeId((current) =>
        current && nextRecipes.some((recipe) => recipe.id === current)
          ? current
          : nextRecipes[0]?.id ?? ""
      );
    } catch (loadError) {
      console.error(loadError);
      setError("Automatizarea devizului nu a putut fi încărcată.");
    } finally {
      setLoading(false);
    }
  }, [estimate.id, estimate.task_id, organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const run = async (key: string, action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(key);
    setError("");
    try {
      await action();
      await load();
    } catch (actionError) {
      console.error(actionError);
      setError(actionError instanceof Error ? actionError.message : "Acțiunea nu a putut fi finalizată.");
    } finally {
      setBusy("");
    }
  };

  const offer = documents.find((item) => item.document_type === "offer") ?? null;
  const invoice = documents.find((item) => item.document_type === "invoice_draft") ?? null;

  const materialCost = useMemo(
    () => requirements.reduce((sum, item) => sum + Math.round(Number(item.quantity) * Number(item.unit_cost_cents)), 0),
    [requirements]
  );
  const plannedIncome = budget.find((item) => item.source_type === "invoice")?.amount_cents ?? 0;
  const plannedMaterials = budget.find((item) => item.source_type === "materials")?.amount_cents ?? materialCost;
  const actualCost = actualExpenses.reduce((sum, item) => sum + Number(item.amount_cents), 0);
  const estimatedProfit = plannedIncome ? plannedIncome - plannedMaterials : estimate.total_cents - plannedMaterials;
  const liveProfit = plannedIncome ? plannedIncome - actualCost : estimate.total_cents - actualCost;

  const steps: { id: Step; label: string; done: boolean }[] = [
    { id: "materials", label: "Necesar", done: requirements.length > 0 },
    { id: "offer", label: "Ofertă", done: Boolean(offer) },
    { id: "invoice", label: "Factură", done: Boolean(invoice) },
    { id: "budget", label: "Buget", done: budget.length > 0 || actualExpenses.length > 0 },
  ];

  const nextAction = !requirements.length
    ? { step: "materials" as Step, title: "Adaugă necesarul de materiale", note: "Manual sau dintr-un șablon reutilizabil." }
    : !offer
      ? { step: "offer" as Step, title: "Generează oferta", note: "Datele vin direct din deviz, fără completare din nou." }
      : estimate.status !== "accepted"
        ? { step: "offer" as Step, title: "Așteaptă acceptarea devizului", note: "După acceptare se deblochează factura." }
        : !invoice
          ? { step: "invoice" as Step, title: "Pregătește factura", note: "Draftul preia automat clientul și valorile aprobate." }
          : { step: "budget" as Step, title: "Urmărește profitabilitatea", note: "Compară planul cu cheltuielile reale ale lucrării." };

  const addMaterial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite) return;
    await run("material", async () => {
      await addMaterialRequirement(organizationId, estimate.id, {
        description: materialForm.description,
        quantity: Number(materialForm.quantity),
        unit: materialForm.unit,
        unitCostLei: Number(materialForm.unitCost || 0),
        vendor: materialForm.vendor,
        estimateItemId: materialForm.estimateItemId || null,
      });
      setMaterialForm(emptyMaterialForm);
    });
  };

  if (loading) {
    return <div className="mt-5 rounded-[22px] border border-[var(--border)] bg-[var(--bg)] p-5 text-sm text-[var(--muted)]">Se pregătește fluxul inteligent al devizului…</div>;
  }

  return (
    <section className="mt-6 overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)]">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">Flux inteligent</p>
            <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.04em] sm:text-[26px]">Un deviz. Restul se leagă singur.</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2.5 text-[11px] font-semibold transition ${
                  activeStep === step.id
                    ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]"
                    : "border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${step.done ? "bg-[var(--accent)]" : "bg-current opacity-30"}`} />
                {step.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveStep(nextAction.step)}
          className="mt-5 flex w-full items-center justify-between gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--bg)] p-4 text-left transition hover:border-[var(--border-strong)]"
        >
          <span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">Următorul pas recomandat</span>
            <span className="mt-1 block text-sm font-semibold">{nextAction.title}</span>
            <span className="mt-1 block text-xs text-[var(--muted)]">{nextAction.note}</span>
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface)]">→</span>
        </button>

        <div className="mt-4"><ModuleError message={error} /></div>
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--bg)] p-4 sm:p-6">
        {activeStep === "materials" ? (
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h4 className="text-lg font-semibold">Necesar materiale</h4>
                <p className="mt-1 text-xs text-[var(--muted)]">Cost planificat: {money(materialCost, estimate.currency, locale)}</p>
              </div>
              {recipes.length && canWrite ? (
                <div className="flex flex-wrap items-end gap-2">
                  <label className="min-w-[170px] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
                    Șablon
                    <select value={recipeId} onChange={(event) => setRecipeId(event.target.value)} className={`${moduleInputClass} mt-1.5 h-10 py-0 text-xs`}>
                      {recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}
                    </select>
                  </label>
                  <label className="w-20 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
                    x
                    <input type="number" min="0.001" step="0.001" value={recipeMultiplier} onChange={(event) => setRecipeMultiplier(event.target.value)} className={`${moduleInputClass} mt-1.5 h-10 py-0 text-xs`} />
                  </label>
                  <button type="button" disabled={!recipeId || Boolean(busy)} onClick={() => void run("recipe", () => applyMaterialRecipe(organizationId, estimate.id, recipeId, Number(recipeMultiplier)))} className="h-10 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-35">Aplică</button>
                </div>
              ) : null}
            </div>

            {requirements.length ? (
              <div className="mt-4 space-y-2">
                {requirements.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.description}</p>
                      <p className="mt-1 text-[11px] text-[var(--muted)]">{item.quantity} {item.unit} · {money(item.unit_cost_cents, estimate.currency, locale)} / unitate{item.vendor ? ` · ${item.vendor}` : ""}</p>
                    </div>
                    {canWrite ? (
                      <select value={item.status} disabled={Boolean(busy)} onChange={(event) => void run(`status-${item.id}`, () => setMaterialRequirementStatus(organizationId, estimate.id, item.id, event.target.value as MaterialRequirementStatus))} className="h-9 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 text-[11px] font-semibold">
                        {(Object.keys(requirementStatusLabels) as MaterialRequirementStatus[]).map((status) => <option key={status} value={status}>{requirementStatusLabels[status]}</option>)}
                      </select>
                    ) : <span className="text-xs text-[var(--muted)]">{requirementStatusLabels[item.status]}</span>}
                    {canDelete ? <button type="button" disabled={Boolean(busy)} onClick={() => void run(`delete-${item.id}`, () => deleteMaterialRequirement(organizationId, estimate.id, item.id))} className="text-xs font-semibold text-red-500 disabled:opacity-35">Șterge</button> : null}
                  </div>
                ))}
              </div>
            ) : <p className="mt-4 rounded-[18px] border border-dashed border-[var(--border-strong)] p-5 text-sm text-[var(--muted)]">Nu ai materiale încă. Adaugă primul material sau folosește un șablon.</p>}

            {canWrite ? (
              <details className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <summary className="cursor-pointer text-sm font-semibold">+ Adaugă material manual</summary>
                <form onSubmit={addMaterial} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Material *"><input required value={materialForm.description} onChange={(event) => setMaterialForm((current) => ({ ...current, description: event.target.value }))} className={moduleInputClass} placeholder="Țeavă PPR 20 mm" /></Field>
                  <Field label="Cantitate *"><input required type="number" min="0.001" step="0.001" value={materialForm.quantity} onChange={(event) => setMaterialForm((current) => ({ ...current, quantity: event.target.value }))} className={moduleInputClass} /></Field>
                  <Field label="Unitate"><input value={materialForm.unit} onChange={(event) => setMaterialForm((current) => ({ ...current, unit: event.target.value }))} className={moduleInputClass} /></Field>
                  <Field label="Cost / unitate"><input type="number" min="0" step="0.01" value={materialForm.unitCost} onChange={(event) => setMaterialForm((current) => ({ ...current, unitCost: event.target.value }))} className={moduleInputClass} placeholder="lei" /></Field>
                  <Field label="Furnizor"><input value={materialForm.vendor} onChange={(event) => setMaterialForm((current) => ({ ...current, vendor: event.target.value }))} className={moduleInputClass} /></Field>
                  <Field label="Poziție deviz"><select value={materialForm.estimateItemId} onChange={(event) => setMaterialForm((current) => ({ ...current, estimateItemId: event.target.value }))} className={moduleInputClass}><option value="">General</option>{items.map((item) => <option key={item.id} value={item.id}>{item.description}</option>)}</select></Field>
                  <div className="sm:col-span-2 lg:col-span-3"><button disabled={Boolean(busy)} className="h-10 rounded-full bg-[var(--button)] px-5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-35">{busy === "material" ? "Se adaugă…" : "Adaugă în necesar"}</button></div>
                </form>
              </details>
            ) : null}

            {canWrite && requirements.length ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input value={recipeName} onChange={(event) => setRecipeName(event.target.value)} className="h-10 min-w-[210px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-xs outline-none" placeholder="Nume șablon reutilizabil" />
                <button type="button" disabled={!recipeName.trim() || Boolean(busy)} onClick={() => void run("save-recipe", async () => { await saveRequirementsAsRecipe(organizationId, estimate.id, recipeName); setRecipeName(""); })} className="h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold disabled:opacity-35">Salvează ca șablon</button>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeStep === "offer" ? (
          <div className="max-w-3xl">
            <h4 className="text-lg font-semibold">Oferta clientului</h4>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Clientul, lucrarea, pozițiile, discountul și taxele sunt preluate direct din deviz.</p>
            <div className="mt-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
              {offer ? <><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">{offer.reference}</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><p className="text-lg font-semibold">{offer.title}</p><p className="mt-1 text-xs text-[var(--muted)]">Status: {documentStatusLabels[offer.status]}</p></div><p className="text-xl font-semibold">{money(offer.total_cents, offer.currency, locale)}</p></div></> : <p className="text-sm text-[var(--muted)]">Oferta nu este generată încă.</p>}
              {canWrite ? <button type="button" disabled={Boolean(busy)} onClick={() => void run("offer", () => generateCommercialDocument(organizationId, estimate, items, "offer"))} className="mt-4 h-11 rounded-full bg-[var(--button)] px-5 text-xs font-semibold text-[var(--button-text)] disabled:opacity-35">{busy === "offer" ? "Se generează…" : offer ? "Actualizează oferta" : "Generează oferta"}</button> : null}
            </div>
            {estimate.status !== "accepted" ? <p className="mt-3 rounded-[16px] bg-[var(--surface)] p-3 text-xs text-[var(--muted)]">După ce clientul acceptă devizul, marchează-l „Acceptat” în partea de sus. Factura se va debloca automat.</p> : null}
          </div>
        ) : null}

        {activeStep === "invoice" ? (
          <div className="max-w-3xl">
            <h4 className="text-lg font-semibold">Factura</h4>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">ORBYVEN pregătește draftul comercial. Emiterea fiscală reală rămâne la integrarea furnizorului de facturare.</p>
            {estimate.status !== "accepted" ? (
              <div className="mt-4 rounded-[20px] border border-dashed border-[var(--border-strong)] p-5 text-sm text-[var(--muted)]">Factura este blocată până când devizul este acceptat.</div>
            ) : (
              <div className="mt-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                {invoice ? <><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">{invoice.reference}</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><p className="text-lg font-semibold">{invoice.title}</p><p className="mt-1 text-xs text-[var(--muted)]">Status: {documentStatusLabels[invoice.status]}</p></div><p className="text-xl font-semibold">{money(invoice.total_cents, invoice.currency, locale)}</p></div></> : <p className="text-sm text-[var(--muted)]">Poți pregăti factura dintr-un singur tap.</p>}
                {canWrite ? <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={Boolean(busy)} onClick={() => void run("invoice", () => generateCommercialDocument(organizationId, estimate, items, "invoice_draft"))} className="h-10 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-35">{invoice ? "Actualizează draftul" : "Pregătește factura"}</button>{invoice ? (["issued", "paid"] as CommercialDocumentStatus[]).map((status) => <button key={status} type="button" disabled={Boolean(busy) || invoice.status === status} onClick={() => void run(`invoice-${status}`, () => setCommercialDocumentStatus(organizationId, estimate.id, invoice.id, status))} className="h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold disabled:opacity-35">{documentStatusLabels[status]}</button>) : null}</div> : null}
              </div>
            )}
          </div>
        ) : null}

        {activeStep === "budget" ? (
          <div>
            <div className="flex items-end justify-between gap-4"><div><h4 className="text-lg font-semibold">Bugetul lucrării</h4><p className="mt-1 text-xs text-[var(--muted)]">Plan versus ce s-a întâmplat în realitate.</p></div><span className="text-xs text-[var(--muted)]">actualizat automat</span></div>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <ModuleMetric label="Venit" value={money(plannedIncome || estimate.total_cents, estimate.currency, locale)} note={invoice ? "din factură" : "din deviz"} />
              <ModuleMetric label="Materiale" value={money(plannedMaterials, estimate.currency, locale)} note="planificat" />
              <ModuleMetric label="Cheltuit real" value={money(actualCost, estimate.currency, locale)} note={`${actualExpenses.length} înregistrări`} />
              <ModuleMetric label="Rezultat" value={money(actualExpenses.length ? liveProfit : estimatedProfit, estimate.currency, locale)} note={actualExpenses.length ? "marjă curentă" : "marjă estimată"} />
            </div>
            {actualExpenses.length ? <div className="mt-4 space-y-2">{actualExpenses.slice(0, 5).map((expense) => <div key={expense.id} className="flex items-center justify-between gap-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3"><div className="min-w-0"><p className="truncate text-xs font-semibold">{expense.description}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(`${expense.occurred_on}T12:00:00`))}</p></div><p className="text-xs font-semibold">− {money(expense.amount_cents, expense.currency, locale)}</p></div>)}</div> : <p className="mt-4 rounded-[16px] border border-dashed border-[var(--border-strong)] p-4 text-xs text-[var(--muted)]">Cheltuielile legate de acest deviz vor apărea aici automat.</p>}
          </div>
        ) : null}
      </div>
    </section>
  );
}
