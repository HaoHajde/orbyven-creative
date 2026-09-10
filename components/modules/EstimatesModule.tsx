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
  sent: "Trimisă",
  accepted: "Acceptată",
  rejected: "Respinsă",
  expired: "Expirată",
};

function newLine(): DraftLine {
  return { key: crypto.randomUUID(), description: "", quantity: "1", price: "" };
}

function formatMoney(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "RON",
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);
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
  const clientById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients]
  );
  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks]
  );

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
    const subtotal = lines.reduce(
      (sum, line) =>
        sum + (Number(line.quantity) || 0) * (Number(line.price) || 0),
      0
    );
    const taxable = Math.max(0, subtotal - Math.max(0, Number(form.discount) || 0));
    return (
      taxable *
      (1 + Math.max(0, Math.min(100, Number(form.taxRate) || 0)) / 100)
    );
  }, [form.discount, form.taxRate, lines]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await createEstimate(organizationId, {
        title: form.title,
        clientId: form.clientId || null,
        taskId: form.taskId || null,
        validUntil: form.validUntil || null,
        taxRate: form.taxRate ? Number(form.taxRate) : null,
        discountLei: form.discount ? Number(form.discount) : 0,
        notes: form.notes,
        items: lines.map((line) => ({
          description: line.description,
          quantity: Number(line.quantity),
          unitPriceLei: Number(line.price),
        })),
      });
      setEstimates((current) => [created, ...current]);
      setSelectedId(created.id);
      setItems(await listEstimateItems(organizationId, created.id));
      setCreateOpen(false);
      setForm(emptyForm);
      setLines([newLine()]);
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Devizul nu a putut fi creat."
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status: EstimateStatus) => {
    if (!selected || !canWrite || saving) return;
    setSaving(true);
    setError("");
    try {
      const next = await setEstimateStatus(
        organizationId,
        selected.id,
        status
      );
      setEstimates((current) =>
        current.map((item) => (item.id === next.id ? next : item))
      );
    } catch (statusError) {
      console.error(statusError);
      setError("Statusul devizului nu a putut fi actualizat.");
    } finally {
      setSaving(false);
    }
  };

  const removeSelected = async () => {
    if (
      !selected ||
      !canDelete ||
      saving ||
      !window.confirm(`Ștergi ${selected.reference}?`)
    )
      return;
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

  if (loading) {
    return (
      <div className="pb-24 text-sm text-[var(--muted)]">
        Se încarcă devizele…
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8">
      <ModuleHeader
        eyebrow="Sales · Devize, oferte & automatizare"
        title="Devize & oferte"
        description="Devizul devine sursa de adevăr pentru necesarul de materiale, oferta clientului, factura pregătită și bugetul lucrării."
        action={
          canWrite ? (
            <button
              type="button"
              onClick={() => setCreateOpen((current) => !current)}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--button)] px-5 text-sm font-semibold text-[var(--button-text)]"
            >
              {createOpen ? "Închide" : "+ Deviz nou"}
            </button>
          ) : null
        }
      />

      <div className="mt-8">
        <ModuleError message={error} />
      </div>

      <section className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ModuleMetric
          label="Total"
          value={String(metrics.total)}
          note="devize în workspace"
        />
        <ModuleMetric
          label="Așteaptă răspuns"
          value={String(metrics.waiting)}
          note="trimise clientului"
        />
        <ModuleMetric
          label="Acceptate"
          value={String(metrics.accepted)}
          note="gata pentru factură"
        />
        <ModuleMetric
          label="Valoare acceptată"
          value={formatMoney(metrics.acceptedValue, "RON", locale)}
          note="total devize acceptate"
        />
      </section>

      {createOpen && canWrite ? (
        <form
          onSubmit={handleCreate}
          className="mt-5 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titlu deviz *">
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className={moduleInputClass}
                placeholder="Ex. Înlocuire centrală + montaj"
              />
            </Field>
            <Field label="Client">
              <select
                value={form.clientId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    clientId: event.target.value,
                  }))
                }
                className={moduleInputClass}
              >
                <option value="">Fără client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                    {client.company ? ` · ${client.company}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Lucrare">
              <select
                value={form.taskId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    taskId: event.target.value,
                  }))
                }
                className={moduleInputClass}
              >
                <option value="">Fără lucrare</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Valabil până la">
              <input
                type="date"
                value={form.validUntil}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    validUntil: event.target.value,
                  }))
                }
                className={moduleInputClass}
              />
            </Field>
            <Field label="Discount (lei)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    discount: event.target.value,
                  }))
                }
                className={moduleInputClass}
                placeholder="0"
              />
            </Field>
            <Field label="Taxă / TVA (%) opțional">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.taxRate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    taxRate: event.target.value,
                  }))
                }
                className={moduleInputClass}
                placeholder="0"
              />
            </Field>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
                Poziții deviz
              </p>
              <button
                type="button"
                onClick={() => setLines((current) => [...current, newLine()])}
                className="text-xs font-semibold"
              >
                + Adaugă poziție
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {lines.map((line, index) => (
                <div
                  key={line.key}
                  className="grid gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--bg)] p-4 sm:grid-cols-[1fr_100px_150px_auto] sm:items-end"
                >
                  <Field label={`Descriere ${index + 1}`}>
                    <input
                      value={line.description}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item) =>
                            item.key === line.key
                              ? { ...item, description: event.target.value }
                              : item
                          )
                        )
                      }
                      className={moduleInputClass}
                      placeholder="Material / manoperă"
                    />
                  </Field>
                  <Field label="Cantitate">
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={line.quantity}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item) =>
                            item.key === line.key
                              ? { ...item, quantity: event.target.value }
                              : item
                          )
                        )
                      }
                      className={moduleInputClass}
                    />
                  </Field>
                  <Field label="Preț / unitate">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.price}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item) =>
                            item.key === line.key
                              ? { ...item, price: event.target.value }
                              : item
                          )
                        )
                      }
                      className={moduleInputClass}
                      placeholder="lei"
                    />
                  </Field>
                  <button
                    type="button"
                    disabled={lines.length === 1}
                    onClick={() =>
                      setLines((current) =>
                        current.filter((item) => item.key !== line.key)
                      )
                    }
                    className="h-11 rounded-full border border-[var(--border)] px-4 text-xs disabled:opacity-30"
                  >
                    Șterge
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Field label="Note" className="mt-5">
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              className={`${moduleInputClass} min-h-24 resize-y`}
            />
          </Field>

          <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs text-[var(--muted)]">Total estimat</p>
              <p className="mt-1 text-2xl font-semibold">
                {new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency: "RON",
                }).format(previewTotal)}
              </p>
            </div>
            <button
              disabled={saving}
              className="h-12 rounded-full bg-[var(--button)] px-7 text-sm font-semibold text-[var(--button-text)] disabled:opacity-50"
            >
              {saving ? "Se salvează…" : "Creează devizul"}
            </button>
          </div>
        </form>
      ) : null}

      <section className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Toate devizele</h2>
            <span className="text-xs text-[var(--muted)]">{estimates.length}</span>
          </div>

          {estimates.length ? (
            <div className="space-y-2">
              {estimates.map((estimate) => (
                <button
                  key={estimate.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(estimate.id);
                    setItems([]);
                  }}
                  className={`w-full rounded-[18px] border p-4 text-left ${
                    selectedId === estimate.id
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border)] bg-[var(--bg)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{estimate.title}</p>
                      <p className="mt-1 text-[11px] text-[var(--muted)]">
                        {estimate.reference} ·{" "}
                        {clientById.get(estimate.client_id || "")?.name ||
                          "Fără client"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[10px] font-semibold">
                      {statusLabels[estimate.status]}
                    </span>
                  </div>
                  <p className="mt-4 text-lg font-semibold">
                    {formatMoney(
                      estimate.total_cents,
                      estimate.currency,
                      locale
                    )}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <ModuleEmpty
              title="Niciun deviz încă"
              description="Primul deviz poate porni direct de la un client și o lucrare existente."
            />
          )}
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-7">
          {selected ? (
            <>
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                    {selected.reference}
                  </p>
                  <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.045em]">
                    {selected.title}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {clientById.get(selected.client_id || "")?.name ||
                      "Fără client"}
                    {selected.task_id
                      ? ` · ${
                          taskById.get(selected.task_id)?.title || "Lucrare"
                        }`
                      : ""}
                  </p>
                </div>
                <p className="text-[30px] font-semibold tracking-[-0.05em]">
                  {formatMoney(
                    selected.total_cents,
                    selected.currency,
                    locale
                  )}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <ModuleMetric
                  label="Status"
                  value={statusLabels[selected.status]}
                />
                <ModuleMetric label="Poziții" value={String(items.length)} />
                <ModuleMetric
                  label="Taxă"
                  value={
                    selected.tax_rate === null ? "—" : `${selected.tax_rate}%`
                  }
                />
              </div>

              <div className="mt-6 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg)]">
                {itemsLoading ? (
                  <p className="p-4 text-sm text-[var(--muted)]">
                    Se încarcă pozițiile…
                  </p>
                ) : items.length ? (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_auto] gap-4 border-b border-[var(--border)] px-4 py-3 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {item.quantity} ×{" "}
                          {formatMoney(
                            item.unit_price_cents,
                            selected.currency,
                            locale
                          )}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatMoney(
                          Math.round(
                            item.quantity * item.unit_price_cents
                          ),
                          selected.currency,
                          locale
                        )}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-sm text-[var(--muted)]">
                    Devizul nu are poziții.
                  </p>
                )}
              </div>

              {selected.notes ? (
                <p className="mt-5 rounded-[18px] bg-[var(--bg)] p-4 text-sm leading-6 text-[var(--muted)]">
                  {selected.notes}
                </p>
              ) : null}

              {canWrite ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {(
                    ["draft", "sent", "accepted", "rejected"] as EstimateStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={saving || selected.status === status}
                      onClick={() => void changeStatus(status)}
                      className="h-10 rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold disabled:opacity-35"
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                  {canDelete ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void removeSelected()}
                      className="h-10 rounded-full px-4 text-xs font-semibold text-red-500 disabled:opacity-35"
                    >
                      Șterge
                    </button>
                  ) : null}
                </div>
              ) : null}

              {!itemsLoading ? (
                <EstimateWorkflowPanel
                  organizationId={organizationId}
                  locale={locale}
                  role={role}
                  estimate={selected}
                  items={items}
                />
              ) : null}
            </>
          ) : (
            <ModuleEmpty
              title="Selectează un deviz"
              description="Detaliile, necesarul, oferta, factura și bugetul apar aici."
            />
          )}
        </div>
      </section>
    </div>
  );
}
