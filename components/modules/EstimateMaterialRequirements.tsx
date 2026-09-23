"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  addEstimateMaterial,
  listEstimateMaterials,
  setEstimateMaterialStatus,
  type MaterialRequirement,
  type MaterialStatus,
} from "@/lib/modules/materials";
import type { EstimateItem } from "@/lib/modules/estimates";
import { ModuleError, moduleInputClass } from "@/components/modules/ModuleKit";

type Props = {
  organizationId: string;
  estimateId: string;
  estimateItems: EstimateItem[];
  canWrite: boolean;
  locale: string;
};

const statuses: Record<MaterialStatus, string> = {
  planned: "De cumpărat",
  ordered: "Comandat",
  bought: "Cumpărat",
};

const empty = {
  description: "",
  unit: "buc",
  quantity: "1",
  unitCostLei: "",
  vendor: "",
  sourceEstimateItemId: "",
};

export default function EstimateMaterialRequirements({
  organizationId, estimateId, estimateItems, canWrite, locale,
}: Props) {
  const [materials, setMaterials] = useState<MaterialRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(empty);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void listEstimateMaterials(organizationId, estimateId)
        .then((rows) => { if (active) setMaterials(rows); })
        .catch((reason) => {
          console.error(reason);
          if (active) setError("Necesarul de materiale nu a putut fi încărcat.");
        })
        .finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [organizationId, estimateId]);

  const sumCents = useMemo(
    () => materials.reduce((sum, row) => sum + Math.round(row.quantity * row.unit_cost_cents), 0),
    [materials]
  );
  const money = (cents: number) => new Intl.NumberFormat(locale, {
    style: "currency", currency: "RON",
  }).format(cents / 100);

  const selectSource = (sourceEstimateItemId: string) => {
    const source = estimateItems.find((row) => row.id === sourceEstimateItemId);
    setForm((current) => ({
      ...current,
      sourceEstimateItemId,
      description: source?.description || current.description,
      quantity: source ? String(source.quantity) : current.quantity,
    }));
  };

  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await addEstimateMaterial(organizationId, estimateId, {
        description: form.description,
        unit: form.unit,
        quantity: Number(form.quantity),
        unitCostLei: Number(form.unitCostLei),
        vendor: form.vendor,
        sourceEstimateItemId: form.sourceEstimateItemId || null,
      });
      setMaterials((rows) => [...rows, created]);
      setForm(empty);
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : "Materialul nu a putut fi adăugat.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (row: MaterialRequirement, status: MaterialStatus) => {
    if (!canWrite || saving || row.status === status) return;
    setSaving(true);
    setError("");
    try {
      const updated = await setEstimateMaterialStatus(organizationId, estimateId, row.id, status);
      setMaterials((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (reason) {
      console.error(reason);
      setError("Statusul materialului nu a putut fi actualizat.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-5 rounded-[18px] border border-[var(--border)] bg-[var(--surface)]/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">Deviz → necesar materiale</p>
          <h3 className="mt-1.5 text-lg font-semibold">Materiale pentru lucrare</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">Separat de manoperă și de oferta afișată clientului.</p>
        </div>
        <span className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold">{money(sumCents)} · cost estimat</span>
      </div>
      <div className="mt-4"><ModuleError message={error} /></div>
      {loading ? <p className="mt-4 text-xs text-[var(--muted)]">Se încarcă necesarul…</p>
        : materials.length ? (
          <div className="mt-3 grid gap-2">
            {materials.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/65 px-3 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{row.description}</p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">{row.quantity} {row.unit} · {money(row.unit_cost_cents)} / unitate{row.vendor ? " · " + row.vendor : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold">{money(Math.round(row.quantity * row.unit_cost_cents))}</p>
                  {canWrite ? (
                    <select
                      aria-label={"Status pentru " + row.description}
                      value={row.status}
                      disabled={saving}
                      onChange={(event) => void changeStatus(row, event.target.value as MaterialStatus)}
                      className="max-w-32 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-[11px]"
                    >
                      {(Object.keys(statuses) as MaterialStatus[]).map((value) => (
                        <option key={value} value={value}>{statuses[value]}</option>
                      ))}
                    </select>
                  ) : <span className="text-[11px] text-[var(--muted)]">{statuses[row.status]}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : <p className="mt-3 rounded-xl border border-dashed border-[var(--border)] p-4 text-xs text-[var(--muted)]">Încă nu există materiale pentru acest deviz. Un deviz exclusiv de servicii poate rămâne fără materiale.</p>}

      {canWrite && (
        <form onSubmit={add} className="mt-4 grid gap-2 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
          <p className="sm:col-span-2 text-xs font-semibold">Adaugă material</p>
          <label className="text-[11px] text-[var(--muted)]">Din poziția devizului (opțional)
            <select value={form.sourceEstimateItemId} onChange={(event) => selectSource(event.target.value)} className={moduleInputClass}>
              <option value="">Material introdus manual</option>
              {estimateItems.map((row) => <option key={row.id} value={row.id}>{row.description}</option>)}
            </select>
          </label>
          <label className="text-[11px] text-[var(--muted)]">Denumire material
            <input required value={form.description} onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))} className={moduleInputClass} placeholder="Ex. Țeavă multistrat" />
          </label>
          <label className="text-[11px] text-[var(--muted)]">Cantitate
            <input required type="number" min="0.001" max="1000000" step="0.001" value={form.quantity} onChange={(event) => setForm((state) => ({ ...state, quantity: event.target.value }))} className={moduleInputClass} />
          </label>
          <label className="text-[11px] text-[var(--muted)]">Unitate
            <select value={form.unit} onChange={(event) => setForm((state) => ({ ...state, unit: event.target.value }))} className={moduleInputClass}>
              {["buc", "m", "m²", "m³", "kg", "l", "set", "rolă"].map((unit) => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </label>
          <label className="text-[11px] text-[var(--muted)]">Cost estimat / unitate (RON)
            <input required type="number" min="0" step="0.01" value={form.unitCostLei} onChange={(event) => setForm((state) => ({ ...state, unitCostLei: event.target.value }))} className={moduleInputClass} placeholder="Cost de achiziție, nu preț client" />
          </label>
          <label className="text-[11px] text-[var(--muted)]">Furnizor (opțional)
            <input value={form.vendor} onChange={(event) => setForm((state) => ({ ...state, vendor: event.target.value }))} className={moduleInputClass} />
          </label>
          <div className="flex items-end sm:col-span-2"><button disabled={saving} className="rounded-full bg-[var(--button)] px-5 py-3 text-xs font-semibold text-[var(--button-text)] disabled:opacity-50">{saving ? "Se salvează..." : "+ Adaugă în necesar"}</button></div>
        </form>
      )}
      <p className="mt-3 text-[11px] leading-5 text-[var(--muted-2)]">Costurile de achiziție sunt pentru organizarea internă. Oferta clientului rămâne calculată din prețurile de vânzare ale devizului.</p>
    </section>
  );
}
