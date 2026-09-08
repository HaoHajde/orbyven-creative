"use client";

import {
  createExpense,
  deleteExpense,
  listExpenseContexts,
  listExpenses,
  type BusinessExpense,
  type ExpenseClientLink,
  type ExpenseDocumentLink,
  type ExpensePaymentMethod,
  type ExpenseTaskLink,
} from "@/lib/modules/expenses";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import { Field, ModuleEmpty, ModuleError, ModuleHeader, ModuleMetric, moduleInputClass } from "@/components/modules/ModuleKit";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Props = {
  organizationId: string;
  locale: string;
  role: OrbyvenWorkspace["membership"]["role"];
};

type FormState = {
  occurredOn: string;
  category: string;
  vendor: string;
  description: string;
  amount: string;
  paymentMethod: "" | ExpensePaymentMethod;
  clientId: string;
  taskId: string;
  documentId: string;
};

function todayInput() {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function emptyForm(): FormState {
  return {
    occurredOn: todayInput(),
    category: "Materiale",
    vendor: "",
    description: "",
    amount: "",
    paymentMethod: "",
    clientId: "",
    taskId: "",
    documentId: "",
  };
}

const paymentLabels: Record<ExpensePaymentMethod, string> = {
  cash: "Numerar",
  card: "Card",
  bank: "Transfer",
  other: "Altă metodă",
};

function formatMoney(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "RON",
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

export default function ExpensesModule({ organizationId, locale, role }: Props) {
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [clients, setClients] = useState<ExpenseClientLink[]>([]);
  const [tasks, setTasks] = useState<ExpenseTaskLink[]>([]);
  const [documents, setDocuments] = useState<ExpenseDocumentLink[]>([]);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const canWrite = role !== "viewer";
  const canDelete = role === "owner" || role === "admin" || role === "manager";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextExpenses, contexts] = await Promise.all([
        listExpenses(organizationId),
        listExpenseContexts(organizationId),
      ]);
      setExpenses(nextExpenses);
      setClients(contexts.clients);
      setTasks(contexts.tasks);
      setDocuments(contexts.documents);
    } catch (loadError) {
      console.error(loadError);
      setError("Cheltuielile nu au putut fi încărcate.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const clientById = useMemo(() => new Map(clients.map((item) => [item.id, item.name])), [clients]);
  const taskById = useMemo(() => new Map(tasks.map((item) => [item.id, item.title])), [tasks]);
  const docById = useMemo(() => new Map(documents.map((item) => [item.id, item.name])), [documents]);

  const categories = useMemo(
    () => Array.from(new Set(expenses.map((item) => item.category))).sort((a, b) => a.localeCompare(b, locale)),
    [expenses, locale]
  );

  const filtered = useMemo(
    () => (filter === "all" ? expenses : expenses.filter((item) => item.category === filter)),
    [expenses, filter]
  );

  const metrics = useMemo(() => {
    const currentMonth = monthKey(todayInput());
    const monthExpenses = expenses.filter((item) => monthKey(item.occurred_on) === currentMonth);
    const monthTotal = monthExpenses.reduce((sum, item) => sum + item.amount_cents, 0);
    const total = expenses.reduce((sum, item) => sum + item.amount_cents, 0);
    const linked = expenses.filter((item) => item.client_id || item.task_id).length;
    return { monthTotal, total, linked, count: expenses.length };
  }, [expenses]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await createExpense(organizationId, {
        occurredOn: form.occurredOn,
        category: form.category,
        vendor: form.vendor,
        description: form.description,
        amountLei: Number(form.amount),
        paymentMethod: form.paymentMethod || null,
        clientId: form.clientId || null,
        taskId: form.taskId || null,
        documentId: form.documentId || null,
      });
      setExpenses((current) => [created, ...current]);
      setForm(emptyForm());
      setCreateOpen(false);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Cheltuiala nu a putut fi salvată.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (expense: BusinessExpense) => {
    if (!canDelete || saving || !window.confirm(`Ștergi cheltuiala „${expense.description}”?`)) return;
    setSaving(true);
    setError("");
    try {
      await deleteExpense(organizationId, expense.id);
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
    } catch (deleteError) {
      console.error(deleteError);
      setError("Cheltuiala nu a putut fi ștearsă.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pb-24 text-sm text-[var(--muted)]">Se încarcă cheltuielile…</div>;

  return (
    <div className="pb-24 md:pb-8">
      <ModuleHeader
        eyebrow="Finance · Cheltuieli"
        title="Cheltuieli"
        description="Înregistrezi rapid ieșirile de bani și le legi de client, lucrare sau documentul justificativ, fără să transformăm modulul într-un program contabil."
        action={canWrite ? (
          <button type="button" onClick={() => setCreateOpen((current) => !current)} className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--button)] px-5 text-sm font-semibold text-[var(--button-text)]">
            {createOpen ? "Închide" : "+ Cheltuială"}
          </button>
        ) : null}
      />

      <div className="mt-8"><ModuleError message={error} /></div>

      <section className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ModuleMetric label="Luna curentă" value={formatMoney(metrics.monthTotal, "RON", locale)} note="cheltuieli înregistrate" />
        <ModuleMetric label="Total istoric" value={formatMoney(metrics.total, "RON", locale)} note="în workspace" />
        <ModuleMetric label="Înregistrări" value={String(metrics.count)} note="toate categoriile" />
        <ModuleMetric label="Legate de lucru" value={String(metrics.linked)} note="client sau lucrare" />
      </section>

      {createOpen && canWrite ? (
        <form onSubmit={handleCreate} className="mt-5 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Data *"><input type="date" value={form.occurredOn} onChange={(e) => setForm((c) => ({ ...c, occurredOn: e.target.value }))} className={moduleInputClass} /></Field>
            <Field label="Categorie *"><input value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))} className={moduleInputClass} placeholder="Materiale, combustibil…" /></Field>
            <Field label="Sumă (lei) *"><input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))} className={moduleInputClass} placeholder="0.00" /></Field>
            <Field label="Descriere *"><input value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} className={moduleInputClass} placeholder="Ce s-a cumpărat / plătit" /></Field>
            <Field label="Furnizor"><input value={form.vendor} onChange={(e) => setForm((c) => ({ ...c, vendor: e.target.value }))} className={moduleInputClass} placeholder="Nume furnizor" /></Field>
            <Field label="Plată">
              <select value={form.paymentMethod} onChange={(e) => setForm((c) => ({ ...c, paymentMethod: e.target.value as FormState["paymentMethod"] }))} className={moduleInputClass}>
                <option value="">Nespecificat</option>
                {(Object.keys(paymentLabels) as ExpensePaymentMethod[]).map((key) => <option key={key} value={key}>{paymentLabels[key]}</option>)}
              </select>
            </Field>
            <Field label="Client">
              <select value={form.clientId} onChange={(e) => setForm((c) => ({ ...c, clientId: e.target.value }))} className={moduleInputClass}><option value="">Fără client</option>{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            </Field>
            <Field label="Lucrare">
              <select value={form.taskId} onChange={(e) => setForm((c) => ({ ...c, taskId: e.target.value }))} className={moduleInputClass}><option value="">Fără lucrare</option>{tasks.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
            </Field>
            <Field label="Document justificativ">
              <select value={form.documentId} onChange={(e) => setForm((c) => ({ ...c, documentId: e.target.value }))} className={moduleInputClass}><option value="">Fără document</option>{documents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            </Field>
          </div>
          <div className="mt-5 flex justify-end"><button disabled={saving} className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)] disabled:opacity-40">{saving ? "Se salvează…" : "Salvează cheltuiala"}</button></div>
        </form>
      ) : null}

      <section className="mt-5 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="font-semibold">Registru simplu</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${moduleInputClass} sm:max-w-[220px]`}>
            <option value="all">Toate categoriile</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>

        {filtered.length ? (
          <div className="mt-5 space-y-2">
            {filtered.map((expense) => (
              <article key={expense.id} className="grid gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--bg)] p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                <div><p className="text-xs font-semibold">{new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(`${expense.occurred_on}T12:00:00`))}</p><p className="mt-1 text-[11px] text-[var(--muted)]">{expense.category}</p></div>
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{expense.description}</p><p className="mt-1 truncate text-xs text-[var(--muted)]">{expense.vendor || "Fără furnizor"}{expense.client_id ? ` · ${clientById.get(expense.client_id) || "Client"}` : ""}{expense.task_id ? ` · ${taskById.get(expense.task_id) || "Lucrare"}` : ""}{expense.document_id ? ` · ${docById.get(expense.document_id) || "Document"}` : ""}</p></div>
                <div className="flex items-center justify-between gap-3 sm:justify-end"><p className="text-sm font-semibold">{formatMoney(expense.amount_cents, expense.currency, locale)}</p>{canDelete ? <button type="button" disabled={saving} onClick={() => void remove(expense)} className="text-xs font-semibold text-red-500 disabled:opacity-40">Șterge</button> : null}</div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5"><ModuleEmpty title="Nicio cheltuială" description="Înregistrează doar costurile utile operațional și leagă-le de lucrarea reală." /></div>
        )}
      </section>
    </div>
  );
}
