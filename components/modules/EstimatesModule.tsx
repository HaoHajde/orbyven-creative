"use client";

import EstimateWorkflowPanel from "@/components/modules/EstimateWorkflowPanel";
import {
  Field,
  ModuleEmpty,
  ModuleError,
  ModuleHeader,
  ModuleMetric,
  moduleInputClass,
} from "@/components/modules/ModuleKit";
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
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Props = {
  organizationId: string;
  locale: string;
  role: OrbyvenWorkspace["membership"]["role"];
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
};

const emptyForm: FormState = {
  title: "",
  clientId: "",
  taskId: "",
  validUntil: "",
  taxRate: "",
  discount: "",
  notes: "",
};

const statusLabels: Record<EstimateStatus, string> = {
  draft: "Draft",
  sent: "Trimis",
  accepted: "Acceptat",
  rejected: "Respins",
  expired: "Expirat",
};

function newLine(): DraftLine {
  return { key: crypto.randomUUID(), description: "", quantity: "1", price: "" };
}

function money(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "RON",
    maximumFractionDigits: 2,
  }).format((Number(cents) || 0) / 100);
}

function todayLabel(locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date());
}

export default function EstimatesModule({ organizationId, locale, role }: Props) {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [clients, setClients] = useState<EstimateLink[]>([]);
  const [tasks, setTasks] = useState<EstimateTaskLink[]>([]);
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [lines, setLines] = useState<DraftLine[]>(() => [newLine()]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const canWrite = role !== "viewer";
  const canDelete = role === "owner" || role === "admin" || role === "manager";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextEstimates, nextClients, nextTasks] = await Promise.all([
        listEstimates(organizationId),
        listEstimateClients(organizationId),
        listEstimateTasks(organizationId),
      ]);
      setEstimates(nextEstimates);
      setClients(nextClients);
      setTasks(nextTasks);
      setSelectedId((current) =>
        current && nextEstimates.some((item) => item.id === current)
          ? current
          : nextEstimates[0]?.id ?? null
      );
    } catch (loadError) {
      console.error(loadError);
      setError("Devizele nu au putut fi încărcate.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setItemsLoading(true);
      setItems([]);
      void listEstimateItems(organizationId, selectedId)
        .then((nextItems) => {
          if (active) setItems(nextItems);
        })
        .catch((itemError) => {
          console.error(itemError);
          if (active) setError("Pozițiile devizului nu au putut fi încărcate.");
        })
        .finally(() => {
          if (active) setItemsLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [organizationId, selectedId]);

  const selected = useMemo(
    () => estimates.find((estimate) => estimate.id === selectedId) ?? null,
    [estimates, selectedId]
  );
  const clientById = useMemo(() => new Map(clients.map((item) => [item.id, item])), [clients]);
  const taskById = useMemo(() => new Map(tasks.map((item) => [item.id, item])), [tasks]);

  const metrics = useMemo(() => {
    const accepted = estimates.filter((item) => item.status === "accepted");
    return {
      total: estimates.length,
      waiting: estimates.filter((item) => item.status === "sent").length,
      accepted: accepted.length,
      acceptedValue: accepted.reduce((sum, item) => sum + Number(item.total_cents), 0),
    };
  }, [estimates]);

  const previewTotal = useMemo(() => {
    const subtotal = lines.reduce(
      (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.price) || 0),
      0
    );
    const taxable = Math.max(0, subtotal - Math.max(0, Number(form.discount) || 0));
    return taxable * (1 + Math.max(0, Math.min(100, Number(form.taxRate) || 0)) / 100);
  }, [form.discount, form.taxRate, lines]);

  const smartTitle = () => {
    const task = tasks.find((item) => item.id === form.taskId)?.title?.trim();
    const firstDescription = lines.find((line) => line.description.trim())?.description.trim();
    const client = clients.find((item) => item.id === form.clientId)?.name?.trim();
    return (
      form.title.trim() ||
      task ||
      firstDescription ||
      (client ? `Deviz · ${client}` : `Deviz · ${todayLabel(locale)}`)
    );
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || saving) return;

    const title = smartTitle();
    const normalizedLines = lines
      .map((line) => ({
        description: line.description.trim() || title,
        quantity: Number(line.quantity),
        unitPriceLei: Number(line.price || 0),
      }))
      .filter((line) => Number.isFinite(line.quantity) && line.quantity > 0);

    if (!normalizedLines.length) {
      setFormError("Adaugă cel puțin o poziție cu o cantitate mai mare decât zero.");
      return;
    }

    setSaving(true);
    setError("");
    setFormError("");
    try {
      const created = await createEstimate(organizationId, {
        title,
        clientId: form.clientId || null,
        taskId: form.taskId || null,
        validUntil: form.validUntil || null,
        taxRate: form.taxRate ? Number(form.taxRate) : null,
        discountLei: form.discount ? Number(form.discount) : 0,
        notes: form.notes,
        items: normalizedLines,
      });
      const createdItems = await listEstimateItems(organizationId, created.id);
      setEstimates((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setSelectedId(created.id);
      setItems(createdItems);
      setCreateOpen(false);
      setForm(emptyForm);
      setLines([newLine()]);
      window.requestAnimationFrame(() => {
        document.getElementById("selected-estimate")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (saveError) {
      console.error(saveError);
      setFormError(saveError instanceof Error ? saveError.message : "Devizul nu a putut fi creat.");
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
      setEstimates((current) => current.map((item) => (item.id === next.id ? next : item)));
    } catch (statusError) {
      console.error(statusError);
      setError("Statusul devizului nu a putut fi actualizat.");
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
      setError("Devizul nu a putut fi șters.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pb-10 text-sm text-[var(--muted)]">Se încarcă devizele…</div>;

  return (
    <div className="pb-8">
      <ModuleHeader
        eyebrow="Sales · Devize"
        title="Devize & oferte"
        description="Creezi devizul o singură dată. Necesarul, oferta, factura și bugetul se leagă automat de el."
        action={
          canWrite ? (
            <button
              type="button"
              onClick={() => {
                setFormError("");
                setCreateOpen((current) => !current);
              }}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--button)] px-5 text-sm font-semibold text-[var(--button-text)]"
            >
              {createOpen ? "Închide" : "+ Deviz"}
            </button>
          ) : null
        }
      />

      <div className="mt-6"><ModuleError message={error} /></div>

      <section className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ModuleMetric label="Devize" value={String(metrics.total)} note="total" />
        <ModuleMetric label="În așteptare" value={String(metrics.waiting)} note="trimise" />
        <ModuleMetric label="Acceptate" value={String(metrics.accepted)} note="gata de facturare" />
        <ModuleMetric label="Valoare" value={money(metrics.acceptedValue, "RON", locale)} note="acceptată" />
      </section>

      {createOpen && canWrite ? (
        <form onSubmit={handleCreate} className="mt-4 overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--surface)]">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">Deviz nou</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em]">Doar datele care contează.</h2>
              </div>
              <p className="max-w-sm text-xs leading-5 text-[var(--muted)]">Titlul este opțional. Dacă îl lași liber, ORBYVEN îl construiește din lucrare, client sau prima poziție.</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Titlu"><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className={moduleInputClass} placeholder="Opțional" /></Field>
              <Field label="Client"><select value={form.clientId} onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))} className={moduleInputClass}><option value="">Fără client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.company ? ` · ${client.company}` : ""}</option>)}</select></Field>
              <Field label="Lucrare"><select value={form.taskId} onChange={(event) => setForm((current) => ({ ...current, taskId: event.target.value }))} className={moduleInputClass}><option value="">Fără lucrare</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></Field>
              <Field label="Valabil până la"><input type="date" value={form.validUntil} onChange={(event) => setForm((current) => ({ ...current, validUntil: event.target.value }))} className={moduleInputClass} /></Field>
            </div>
          </div>

          <div className="border-y border-[var(--border)] bg-[var(--bg)] p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-sm font-semibold">Poziții</p><p className="mt-1 text-[11px] text-[var(--muted)]">Descriere, cantitate și preț.</p></div>
              <button type="button" onClick={() => setLines((current) => [...current, newLine()])} className="h-9 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold">+ Poziție</button>
            </div>
            <div className="mt-4 space-y-2">
              {lines.map((line, index) => (
                <div key={line.key} className="grid gap-2 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[1fr_100px_145px_auto] sm:items-end">
                  <Field label={index === 0 ? "Descriere" : `Descriere ${index + 1}`}><input value={line.description} onChange={(event) => setLines((current) => current.map((item) => item.key === line.key ? { ...item, description: event.target.value } : item))} className={moduleInputClass} placeholder="Ex. Montaj centrală" /></Field>
                  <Field label="Cantitate"><input type="number" min="0.001" step="0.001" value={line.quantity} onChange={(event) => setLines((current) => current.map((item) => item.key === line.key ? { ...item, quantity: event.target.value } : item))} className={moduleInputClass} /></Field>
                  <Field label="Preț / unitate"><input type="number" min="0" step="0.01" value={line.price} onChange={(event) => setLines((current) => current.map((item) => item.key === line.key ? { ...item, price: event.target.value } : item))} className={moduleInputClass} placeholder="lei" /></Field>
                  <button type="button" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))} className="h-11 rounded-full border border-[var(--border)] px-4 text-xs disabled:opacity-25">Șterge</button>
                </div>
              ))}
            </div>
          </div>

          <details className="border-b border-[var(--border)] p-4 sm:p-6">
            <summary className="cursor-pointer text-xs font-semibold text-[var(--muted)]">Opțiuni: discount, TVA și note</summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Discount (lei)"><input type="number" min="0" step="0.01" value={form.discount} onChange={(event) => setForm((current) => ({ ...current, discount: event.target.value }))} className={moduleInputClass} placeholder="0" /></Field>
              <Field label="Taxă / TVA (%)"><input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(event) => setForm((current) => ({ ...current, taxRate: event.target.value }))} className={moduleInputClass} placeholder="0" /></Field>
              <Field label="Note" className="sm:col-span-2 lg:col-span-1"><input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className={moduleInputClass} placeholder="Opțional" /></Field>
            </div>
          </details>

          <div className="p-4 sm:p-6">
            {formError ? <div role="alert" className="mb-3 rounded-[16px] border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">{formError}</div> : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs text-[var(--muted)]">Total estimat</p><p className="mt-1 text-[28px] font-semibold tracking-[-0.05em]">{new Intl.NumberFormat(locale, { style: "currency", currency: "RON" }).format(previewTotal)}</p></div>
              <button type="submit" disabled={saving} className="h-12 rounded-full bg-[var(--button)] px-7 text-sm font-semibold text-[var(--button-text)] disabled:opacity-50">{saving ? "Se creează…" : "Creează devizul"}</button>
            </div>
          </div>
        </form>
      ) : null}

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Devize</h2><span className="text-xs text-[var(--muted)]">{estimates.length}</span></div>
          {estimates.length ? (
            <div className="mt-3 space-y-2">
              {estimates.map((estimate) => (
                <button key={estimate.id} type="button" onClick={() => setSelectedId(estimate.id)} className={`w-full rounded-[17px] border p-3.5 text-left transition ${selectedId === estimate.id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--bg)]"}`}>
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{estimate.title}</p><p className="mt-1 truncate text-[11px] text-[var(--muted)]">{estimate.reference}{estimate.client_id ? ` · ${clientById.get(estimate.client_id)?.name || "Client"}` : ""}</p></div><span className="shrink-0 rounded-full bg-[var(--surface)] px-2.5 py-1 text-[10px] font-semibold">{statusLabels[estimate.status]}</span></div>
                  <p className="mt-3 text-base font-semibold">{money(estimate.total_cents, estimate.currency, locale)}</p>
                </button>
              ))}
            </div>
          ) : <div className="mt-3"><ModuleEmpty title="Niciun deviz încă" description="Apasă + Deviz. ORBYVEN poate completa automat titlul dacă vrei să mergi rapid." /></div>}
        </div>

        <div id="selected-estimate" className="scroll-mt-24 rounded-[26px] border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-6">
          {selected ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">{selected.reference}</p><h2 className="mt-2 text-[26px] font-semibold tracking-[-0.05em] sm:text-[30px]">{selected.title}</h2><p className="mt-1 text-sm text-[var(--muted)]">{selected.client_id ? clientById.get(selected.client_id)?.name || "Client" : "Fără client"}{selected.task_id ? ` · ${taskById.get(selected.task_id)?.title || "Lucrare"}` : ""}</p></div>
                <p className="text-[26px] font-semibold tracking-[-0.05em]">{money(selected.total_cents, selected.currency, locale)}</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {canWrite ? (["draft", "sent", "accepted", "rejected"] as EstimateStatus[]).map((status) => <button key={status} type="button" disabled={saving || selected.status === status} onClick={() => void changeStatus(status)} className={`h-9 rounded-full border px-3.5 text-[11px] font-semibold disabled:opacity-35 ${selected.status === status ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]" : "border-[var(--border-strong)]"}`}>{statusLabels[status]}</button>) : <span className="text-sm text-[var(--muted)]">{statusLabels[selected.status]}</span>}
                {canDelete ? <button type="button" disabled={saving} onClick={() => void removeSelected()} className="ml-auto h-9 rounded-full px-3 text-[11px] font-semibold text-red-500 disabled:opacity-35">Șterge</button> : null}
              </div>

              <details className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--bg)] p-4">
                <summary className="cursor-pointer text-sm font-semibold">Poziții deviz · {itemsLoading ? "…" : items.length}</summary>
                <div className="mt-3 space-y-2">
                  {itemsLoading ? <p className="text-xs text-[var(--muted)]">Se încarcă…</p> : items.map((item) => <div key={item.id} className="flex items-start justify-between gap-4 border-b border-[var(--border)] py-2 last:border-0"><div><p className="text-sm font-medium">{item.description}</p><p className="mt-1 text-[11px] text-[var(--muted)]">{item.quantity} × {money(item.unit_price_cents, selected.currency, locale)}</p></div><p className="text-sm font-semibold">{money(Math.round(Number(item.quantity) * Number(item.unit_price_cents)), selected.currency, locale)}</p></div>)}
                </div>
              </details>

              {!itemsLoading ? <EstimateWorkflowPanel organizationId={organizationId} locale={locale} role={role} estimate={selected} items={items} /> : null}
            </>
          ) : <ModuleEmpty title="Selectează un deviz" description="Detaliile și automatizările apar aici." />}
        </div>
      </section>
    </div>
  );
}
