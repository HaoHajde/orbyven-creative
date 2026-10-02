"use client";

import {
  attachExpenseDocument,
  createExpense,
  createIncome,
  deleteExpense,
  deleteIncome,
  listExpenseContexts,
  listExpenses,
  listFinanceInvoices,
  listIncomeEntries,
  markInvoiceIssuedExternally,
  type BusinessExpense,
  type ExpenseClientLink,
  type ExpenseDocumentLink,
  type ExpensePaymentMethod,
  type ExpensePurchaseOrderLink,
  type ExpenseTaskLink,
  type FinanceIncomeEntry,
  type FinanceInvoiceWithBalance,
} from "@/lib/modules/expenses";
import type { OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import {
  Field,
  ModuleEmpty,
  ModuleAdvancedFields,
  ModuleError,
  ModuleHeader,
  ModuleMetric,
  ModuleNextAction,
  ModuleProgressiveMetrics,
  moduleInputClass,
} from "@/components/modules/ModuleKit";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useWorkspaceCreateFocus } from "@/components/modules/useWorkspaceRecordFocus";
import { useWorkspaceLiveContext } from "@/components/modules/useWorkspaceLiveContext";

type Props = {
  organizationId: string;
  locale: string;
  role: OrbyvenWorkspace["membership"]["role"];
  enabledModules: OrbyvenModuleId[];
  onOpenModule: (moduleId: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
  initialCreate?: boolean;
  initialClientId?: string;
  initialTaskId?: string;
  initialEstimateId?: string;
  initialPurchaseOrderId?: string;
  initialDocumentId?: string;
};

type Tab = "overview" | "expenses" | "income" | "invoices" | "procurement";

type ExpenseForm = {
  occurredOn: string;
  category: string;
  vendor: string;
  description: string;
  amount: string;
  paymentMethod: "" | ExpensePaymentMethod;
  clientId: string;
  taskId: string;
  documentId: string;
  purchaseOrderId: string;
};

type IncomeForm = {
  occurredOn: string;
  description: string;
  amount: string;
  paymentMethod: "" | ExpensePaymentMethod;
  reference: string;
  note: string;
  clientId: string;
  taskId: string;
  invoiceId: string;
};

function todayInput() {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function emptyExpenseForm(): ExpenseForm {
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
    purchaseOrderId: "",
  };
}

function emptyIncomeForm(): IncomeForm {
  return {
    occurredOn: todayInput(),
    description: "",
    amount: "",
    paymentMethod: "bank",
    reference: "",
    note: "",
    clientId: "",
    taskId: "",
    invoiceId: "",
  };
}

const paymentLabels: Record<ExpensePaymentMethod, string> = {
  cash: "Numerar",
  card: "Card",
  bank: "Transfer",
  other: "Altă metodă",
};

const invoiceStatus: Record<FinanceInvoiceWithBalance["status"], string> = {
  draft: "Ciornă",
  sent: "Trimisă",
  accepted: "Acceptată",
  issued: "Emisă extern",
  paid: "Achitată",
  cancelled: "Anulată",
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

function ProcurementMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[11px] border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2">
      <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)]">{label}</p>
      <p className="mt-1 truncate text-[10px] font-semibold">{value}</p>
    </div>
  );
}

