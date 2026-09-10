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
import {
  Field,
  ModuleError,
  ModuleMetric,
  moduleInputClass,
} from "@/components/modules/ModuleKit";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Props = {
  organizationId: string;
  locale: string;
  role: OrbyvenWorkspace["membership"]["role"];
  estimate: Estimate;
  items: EstimateItem[];
};

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

function formatMoney(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "RON",
    maximumFractionDigits: 2,
  }).format((Number(cents) || 0) / 100);
}

function StepBadge({ number, title, done }: { number: string; title: string; done?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold ${
        done
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]"
      }`}
    >
      <span>{number}</span>
      <span>{title}</span>
      {done ? <span aria-hidden="true">✓</span> : null}
    </div>
  );
}

export default function EstimateWorkflowPanel({
  organizationId,
  locale,
  role,
  estimate,
  items,
}: Props) {
  const [recipes, setRecipes] = useState<MaterialRecipe[]>([]);
  const [requirements, setRequirements] = useState<MaterialRequirement[]>([]);
  const [documents, setDocuments] = useState<CommercialDocument[]>([]);
  const [budget, setBudget] = useState<BudgetEntry[]>([]);
  const [actualExpenses, setActualExpenses] = useState<WorkflowExpense[]>([]);
  const [materialForm, setMaterialForm] = useState<MaterialForm>(emptyMaterialForm);
  const [recipeId, setRecipeId] = useState("");
  const [recipeMultiplier, setRecipeMultiplier] = useState("1");
  const [recipeEstimateItemId, setRecipeEstimateItemId] = useState("");
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
      const [nextRecipes, nextRequirements, nextDocuments, nextBudget, nextActualExpenses] =
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
      setActualExpenses(nextActualExpenses);
      setRecipeId((current) =>
        current && nextRecipes.some((recipe) => recipe.id === current)
          ? current
          : nextRecipes[0]?.id ?? ""
      );
    } catch (loadError) {
      console.error(loadError);
      setError("Fluxul automat al devizului nu a putut fi încărcat.");
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
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Acțiunea nu a putut fi finalizată."
      );
    } finally {
      setBusy("");
    }
  };

  const offer = documents.find((document) => document.document_type === "offer") ?? null;
  const invoice =
    documents.find((document) => document.document_type === "invoice_draft") ?? null;

  const materialCostCents = useMemo(
    () =>
      requirements.reduce(
        (sum, item) =>
          sum + Math.round(Number(item.quantity) * Number(item.unit_cost_cents)),
        0
      ),
    [requirements]
  );

  const plannedIncomeCents =
    budget.find((entry) => entry.source_type === "invoice")?.amount_cents ?? 0;
  const plannedMaterialCents =
    budget.find((entry) => entry.source_type === "materials")?.amount_cents ??
    materialCostCents;
  const actualExpenseCents = actualExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount_cents),
    0
  );
  const plannedMarginCents = plannedIncomeCents
    ? plannedIncomeCents - plannedMaterialCents
    : 0;
  const currentMarginCents = plannedIncomeCents
    ? plannedIncomeCents - actualExpenseCents
    : 0;

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

  const applyRecipe = async () => {
    if (!canWrite || !recipeId) return;
    await run("recipe", () =>
      applyMaterialRecipe(
        organizationId,
        estimate.id,
        recipeId,
        Number(recipeMultiplier),
        recipeEstimateItemId || null
      )
    );
  };

  const saveRecipe = async () => {
    if (!canWrite) return;
    await run("save-recipe", async () => {
      await saveRequirementsAsRecipe(organizationId, estimate.id, recipeName);
      setRecipeName("");
    });
  };

  const generateOffer = async () => {
    if (!canWrite) return;
    await run("offer", () =>
      generateCommercialDocument(organizationId, estimate, items, "offer")
    );
  };

  const generateInvoice = async () => {
    if (!canWrite) return;
    await run("invoice", () =>
      generateCommercialDocument(organizationId, estimate, items, "invoice_draft")
    );
  };

  const changeInvoiceStatus = async (status: CommercialDocumentStatus) => {
    if (!canWrite || !invoice) return;
    await run(`invoice-${status}`, () =>
      setCommercialDocumentStatus(
        organizationId,
        estimate.id,
        invoice.id,
        status
      )
    );
  };

  if (loading) {
    return (
      <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-[var(--bg)] p-5 text-sm text-[var(--muted)]">
        Se pregătește fluxul Deviz → Necesar → Ofertă → Factură → Buget…
      </div>
    );
  }

  return (
    <section className="mt-7 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
            Automatizare proiect
          </p>
          <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.04em]">
            Dintr-un singur deviz, fără reintroducere de date.
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Necesarul de materiale, oferta, draftul de factură și bugetul folosesc
            aceeași sursă de adevăr.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StepBadge number="1" title="Necesar" done={requirements.length > 0} />
          <StepBadge number="2" title="Ofertă" done={Boolean(offer)} />
          <StepBadge number="3" title="Factură" done={Boolean(invoice)} />
          <StepBadge number="4" title="Buget" done={budget.length > 0} />
        </div>
      </div>

      <div className="mt-5">
        <ModuleError message={error} />
      </div>

      <div className="mt-5 grid gap-4 2xl:grid-cols-2">
        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--bg)] p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
                01 · Necesar materiale
              </p>
              <h4 className="mt-2 text-lg font-semibold">Plug & play cu șabloane reutilizabile</h4>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Adaugi manual o singură dată, apoi salvezi necesarul ca rețetă pentru lucrările viitoare.
              </p>
            </div>
            <p className="text-lg font-semibold">
              {formatMoney(materialCostCents, estimate.currency, locale)}
            </p>
          </div>

          {canWrite ? (
            <>
              <div className="mt-5 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-xs font-semibold">Aplică un șablon</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Șablon">
                    <select
                      value={recipeId}
                      onChange={(event) => setRecipeId(event.target.value)}
                      className={moduleInputClass}
                    >
                      <option value="">Niciun șablon salvat</option>
                      {recipes.map((recipe) => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Multiplicator">
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={recipeMultiplier}
                      onChange={(event) => setRecipeMultiplier(event.target.value)}
                      className={moduleInputClass}
                    />
                  </Field>
                  <Field label="Leagă de poziția din deviz" className="sm:col-span-2">
                    <select
                      value={recipeEstimateItemId}
                      onChange={(event) => setRecipeEstimateItemId(event.target.value)}
                      className={moduleInputClass}
                    >
                      <option value="">General pentru lucrare</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.description}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <button
                  type="button"
                  disabled={!recipeId || Boolean(busy)}
                  onClick={() => void applyRecipe()}
                  className="mt-3 h-10 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-35"
                >
                  {busy === "recipe" ? "Se aplică…" : "Adaugă șablonul în necesar"}
                </button>
              </div>

              <form onSubmit={addMaterial} className="mt-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-xs font-semibold">Adaugă material</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Material *">
                    <input
                      value={materialForm.description}
                      onChange={(event) =>
                        setMaterialForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      className={moduleInputClass}
                      placeholder="Ex. Țeavă PPR 20 mm"
                    />
                  </Field>
                  <Field label="Poziție deviz">
                    <select
                      value={materialForm.estimateItemId}
                      onChange={(event) =>
                        setMaterialForm((current) => ({
                          ...current,
                          estimateItemId: event.target.value,
                        }))
                      }
                      className={moduleInputClass}
                    >
                      <option value="">General</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.description}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Cantitate *">
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={materialForm.quantity}
                      onChange={(event) =>
                        setMaterialForm((current) => ({
                          ...current,
                          quantity: event.target.value,
                        }))
                      }
                      className={moduleInputClass}
                    />
                  </Field>
                  <Field label="Unitate">
                    <input
                      value={materialForm.unit}
                      onChange={(event) =>
                        setMaterialForm((current) => ({
                          ...current,
                          unit: event.target.value,
                        }))
                      }
                      className={moduleInputClass}
                      placeholder="buc / m / kg"
                    />
                  </Field>
                  <Field label="Cost / unitate (lei)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={materialForm.unitCost}
                      onChange={(event) =>
                        setMaterialForm((current) => ({
                          ...current,
                          unitCost: event.target.value,
                        }))
                      }
                      className={moduleInputClass}
                      placeholder="0.00"
                    />
                  </Field>
                  <Field label="Furnizor">
                    <input
                      value={materialForm.vendor}
                      onChange={(event) =>
                        setMaterialForm((current) => ({
                          ...current,
                          vendor: event.target.value,
                        }))
                      }
                      className={moduleInputClass}
                      placeholder="Opțional"
                    />
                  </Field>
                </div>
                <button
                  disabled={Boolean(busy)}
                  className="mt-3 h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold disabled:opacity-35"
                >
                  {busy === "material" ? "Se adaugă…" : "+ Material"}
                </button>
              </form>
            </>
          ) : null}

          <div className="mt-4 space-y-2">
            {requirements.length ? (
              requirements.map((requirement) => (
                <div
                  key={requirement.id}
                  className="grid gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{requirement.description}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {Number(requirement.quantity)} {requirement.unit} ×{" "}
                      {formatMoney(requirement.unit_cost_cents, estimate.currency, locale)}
                      {requirement.vendor ? ` · ${requirement.vendor}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={requirement.status}
                      disabled={!canWrite || Boolean(busy)}
                      onChange={(event) =>
                        void run(`requirement-${requirement.id}`, () =>
                          setMaterialRequirementStatus(
                            organizationId,
                            estimate.id,
                            requirement.id,
                            event.target.value as MaterialRequirementStatus
                          )
                        )
                      }
                      className="h-9 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 text-xs"
                    >
                      {(Object.keys(requirementStatusLabels) as MaterialRequirementStatus[]).map(
                        (status) => (
                          <option key={status} value={status}>
                            {requirementStatusLabels[status]}
                          </option>
                        )
                      )}
                    </select>
                    {canDelete ? (
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() =>
                          void run(`delete-${requirement.id}`, () =>
                            deleteMaterialRequirement(
                              organizationId,
                              estimate.id,
                              requirement.id
                            )
                          )
                        }
                        className="h-9 rounded-full px-3 text-xs font-semibold text-red-500 disabled:opacity-35"
                      >
                        Șterge
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[18px] border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                Niciun material încă. Poți începe manual și salva lista ca șablon reutilizabil.
              </p>
            )}
          </div>

          {canWrite && requirements.length ? (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={recipeName}
                onChange={(event) => setRecipeName(event.target.value)}
                className={moduleInputClass}
                placeholder="Nume șablon, ex. Montaj calorifer"
              />
              <button
                type="button"
                disabled={!recipeName.trim() || Boolean(busy)}
                onClick={() => void saveRecipe()}
                className="h-11 shrink-0 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold disabled:opacity-35"
              >
                {busy === "save-recipe" ? "Se salvează…" : "Salvează necesarul ca șablon"}
              </button>
            </div>
          ) : null}
        </article>

        <div className="grid gap-4">
          <article className="rounded-[24px] border border-[var(--border)] bg-[var(--bg)] p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
              02 · Ofertă client
            </p>
            <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h4 className="text-lg font-semibold">
                  {offer ? offer.reference : "Nu a fost generată încă"}
                </h4>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Preia automat clientul, lucrarea, pozițiile, discountul, TVA-ul și totalurile din deviz.
                </p>
                {offer ? (
                  <p className="mt-2 text-xs font-semibold">
                    {documentStatusLabels[offer.status]} ·{" "}
                    {formatMoney(offer.total_cents, offer.currency, locale)}
                  </p>
                ) : null}
              </div>
              {canWrite ? (
                <button
                  type="button"
                  disabled={!items.length || Boolean(busy)}
                  onClick={() => void generateOffer()}
                  className="h-10 shrink-0 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-35"
                >
                  {busy === "offer"
                    ? "Se generează…"
                    : offer
                      ? "Actualizează oferta"
                      : "Generează oferta"}
                </button>
              ) : null}
            </div>
          </article>

          <article className="rounded-[24px] border border-[var(--border)] bg-[var(--bg)] p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
              03 · Factură
            </p>
            <div className="mt-3">
              <h4 className="text-lg font-semibold">
                {invoice ? invoice.reference : "Draft automat după acceptare"}
              </h4>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Factura se completează din devizul acceptat și intră automat în buget. Emiterea fiscală efectivă rămâne legătura cu furnizorul de facturare al firmei.
              </p>
              {invoice ? (
                <p className="mt-2 text-xs font-semibold">
                  {documentStatusLabels[invoice.status]} ·{" "}
                  {formatMoney(invoice.total_cents, invoice.currency, locale)}
                </p>
              ) : null}
            </div>

            {canWrite ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={estimate.status !== "accepted" || !items.length || Boolean(busy)}
                  onClick={() => void generateInvoice()}
                  className="h-10 rounded-full bg-[var(--button)] px-4 text-xs font-semibold text-[var(--button-text)] disabled:opacity-35"
                >
                  {busy === "invoice"
                    ? "Se pregătește…"
                    : invoice
                      ? "Actualizează draftul"
                      : "Pregătește factura"}
                </button>
                {invoice ? (
                  <>
                    <button
                      type="button"
                      disabled={Boolean(busy) || invoice.status === "issued"}
                      onClick={() => void changeInvoiceStatus("issued")}
                      className="h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold disabled:opacity-35"
                    >
                      Marchează emisă
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(busy) || invoice.status === "paid"}
                      onClick={() => void changeInvoiceStatus("paid")}
                      className="h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold disabled:opacity-35"
                    >
                      Marchează încasată
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}

            {estimate.status !== "accepted" ? (
              <p className="mt-3 rounded-[14px] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)]">
                Pentru factură, marchează mai întâi devizul ca „Acceptată”.
              </p>
            ) : null}
          </article>

          <article className="rounded-[24px] border border-[var(--border)] bg-[var(--bg)] p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
              04 · Buget proiect
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ModuleMetric
                label="Venit planificat"
                value={formatMoney(plannedIncomeCents, estimate.currency, locale)}
                note="din factura pregătită"
              />
              <ModuleMetric
                label="Materiale planificate"
                value={formatMoney(plannedMaterialCents, estimate.currency, locale)}
                note="din necesar"
              />
              <ModuleMetric
                label="Cheltuieli reale"
                value={formatMoney(actualExpenseCents, estimate.currency, locale)}
                note="legate de deviz / lucrare"
              />
              <ModuleMetric
                label="Marjă estimată"
                value={formatMoney(plannedMarginCents, estimate.currency, locale)}
                note={
                  plannedIncomeCents
                    ? `marjă curentă ${formatMoney(currentMarginCents, estimate.currency, locale)}`
                    : "apare după factura draft"
                }
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