function dateLabel(value: string | null, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

export default function ExpensesModule({
  organizationId,
  locale,
  role,
  enabledModules,
  onOpenModule,
  initialCreate = false,
  initialClientId,
  initialTaskId,
  initialEstimateId,
  initialPurchaseOrderId,
  initialDocumentId,
}: Props) {
  const canWrite = ["owner", "admin", "manager"].includes(role);
  const [tab, setTab] = useState<Tab>(initialCreate ? "expenses" : "overview");
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [income, setIncome] = useState<FinanceIncomeEntry[]>([]);
  const [invoices, setInvoices] = useState<FinanceInvoiceWithBalance[]>([]);
  const [clients, setClients] = useState<ExpenseClientLink[]>([]);
  const [tasks, setTasks] = useState<ExpenseTaskLink[]>([]);
  const [documents, setDocuments] = useState<ExpenseDocumentLink[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<ExpensePurchaseOrderLink[]>([]);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(() => ({
    ...emptyExpenseForm(),
    clientId: initialClientId ?? "",
    taskId: initialTaskId ?? "",
    purchaseOrderId: initialPurchaseOrderId ?? "",
    documentId: initialDocumentId ?? "",
  }));
  const [incomeForm, setIncomeForm] = useState<IncomeForm>(() => ({
    ...emptyIncomeForm(),
    clientId: initialClientId ?? "",
    taskId: initialTaskId ?? "",
  }));
  const [expenseOpen, setExpenseOpen] = useState(Boolean(initialCreate && canWrite));
  useWorkspaceCreateFocus(expenseOpen);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [issueInvoiceId, setIssueInvoiceId] = useState("");
  const [issueDueOn, setIssueDueOn] = useState(inDays(15));
  const [issueReference, setIssueReference] = useState("");
  const [scopeTaskId, setScopeTaskId] = useState(initialCreate ? "" : (initialTaskId ?? ""));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [evidenceOnly, setEvidenceOnly] = useState(false);
  const [evidenceExpenseId, setEvidenceExpenseId] = useState("");
  const [evidenceDocumentId, setEvidenceDocumentId] = useState("");
  useWorkspaceLiveContext({
    clientId: expenseForm.clientId || incomeForm.clientId || initialClientId,
    taskId: scopeTaskId || expenseForm.taskId || incomeForm.taskId || undefined,
    estimateId: initialEstimateId,
    purchaseOrderId: expenseForm.purchaseOrderId || initialPurchaseOrderId,
    documentId: expenseForm.documentId || initialDocumentId,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextExpenses, nextIncome, nextInvoices, contexts] = await Promise.all([
        listExpenses(organizationId),
        listIncomeEntries(organizationId),
        listFinanceInvoices(organizationId),
        listExpenseContexts(organizationId),
      ]);
      setExpenses(nextExpenses);
      setIncome(nextIncome);
      setInvoices(nextInvoices);
      setClients(contexts.clients);
      setTasks(contexts.tasks);
      setDocuments(contexts.documents);
      setPurchaseOrders(contexts.purchaseOrders);

      if (initialDocumentId) {
        const document = contexts.documents.find((item) => item.id === initialDocumentId);
        if (document) {
          setExpenseForm((current) => ({
            ...current,
            documentId: document.id,
            description: current.description || document.name,
            clientId: document.client_id || current.clientId,
            taskId: document.task_id || current.taskId,
            purchaseOrderId: document.purchase_order_id || current.purchaseOrderId,
          }));
        }
      }

      if (initialTaskId) {
        const task = contexts.tasks.find((item) => item.id === initialTaskId);
        if (task?.client_id) {
          setExpenseForm((current) => ({ ...current, clientId: task.client_id! }));
          setIncomeForm((current) => ({ ...current, clientId: task.client_id! }));
        }
      }

      if (initialPurchaseOrderId) {
        const order = contexts.purchaseOrders.find((item) => item.purchase_order_id === initialPurchaseOrderId);
        if (order) {
          const remaining = Math.max(0, order.ordered_cents - order.recorded_expense_cents);
          setExpenseForm((current) => ({
            ...current,
            purchaseOrderId: order.purchase_order_id,
            category: "Achiziții stoc",
            vendor: order.supplier_name,
            description: current.description || ("Achiziție " + order.reference + " · " + order.supplier_name),
            amount: current.amount || (remaining > 0 ? (remaining / 100).toFixed(2) : ""),
            taskId: order.task_id || current.taskId,
            clientId: order.client_id || current.clientId,
          }));
        }
      }
    } catch (reason) {
      console.error(reason);
      setError("Finanțele nu au putut fi încărcate.");
    } finally {
      setLoading(false);
    }
  }, [organizationId, initialDocumentId, initialPurchaseOrderId, initialTaskId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const clientById = useMemo(() => new Map(clients.map((item) => [item.id, item.name])), [clients]);
  const taskById = useMemo(() => new Map(tasks.map((item) => [item.id, item.title])), [tasks]);
  const docById = useMemo(() => new Map(documents.map((item) => [item.id, item.name])), [documents]);
  const purchaseOrderById = useMemo(
    () => new Map(purchaseOrders.map((item) => [item.purchase_order_id, item])),
    [purchaseOrders]
  );

  const scopedExpenses = useMemo(
    () => scopeTaskId ? expenses.filter((item) => item.task_id === scopeTaskId) : expenses,
    [expenses, scopeTaskId]
  );
  const scopedIncome = useMemo(
    () => scopeTaskId ? income.filter((item) => item.task_id === scopeTaskId) : income,
    [income, scopeTaskId]
  );
  const scopedInvoices = useMemo(
    () => scopeTaskId ? invoices.filter((item) => item.task_id === scopeTaskId) : invoices,
    [invoices, scopeTaskId]
  );

  const scopedPurchaseOrders = useMemo(
    () => scopeTaskId ? purchaseOrders.filter((item) => item.task_id === scopeTaskId) : purchaseOrders,
    [purchaseOrders, scopeTaskId]
  );

  const visibleExpenses = useMemo(
    () => evidenceOnly ? scopedExpenses.filter((item) => !item.document_id) : scopedExpenses,
    [evidenceOnly, scopedExpenses]
  );

  const metrics = useMemo(() => {
    const currentMonth = monthKey(todayInput());
    const monthExpenses = scopedExpenses
      .filter((item) => item.currency === "RON" && monthKey(item.occurred_on) === currentMonth)
      .reduce((sum, item) => sum + item.amount_cents, 0);
    const monthIncome = scopedIncome
      .filter((item) => item.currency === "RON" && monthKey(item.occurred_on) === currentMonth)
      .reduce((sum, item) => sum + item.amount_cents, 0);
    const outstanding = scopedInvoices
      .filter((item) => item.currency === "RON" && ["issued", "paid"].includes(item.status))
      .reduce((sum, item) => sum + item.outstanding_cents, 0);
    const overdue = scopedInvoices.filter(
      (item) => item.status === "issued" && item.outstanding_cents > 0 && item.due_on && item.due_on < todayInput()
    ).length;
    const missingEvidence = scopedExpenses.filter((item) => !item.document_id).length;
    const draftInvoices = scopedInvoices.filter((item) => item.status === "draft").length;
    const openInvoices = scopedInvoices.filter(
      (item) => item.status === "issued" && item.outstanding_cents > 0
    ).length;
    return {
      monthExpenses,
      monthIncome,
      cashFlow: monthIncome - monthExpenses,
      outstanding,
      overdue,
      missingEvidence,
      draftInvoices,
      openInvoices,
    };
  }, [scopedExpenses, scopedIncome, scopedInvoices]);

  const chooseExpenseTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    setExpenseForm((current) => ({
      ...current,
      taskId,
      clientId: task?.client_id || current.clientId,
    }));
  };

  const choosePurchaseOrder = (purchaseOrderId: string, open = false) => {
    const order = purchaseOrderById.get(purchaseOrderId);
    setExpenseForm((current) => {
      if (!order) {
        return { ...current, purchaseOrderId: "" };
      }
      const remaining = Math.max(0, order.ordered_cents - order.recorded_expense_cents);
      return {
        ...current,
        purchaseOrderId,
        category: "Achiziții stoc",
        vendor: order.supplier_name,
        description: "Achiziție " + order.reference + " · " + order.supplier_name,
        amount: remaining > 0 ? (remaining / 100).toFixed(2) : current.amount,
        taskId: order.task_id || "",
        clientId: order.client_id || "",
      };
    });
    if (open) {
      setTab("expenses");
      setExpenseOpen(true);
    }
  };

  const chooseExpenseDocument = (documentId: string) => {
    const document = documents.find((item) => item.id === documentId);
    setExpenseForm((current) => ({
      ...current,
      documentId,
      purchaseOrderId: document?.purchase_order_id || current.purchaseOrderId,
    }));
    if (document?.purchase_order_id) {
      const order = purchaseOrderById.get(document.purchase_order_id);
      if (order) {
        setExpenseForm((current) => ({
          ...current,
          purchaseOrderId: order.purchase_order_id,
          vendor: order.supplier_name,
          taskId: order.task_id || current.taskId,
          clientId: order.client_id || current.clientId,
        }));
      }
    }
  };

  const chooseIncomeTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    setIncomeForm((current) => ({
      ...current,
      taskId,
      clientId: task?.client_id || current.clientId,
    }));
  };

  const chooseInvoice = (invoiceId: string) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    setIncomeForm((current) => ({
      ...current,
      invoiceId,
      clientId: invoice?.client_id || current.clientId,
      taskId: invoice?.task_id || current.taskId,
      description: invoice ? `Încasare ${invoice.external_reference || invoice.reference}` : current.description,
      amount: invoice ? (invoice.outstanding_cents / 100).toFixed(2) : current.amount,
    }));
  };

  const handleExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await createExpense(organizationId, {
        occurredOn: expenseForm.occurredOn,
        category: expenseForm.category,
        vendor: expenseForm.vendor,
        description: expenseForm.description,
        amountLei: Number(expenseForm.amount),
        paymentMethod: expenseForm.paymentMethod || null,
        clientId: expenseForm.clientId || null,
        taskId: expenseForm.taskId || null,
        documentId: expenseForm.documentId || null,
        estimateId: initialEstimateId || null,
        purchaseOrderId: expenseForm.purchaseOrderId || null,
      });
      setExpenseForm(emptyExpenseForm());
      setExpenseOpen(false);
      setMessage("Cheltuiala a fost înregistrată.");
      await load();
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : "Cheltuiala nu a putut fi salvată.");
    } finally {
      setSaving(false);
    }
  };

  const attachEvidence = async (expense: BusinessExpense) => {
    if (!canWrite || saving || !evidenceDocumentId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await attachExpenseDocument(
        organizationId,
        expense.id,
        evidenceDocumentId
      );
      setExpenses((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setEvidenceExpenseId("");
      setEvidenceDocumentId("");
      setMessage("Dovada a fost atașată cheltuielii.");
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : "Dovada nu a putut fi atașată.");
    } finally {
      setSaving(false);
    }
  };

  const compatibleEvidenceDocuments = (expense: BusinessExpense) =>
    documents.filter(
      (document) =>
        !expenses.some(
          (item) => item.id !== expense.id && item.document_id === document.id
        ) &&
        (!expense.client_id || !document.client_id || expense.client_id === document.client_id) &&
        (!expense.task_id || !document.task_id || expense.task_id === document.task_id) &&
        (!expense.estimate_id || !document.estimate_id || expense.estimate_id === document.estimate_id) &&
        (!expense.purchase_order_id ||
          !document.purchase_order_id ||
          expense.purchase_order_id === document.purchase_order_id)
    );

  const handleIncome = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const selectedInvoice = incomeForm.invoiceId
        ? invoices.find((item) => item.id === incomeForm.invoiceId)
        : null;
      const receivedCents = Math.round(Number(incomeForm.amount || 0) * 100);
      await createIncome(organizationId, {
        occurredOn: incomeForm.occurredOn,
        description: incomeForm.description,
        amountLei: Number(incomeForm.amount),
        paymentMethod: incomeForm.paymentMethod || null,
        reference: incomeForm.reference,
        note: incomeForm.note,
        clientId: incomeForm.clientId || null,
        taskId: incomeForm.taskId || null,
        estimateId: incomeForm.invoiceId ? null : (initialEstimateId || null),
        commercialDocumentId: incomeForm.invoiceId || null,
      });
      setIncomeForm(emptyIncomeForm());
      setIncomeOpen(false);
      if (selectedInvoice) {
        const remaining = Math.max(0, selectedInvoice.outstanding_cents - receivedCents);
        setMessage(
          remaining === 0
            ? "Încasarea a fost înregistrată. Factura a trecut automat la «Achitată»."
            : `Plata parțială a fost înregistrată. Mai rămân de încasat ${formatMoney(remaining, selectedInvoice.currency, locale)}.`
        );
      } else {
        setMessage("Încasarea a fost înregistrată.");
      }
      await load();
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : "Încasarea nu a putut fi salvată.");
    } finally {
      setSaving(false);
    }
  };

  const confirmIssued = async (invoice: FinanceInvoiceWithBalance) => {
    if (!canWrite || saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await markInvoiceIssuedExternally(organizationId, invoice.id, {
        dueOn: issueDueOn,
        externalReference: issueReference,
      });
      setIssueInvoiceId("");
      setIssueReference("");
      setIssueDueOn(inDays(15));
      setMessage("Emiterea externă a fost confirmată. ORBYVEN urmărește de acum scadența și încasarea.");
      await load();
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : "Documentul nu a putut fi actualizat.");
    } finally {
      setSaving(false);
    }
  };

  const removeExpense = async (expense: BusinessExpense) => {
    if (!canWrite || saving || !window.confirm(`Ștergi cheltuiala „${expense.description}”?`)) return;
    setSaving(true);
    setError("");
    try {
      await deleteExpense(organizationId, expense.id);
      await load();
    } catch (reason) {
      console.error(reason);
      setError("Cheltuiala nu a putut fi ștearsă.");
    } finally {
      setSaving(false);
    }
  };

  const removeIncome = async (entry: FinanceIncomeEntry) => {
    if (!canWrite || saving || !window.confirm(`Ștergi încasarea „${entry.description}”?`)) return;
    setSaving(true);
    setError("");
    try {
      await deleteIncome(organizationId, entry.id);
      await load();
    } catch (reason) {
      console.error(reason);
      setError("Încasarea nu a putut fi ștearsă.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="pb-24 text-sm text-[var(--muted)]">Se încarcă finanțele…</div>;
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Rezumat" },
    { id: "expenses", label: "Cheltuieli" },
    { id: "income", label: "Încasări" },
    { id: "invoices", label: "Facturi & scadențe" },
    ...(enabledModules.includes("inventory") ? [{ id: "procurement" as const, label: "Achiziții furnizor" }] : []),
  ];

  return (
    <div className="pb-24 md:pb-8">
      <ModuleHeader
        eyebrow="ORBYVEN · FINANCE"
        title="Finanțe"
        description="Venituri, cheltuieli, încasări și scadențe legate de client și lucrare. Este un registru operațional, nu contabilitate și nu emite facturi fiscale."
        action={canWrite ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setTab("expenses"); setExpenseOpen((value) => !value); }}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 text-[11px] font-semibold"
            >
              + Cheltuială
            </button>
            <button
              type="button"
              onClick={() => { setTab("income"); setIncomeOpen((value) => !value); }}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--button)] px-4 text-[11px] font-semibold text-[var(--button-text)]"
            >
              + Încasare
            </button>
          </div>
        ) : null}
      />

      <div className="mt-5"><ModuleError message={error} /></div>
      {message ? (
        <p role="status" className="mt-3 rounded-[14px] border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-[11px] text-emerald-300">
          {message}
        </p>
      ) : null}

      <ModuleProgressiveMetrics
        className="mt-6"
        primary={<>
          <ModuleMetric label="Cashflow lunar" value={formatMoney(metrics.cashFlow, "RON", locale)} note="încasări minus cheltuieli · RON" />
          <ModuleMetric label="De încasat" value={formatMoney(metrics.outstanding, "RON", locale)} note={metrics.overdue ? `${metrics.overdue} scadențe depășite` : "fără restanțe · RON"} />
          <ModuleMetric label="Încasări luna aceasta" value={formatMoney(metrics.monthIncome, "RON", locale)} note="registru operațional · RON" />
        </>}
        secondary={<ModuleMetric label="Cheltuieli luna aceasta" value={formatMoney(metrics.monthExpenses, "RON", locale)} note="registru operațional · RON" />}
      />

      <div className="mt-3">
        {metrics.overdue > 0 ? (
          <ModuleNextAction
            title={`${metrics.overdue} scadențe necesită atenție`}
            description="Începe cu sumele restante; acestea au prioritate față de analiza istorică."
            action={<button type="button" onClick={() => setTab("invoices")} className="h-9 rounded-full bg-[var(--button)] px-4 text-[11px] font-semibold text-[var(--button-text)]">Vezi de încasat →</button>}
          />
        ) : metrics.missingEvidence > 0 ? (
          <ModuleNextAction
            title={`${metrics.missingEvidence} cheltuieli sunt fără document justificativ`}
            description="Completează dovada ca dosarul financiar și operațional să rămână coerent."
            action={<button type="button" onClick={() => { setEvidenceOnly(true); setTab("expenses"); }} className="h-9 rounded-full bg-[var(--button)] px-4 text-[11px] font-semibold text-[var(--button-text)]">Rezolvă dovezile →</button>}
          />
        ) : scopeTaskId && metrics.draftInvoices > 0 ? (
          <ModuleNextAction
            title={`${metrics.draftInvoices} factură/facturi sunt încă în ciornă`}
            description="Confirmă emiterea doar după ce documentul fiscal a fost emis în sistemul extern folosit de firmă."
            action={<button type="button" onClick={() => setTab("invoices")} className="h-9 rounded-full bg-[var(--button)] px-4 text-[11px] font-semibold text-[var(--button-text)]">Verifică factura →</button>}
          />
        ) : scopeTaskId && metrics.openInvoices > 0 ? (
          <ModuleNextAction
            title="Încasarea lucrării este încă deschisă"
            description={`Mai sunt de încasat ${formatMoney(metrics.outstanding, "RON", locale)} pentru documentele emise ale acestei lucrări.`}
            action={<button type="button" onClick={() => setTab("invoices")} className="h-9 rounded-full bg-[var(--button)] px-4 text-[11px] font-semibold text-[var(--button-text)]">Vezi încasarea →</button>}
          />
        ) : scopeTaskId && scopedInvoices.length === 0 && enabledModules.includes("estimates") ? (
          <ModuleNextAction
            title="Nu există încă un document comercial pentru această lucrare"
            description="Verifică oferta asociată. Ciorna financiară se generează din circuitul comercial, fără dublarea datelor."
            action={<button type="button" onClick={() => onOpenModule("estimates", { taskId: scopeTaskId })} className="h-9 rounded-full bg-[var(--button)] px-4 text-[11px] font-semibold text-[var(--button-text)]">Deschide oferta →</button>}
          />
        ) : (
          <ModuleNextAction
            title={scopeTaskId ? "Închiderea financiară este în regulă" : "Nu există o problemă financiară urgentă"}
            description={scopeTaskId
              ? "Nu există restanțe, dovezi lipsă sau pași financiari deschiși detectați pentru această lucrare."
              : "Poți continua cu înregistrările curente sau analiza cashflow-ului."}
          />
        )}
      </div>

      {scopeTaskId ? (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">Context lucrare</span>
          <button
            type="button"
            onClick={() => setScopeTaskId("")}
            className="max-w-[280px] truncate rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] font-semibold"
          >
            {taskById.get(scopeTaskId) || "Lucrare"} · ×
          </button>
        </div>
      ) : null}

      <nav aria-label="Secțiuni financiare" className="mt-5 flex gap-1 overflow-x-auto rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)]/55 p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 rounded-[10px] px-3.5 py-2 text-[11px] font-semibold transition ${
              tab === item.id ? "bg-[var(--surface)] text-[var(--text)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {expenseOpen && canWrite ? (
        <form data-workspace-create-focus={expenseOpen ? "true" : undefined} onSubmit={handleExpense} className="mt-4 scroll-mt-28 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-sm font-semibold">Cheltuială nouă</h2><p className="mt-1 text-[10px] text-[var(--muted)]">{expenseForm.purchaseOrderId ? "Costul de achiziție intră în cashflow; materialul intră în costul lucrării doar când este consumat din stoc." : "Leag-o de lucrare pentru costurile operaționale care nu vin din stoc."}</p></div>
            <button type="button" onClick={() => setExpenseOpen(false)} className="text-lg text-[var(--muted)]">×</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Data *"><input type="date" value={expenseForm.occurredOn} onChange={(e) => setExpenseForm((c) => ({ ...c, occurredOn: e.target.value }))} className={moduleInputClass} /></Field>
            <Field label="Categorie *"><input value={expenseForm.category} onChange={(e) => setExpenseForm((c) => ({ ...c, category: e.target.value }))} className={moduleInputClass} /></Field>
            <Field label="Sumă (lei) *"><input type="number" min="0.01" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm((c) => ({ ...c, amount: e.target.value }))} className={moduleInputClass} /></Field>
            <Field label="Descriere *"><input value={expenseForm.description} onChange={(e) => setExpenseForm((c) => ({ ...c, description: e.target.value }))} className={moduleInputClass} /></Field>
          </div>
          <ModuleAdvancedFields label="Legături și dovadă">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Furnizor"><input disabled={Boolean(expenseForm.purchaseOrderId)} value={expenseForm.vendor} onChange={(e) => setExpenseForm((c) => ({ ...c, vendor: e.target.value }))} className={`${moduleInputClass} disabled:opacity-60`} /></Field>
              <Field label="Plată"><select value={expenseForm.paymentMethod} onChange={(e) => setExpenseForm((c) => ({ ...c, paymentMethod: e.target.value as ExpenseForm["paymentMethod"] }))} className={moduleInputClass}><option value="">Nespecificat</option>{(Object.keys(paymentLabels) as ExpensePaymentMethod[]).map((key) => <option key={key} value={key}>{paymentLabels[key]}</option>)}</select></Field>
              <Field label="Client"><select value={expenseForm.clientId} disabled={Boolean(expenseForm.purchaseOrderId || tasks.find((item) => item.id === expenseForm.taskId)?.client_id)} onChange={(e) => setExpenseForm((c) => ({ ...c, clientId: e.target.value }))} className={`${moduleInputClass} disabled:opacity-60`}><option value="">Fără client</option>{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
              <Field label="Lucrare"><select disabled={Boolean(expenseForm.purchaseOrderId)} value={expenseForm.taskId} onChange={(e) => chooseExpenseTask(e.target.value)} className={`${moduleInputClass} disabled:opacity-60`}><option value="">Fără lucrare</option>{tasks.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>
              <Field label="Document justificativ"><select value={expenseForm.documentId} onChange={(e) => chooseExpenseDocument(e.target.value)} className={moduleInputClass}><option value="">Fără document</option>{documents.filter((item) => !expenseForm.purchaseOrderId || !item.purchase_order_id || item.purchase_order_id === expenseForm.purchaseOrderId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
              {enabledModules.includes("inventory") ? <Field label="Comandă furnizor"><select value={expenseForm.purchaseOrderId} onChange={(e) => choosePurchaseOrder(e.target.value)} className={moduleInputClass}><option value="">Fără comandă furnizor</option>{purchaseOrders.filter((item) => ["ordered","partially_received","received"].includes(item.status)).map((item) => <option key={item.purchase_order_id} value={item.purchase_order_id}>{item.reference} · {item.supplier_name}</option>)}</select></Field> : null}
            </div>
          </ModuleAdvancedFields>
          {initialEstimateId ? <p className="mt-3 text-[10px] text-[var(--muted)]">Va fi asociată și devizului din care ai deschis Finanțe.</p> : null}
          <div className="mt-4 flex justify-end"><button disabled={saving} className="h-10 rounded-full bg-[var(--button)] px-5 text-[11px] font-semibold text-[var(--button-text)] disabled:opacity-40">{saving ? "Se salvează…" : "Salvează cheltuiala"}</button></div>
        </form>
      ) : null}

      {incomeOpen && canWrite ? (
        <form onSubmit={handleIncome} className="mt-4 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-sm font-semibold">Încasare nouă</h2><p className="mt-1 text-[10px] text-[var(--muted)]">Poți lega plata de un document emis extern sau o poți înregistra manual.</p></div>
            <button type="button" onClick={() => setIncomeOpen(false)} className="text-lg text-[var(--muted)]">×</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Factură / document">
              <select value={incomeForm.invoiceId} onChange={(e) => chooseInvoice(e.target.value)} className={moduleInputClass}>
                <option value="">Încasare manuală</option>
                {invoices.filter((item) => item.status === "issued" && item.outstanding_cents > 0).map((item) => (
                  <option key={item.id} value={item.id}>{item.external_reference || item.reference} · {formatMoney(item.outstanding_cents, item.currency, locale)}</option>
                ))}
              </select>
            </Field>
            <Field label="Data *"><input type="date" value={incomeForm.occurredOn} onChange={(e) => setIncomeForm((c) => ({ ...c, occurredOn: e.target.value }))} className={moduleInputClass} /></Field>
            <Field label="Sumă (lei) *"><input type="number" min="0.01" step="0.01" value={incomeForm.amount} onChange={(e) => setIncomeForm((c) => ({ ...c, amount: e.target.value }))} className={moduleInputClass} /></Field>
            <Field label="Descriere *"><input value={incomeForm.description} onChange={(e) => setIncomeForm((c) => ({ ...c, description: e.target.value }))} className={moduleInputClass} /></Field>
          </div>
          <ModuleAdvancedFields label="Asocieri și referință">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Metodă">
              <select value={incomeForm.paymentMethod} onChange={(e) => setIncomeForm((c) => ({ ...c, paymentMethod: e.target.value as IncomeForm["paymentMethod"] }))} className={moduleInputClass}>
                <option value="">Nespecificat</option>
                {(Object.keys(paymentLabels) as ExpensePaymentMethod[]).map((key) => <option key={key} value={key}>{paymentLabels[key]}</option>)}
              </select>
            </Field>
            <Field label="Referință plată"><input value={incomeForm.reference} onChange={(e) => setIncomeForm((c) => ({ ...c, reference: e.target.value }))} className={moduleInputClass} placeholder="OP, chitanță internă…" /></Field>
            <Field label="Client">
              <select disabled={Boolean(incomeForm.invoiceId || tasks.find((item) => item.id === incomeForm.taskId)?.client_id)} value={incomeForm.clientId} onChange={(e) => setIncomeForm((c) => ({ ...c, clientId: e.target.value }))} className={moduleInputClass}>
                <option value="">Fără client</option>{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </Field>
            <Field label="Lucrare">
              <select disabled={Boolean(incomeForm.invoiceId)} value={incomeForm.taskId} onChange={(e) => chooseIncomeTask(e.target.value)} className={moduleInputClass}>
                <option value="">Fără lucrare</option>{tasks.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </Field>
            <Field label="Notă"><input value={incomeForm.note} onChange={(e) => setIncomeForm((c) => ({ ...c, note: e.target.value }))} className={moduleInputClass} /></Field>
            </div>
          </ModuleAdvancedFields>
          <div className="mt-4 flex justify-end"><button disabled={saving} className="h-10 rounded-full bg-[var(--button)] px-5 text-[11px] font-semibold text-[var(--button-text)] disabled:opacity-40">{saving ? "Se salvează…" : "Înregistrează încasarea"}</button></div>
        </form>
      ) : null}

      {tab === "overview" ? (
        <section className="mt-4 grid gap-3 lg:grid-cols-2">
          <article className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">DE ÎNCASAT</p>
            <h2 className="mt-1 text-[15px] font-semibold">Scadențe apropiate</h2>
            <div className="mt-3 grid gap-2">
              {scopedInvoices.filter((item) => item.status === "issued" && item.outstanding_cents > 0).slice(0, 5).map((invoice) => (
                <button key={invoice.id} type="button" onClick={() => setTab("invoices")} className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)]/55 px-3 py-3 text-left">
                  <span className="min-w-0"><span className="block truncate text-[11px] font-semibold">{invoice.external_reference || invoice.reference} · {invoice.title}</span><span className="mt-0.5 block text-[10px] text-[var(--muted)]">Scadență {dateLabel(invoice.due_on, locale)}</span></span>
                  <strong className="shrink-0 text-[11px]">{formatMoney(invoice.outstanding_cents, invoice.currency, locale)}</strong>
                </button>
              ))}
              {!scopedInvoices.some((item) => item.status === "issued" && item.outstanding_cents > 0) ? <ModuleEmpty title="Nicio sumă restantă" description="Documentele emise extern cu scadență vor apărea aici." /> : null}
            </div>
          </article>
          <article className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">ULTIMELE MIȘCĂRI</p>
            <h2 className="mt-1 text-[15px] font-semibold">Cashflow operațional</h2>
            <div className="mt-3 grid gap-2">
              {[
                ...scopedIncome.slice(0, 4).map((item) => ({ key: `i-${item.id}`, date: item.occurred_on, title: item.description, cents: item.amount_cents, currency: item.currency, direction: "in" as const })),
                ...scopedExpenses.slice(0, 4).map((item) => ({ key: `e-${item.id}`, date: item.occurred_on, title: item.description, cents: item.amount_cents, currency: item.currency, direction: "out" as const })),
              ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)]/55 px-3 py-3">
                  <span className="min-w-0"><span className="block truncate text-[11px] font-semibold">{row.title}</span><span className="text-[10px] text-[var(--muted)]">{dateLabel(row.date, locale)}</span></span>
                  <strong className={`shrink-0 text-[11px] ${row.direction === "in" ? "text-emerald-400" : "text-rose-400"}`}>{row.direction === "in" ? "+" : "−"}{formatMoney(row.cents, row.currency, locale)}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {tab === "expenses" ? (
        <section className="mt-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-[15px] font-semibold">Cheltuieli</h2><p className="mt-1 text-[10px] text-[var(--muted)]">{metrics.missingEvidence} fără document justificativ</p></div>
            <button type="button" onClick={() => setEvidenceOnly((value) => !value)} className={`h-9 rounded-full border px-3 text-[10px] font-semibold ${evidenceOnly ? "border-amber-400/30 bg-amber-400/[0.08] text-amber-300" : "border-[var(--border-strong)]"}`}>
              {evidenceOnly ? "Arată toate" : "Doar fără document"}
            </button>
          </div>
          {visibleExpenses.length ? (
            <div className="mt-3 grid gap-2">
              {visibleExpenses.map((expense) => {
                const evidenceDocuments = compatibleEvidenceDocuments(expense);
                const evidenceOpen = evidenceExpenseId === expense.id;
                return (
                  <article key={expense.id} className="grid gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)]/50 p-3 sm:grid-cols-[110px_1fr_auto] sm:items-center">
                    <div><p className="text-[11px] font-semibold">{dateLabel(expense.occurred_on, locale)}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{expense.category}</p></div>
                    <div className="min-w-0"><p className="truncate text-[11px] font-semibold">{expense.description}</p><p className="mt-1 truncate text-[10px] text-[var(--muted)]">{expense.vendor || "Fără furnizor"}{expense.purchase_order_id ? ` · PO ${purchaseOrderById.get(expense.purchase_order_id)?.reference || "achiziție"}` : ""}{expense.client_id ? ` · ${clientById.get(expense.client_id) || "Client"}` : ""}{expense.task_id ? ` · ${taskById.get(expense.task_id) || "Lucrare"}` : ""}{expense.document_id ? ` · ${docById.get(expense.document_id) || "Document"}` : " · fără dovadă"}</p></div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <strong className="text-[11px]">{formatMoney(expense.amount_cents, expense.currency, locale)}</strong>
                      {canWrite && !expense.document_id ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            setEvidenceExpenseId((current) => current === expense.id ? "" : expense.id);
                            setEvidenceDocumentId(evidenceDocuments.length === 1 ? evidenceDocuments[0].id : "");
                          }}
                          className="text-[10px] font-semibold text-[var(--accent)] disabled:opacity-40"
                        >
                          {evidenceOpen ? "Închide" : "Atașează dovadă"}
                        </button>
                      ) : null}
                      {canWrite ? <button type="button" disabled={saving} onClick={() => void removeExpense(expense)} className="text-[10px] font-semibold text-rose-400 disabled:opacity-40">Șterge</button> : null}
                    </div>
                    {evidenceOpen && !expense.document_id ? (
                      <div className="sm:col-span-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3">
                        {evidenceDocuments.length ? (
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <select
                              value={evidenceDocumentId}
                              onChange={(event) => setEvidenceDocumentId(event.target.value)}
                              className={moduleInputClass + " min-w-0 flex-1"}
                            >
                              <option value="">Alege documentul justificativ</option>
                              {evidenceDocuments.map((document) => (
                                <option key={document.id} value={document.id}>{document.name}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={saving || !evidenceDocumentId}
                              onClick={() => void attachEvidence(expense)}
                              className="h-11 rounded-[10px] bg-[var(--button)] px-4 text-[11px] font-semibold text-[var(--button-text)] disabled:opacity-40"
                            >
                              Atașează
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[10px] text-[var(--muted)]">Nu există încă un document compatibil pentru această cheltuială.</p>
                            {enabledModules.includes("documents") ? (
                              <button
                                type="button"
                                onClick={() => onOpenModule("documents", { create: true, taskId: expense.task_id ?? undefined, purchaseOrderId: expense.purchase_order_id ?? undefined })}
                                className="h-9 rounded-full border border-[var(--border-strong)] px-3 text-[10px] font-semibold"
                              >
                                + Încarcă dovadă
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : <div className="mt-3"><ModuleEmpty title={evidenceOnly ? "Toate au document" : "Nicio cheltuială"} description={evidenceOnly ? "Nu există cheltuieli fără document justificativ în contextul curent." : "Adaugă doar costurile utile operațional."} /></div>}
        </section>
      ) : null}

      {tab === "procurement" ? (
        <section className="mt-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">PROCUREMENT ↔ FINANCE</p>
              <h2 className="mt-1 text-[15px] font-semibold">Costuri furnizor pe comandă</h2>
              <p className="mt-1 max-w-2xl text-[10px] leading-4 text-[var(--muted)]">Valoarea PO și recepția vin din Stoc & achiziții. Sumele înregistrate aici intră în cashflow, dar nu dublează costul material al lucrării: acel cost apare la consumul efectiv din stoc.</p>
            </div>
            {enabledModules.includes("documents") ? (
              <button type="button" onClick={() => onOpenModule("documents", { create: true })} className="h-9 rounded-full border border-[var(--border-strong)] px-3 text-[10px] font-semibold">+ Document furnizor</button>
            ) : null}
          </div>

          {scopedPurchaseOrders.length ? (
            <div className="mt-4 grid gap-2 lg:grid-cols-2">
              {scopedPurchaseOrders.map((order) => {
                const financeReady = ["ordered", "partially_received", "received"].includes(order.status);
                const remainingToOrder = Math.max(0, order.ordered_cents - order.recorded_expense_cents);
                const variance = order.recorded_expense_cents - order.ordered_cents;
                return (
                  <article key={order.purchase_order_id} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold">{order.reference} · {order.supplier_name}</p>
                        <p className="mt-1 text-[10px] text-[var(--muted)]">{order.status}{order.task_id ? " · " + (taskById.get(order.task_id) || "Lucrare") : " · achiziție generală"}</p>
                      </div>
                      <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[9px] font-semibold">{order.document_count} doc. · {order.expense_count} înregistrări</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <ProcurementMetric label="PO" value={formatMoney(order.ordered_cents, order.currency, locale)} />
                      <ProcurementMetric label="Recepționat" value={formatMoney(order.received_cents, order.currency, locale)} />
                      <ProcurementMetric label="Înregistrat" value={formatMoney(order.recorded_expense_cents, order.currency, locale)} />
                      <ProcurementMetric label="Dif. vs PO" value={(variance > 0 ? "+" : "") + formatMoney(variance, order.currency, locale)} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                      <p className="text-[9px] text-[var(--muted)]">
                        {order.received_without_recorded_expense_cents > 0
                          ? formatMoney(order.received_without_recorded_expense_cents, order.currency, locale) + " recepționat fără cost înregistrat"
                          : remainingToOrder > 0
                            ? formatMoney(remainingToOrder, order.currency, locale) + " diferență până la valoarea PO"
                            : "Valoarea PO este acoperită de înregistrările financiare."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {enabledModules.includes("documents") ? (
                          <button type="button" onClick={() => onOpenModule("documents", { create: true, taskId: order.task_id ?? undefined, purchaseOrderId: order.purchase_order_id })} className="h-8 rounded-full border border-[var(--border-strong)] px-3 text-[9px] font-semibold">+ Dovadă</button>
                        ) : null}
                        {financeReady ? (
                          <button type="button" onClick={() => choosePurchaseOrder(order.purchase_order_id, true)} className="h-8 rounded-full bg-[var(--button)] px-3 text-[9px] font-semibold text-[var(--button-text)]">+ Cost furnizor</button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-4"><ModuleEmpty title="Nicio comandă furnizor" description="Comenzile create în Stoc & achiziții apar aici pentru dovadă și cashflow." /></div>
          )}
        </section>
      ) : null}

      {tab === "income" ? (
        <section className="mt-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-[15px] font-semibold">Încasări</h2>
          {scopedIncome.length ? (
            <div className="mt-3 grid gap-2">
              {scopedIncome.map((entry) => (
                <article key={entry.id} className="grid gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)]/50 p-3 sm:grid-cols-[110px_1fr_auto] sm:items-center">
                  <div><p className="text-[11px] font-semibold">{dateLabel(entry.occurred_on, locale)}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{entry.source_type === "invoice" ? "Document" : "Manual"}</p></div>
                  <div className="min-w-0"><p className="truncate text-[11px] font-semibold">{entry.description}</p><p className="mt-1 truncate text-[10px] text-[var(--muted)]">{entry.reference || paymentLabels[entry.payment_method || "other"]}{entry.client_id ? ` · ${clientById.get(entry.client_id) || "Client"}` : ""}{entry.task_id ? ` · ${taskById.get(entry.task_id) || "Lucrare"}` : ""}</p></div>
                  <div className="flex items-center gap-3"><strong className="text-[11px] text-emerald-400">+{formatMoney(entry.amount_cents, entry.currency, locale)}</strong>{canWrite ? <button type="button" disabled={saving} onClick={() => void removeIncome(entry)} className="text-[10px] font-semibold text-rose-400">Șterge</button> : null}</div>
                </article>
              ))}
            </div>
          ) : <div className="mt-3"><ModuleEmpty title="Nicio încasare" description="Înregistrează plățile primite sau leagă-le de documentele emise extern." /></div>}
        </section>
      ) : null}

      {tab === "invoices" ? (
        <section className="mt-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-[15px] font-semibold">Facturi & scadențe</h2><p className="mt-1 max-w-2xl text-[10px] leading-4 text-[var(--muted)]">ORBYVEN urmărește aici ciorna, confirmarea emiterii în sistemul tău fiscal și încasarea. Nu generează serie fiscală și nu trimite documente la ANAF.</p></div>
          </div>
          {scopedInvoices.length ? (
            <div className="mt-4 grid gap-2">
              {scopedInvoices.map((invoice) => {
                const overdue = invoice.status === "issued" && invoice.outstanding_cents > 0 && invoice.due_on && invoice.due_on < todayInput();
                return (
                  <article key={invoice.id} className="rounded-[15px] border border-[var(--border)] bg-[var(--surface-2)]/50 p-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0"><p className="truncate text-[12px] font-semibold">{invoice.external_reference || invoice.reference} · {invoice.title}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{invoiceStatus[invoice.status]}{invoice.due_on ? ` · scadență ${dateLabel(invoice.due_on, locale)}` : ""}{overdue ? " · RESTANTĂ" : ""}</p></div>
                      <div className="text-right"><p className="text-[12px] font-semibold">{formatMoney(invoice.total_cents, invoice.currency, locale)}</p><p className="mt-1 text-[10px] text-[var(--muted)]">încasat {formatMoney(invoice.paid_cents, invoice.currency, locale)} · rest {formatMoney(invoice.outstanding_cents, invoice.currency, locale)}</p></div>
                    </div>
                    {invoice.status === "draft" && canWrite ? (
                      issueInvoiceId === invoice.id ? (
                        <div className="mt-3 grid gap-2 rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)] p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                          <Field label="Scadență *"><input type="date" value={issueDueOn} onChange={(e) => setIssueDueOn(e.target.value)} className={moduleInputClass} /></Field>
                          <Field label="Nr. factură extern (opțional)"><input value={issueReference} onChange={(e) => setIssueReference(e.target.value)} className={moduleInputClass} placeholder="ex. FCT 123" /></Field>
                          <button type="button" disabled={saving} onClick={() => void confirmIssued(invoice)} className="h-10 rounded-[10px] bg-[var(--button)] px-4 text-[10px] font-semibold text-[var(--button-text)] disabled:opacity-40">Confirmă emisă extern</button>
                          <p className="sm:col-span-3 text-[9px] leading-4 text-amber-300">Confirmi doar că factura a fost emisă în afara ORBYVEN. Acest buton nu emite o factură fiscală.</p>
                        </div>
                      ) : (
                        <button type="button" onClick={() => { setIssueInvoiceId(invoice.id); setIssueDueOn(inDays(15)); setIssueReference(""); }} className="mt-3 rounded-[9px] border border-[var(--border-strong)] px-3 py-2 text-[10px] font-semibold">Confirmă emiterea externă</button>
                      )
                    ) : null}
                    {invoice.status === "issued" && invoice.outstanding_cents > 0 && canWrite ? (
                      <button type="button" onClick={() => { setTab("income"); setIncomeOpen(true); chooseInvoice(invoice.id); }} className="mt-3 rounded-[9px] border border-emerald-400/25 bg-emerald-400/[0.07] px-3 py-2 text-[10px] font-semibold text-emerald-300">+ Înregistrează plată</button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : <div className="mt-3"><ModuleEmpty title="Nicio ciornă de factură" description="Ciornele create din Oferte vor apărea automat aici." /></div>}
        </section>
      ) : null}
    </div>
  );
}
