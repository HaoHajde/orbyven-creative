import { orbyvenSupabase } from "@/lib/orbyven-supabase";

export type ExpensePaymentMethod = "cash" | "card" | "bank" | "other";

export type BusinessExpense = {
  id: string;
  organization_id: string;
  occurred_on: string;
  category: string;
  vendor: string | null;
  description: string;
  amount_cents: number;
  currency: string;
  payment_method: ExpensePaymentMethod | null;
  client_id: string | null;
  task_id: string | null;
  document_id: string | null;
  estimate_id: string | null;
  purchase_order_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FinanceIncomeEntry = {
  id: string;
  organization_id: string;
  occurred_on: string;
  source_type: "invoice" | "manual";
  commercial_document_id: string | null;
  client_id: string | null;
  task_id: string | null;
  estimate_id: string | null;
  description: string;
  amount_cents: number;
  currency: string;
  payment_method: ExpensePaymentMethod | null;
  reference: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FinanceInvoice = {
  id: string;
  organization_id: string;
  estimate_id: string;
  client_id: string | null;
  task_id: string | null;
  document_type: "invoice_draft";
  reference: string;
  status: "draft" | "sent" | "accepted" | "issued" | "paid" | "cancelled";
  title: string;
  currency: string;
  total_cents: number;
  issued_at: string | null;
  paid_at: string | null;
  due_on: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
};

export type FinanceInvoiceWithBalance = FinanceInvoice & {
  paid_cents: number;
  outstanding_cents: number;
};

export type ExpenseClientLink = { id: string; name: string };
export type ExpenseTaskLink = { id: string; title: string; client_id: string | null };
export type ExpenseDocumentLink = {
  id: string;
  name: string;
  client_id: string | null;
  task_id: string | null;
  estimate_id: string | null;
  purchase_order_id: string | null;
};
export type ExpensePurchaseOrderLink = {
  organization_id: string;
  purchase_order_id: string;
  reference: string;
  supplier_id: string;
  supplier_name: string;
  task_id: string | null;
  client_id: string | null;
  status: "draft" | "ordered" | "partially_received" | "received" | "cancelled";
  currency: string;
  ordered_on: string | null;
  expected_on: string | null;
  ordered_cents: number;
  received_cents: number;
  recorded_expense_cents: number;
  expense_count: number;
  document_count: number;
  variance_to_order_cents: number;
  received_without_recorded_expense_cents: number;
};

export type CreateExpenseInput = {
  occurredOn: string;
  category: string;
  vendor?: string;
  description: string;
  amountLei: number;
  currency?: string;
  paymentMethod?: ExpensePaymentMethod | null;
  clientId?: string | null;
  taskId?: string | null;
  documentId?: string | null;
  estimateId?: string | null;
  purchaseOrderId?: string | null;
};

export type CreateIncomeInput = {
  occurredOn: string;
  description: string;
  amountLei: number;
  currency?: string;
  paymentMethod?: ExpensePaymentMethod | null;
  reference?: string;
  note?: string;
  clientId?: string | null;
  taskId?: string | null;
  estimateId?: string | null;
  commercialDocumentId?: string | null;
};

const EXPENSE_FIELDS =
  "id,organization_id,occurred_on,category,vendor,description,amount_cents,currency,payment_method,client_id,task_id,document_id,estimate_id,purchase_order_id,created_by,created_at,updated_at";
const INCOME_FIELDS =
  "id,organization_id,occurred_on,source_type,commercial_document_id,client_id,task_id,estimate_id,description,amount_cents,currency,payment_method,reference,note,created_by,created_at,updated_at";
const INVOICE_FIELDS =
  "id,organization_id,estimate_id,client_id,task_id,document_type,reference,status,title,currency,total_cents,issued_at,paid_at,due_on,external_reference,created_at,updated_at";

function requireOrganizationId(organizationId: string) {
  if (!organizationId.trim()) throw new Error("organization_id is required.");
}

function leiToCents(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100));
}

function cleanOptional(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

async function getInvoice(organizationId: string, invoiceId: string): Promise<FinanceInvoice> {
  const { data, error } = await orbyvenSupabase
    .from("sales_commercial_documents")
    .select(INVOICE_FIELDS)
    .eq("organization_id", organizationId)
    .eq("id", invoiceId)
    .eq("document_type", "invoice_draft")
    .single();
  if (error || !data) throw new Error("Documentul comercial nu este disponibil în această firmă.");
  return data as FinanceInvoice;
}

async function paidForInvoice(organizationId: string, invoiceId: string) {
  const { data, error } = await orbyvenSupabase
    .from("finance_income_entries")
    .select("amount_cents")
    .eq("organization_id", organizationId)
    .eq("commercial_document_id", invoiceId);
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount_cents || 0), 0);
}

async function syncInvoicePaidStatus(
  organizationId: string,
  invoice: FinanceInvoice,
  paidCents?: number
) {
  if (!["issued", "paid"].includes(invoice.status)) return;
  const paid = paidCents ?? await paidForInvoice(organizationId, invoice.id);
  const isPaid = invoice.total_cents > 0 && paid >= invoice.total_cents;
  const nextStatus = isPaid ? "paid" : "issued";
  const nextPaidAt = isPaid ? invoice.paid_at || new Date().toISOString() : null;
  if (invoice.status === nextStatus && invoice.paid_at === nextPaidAt) return;

  const { error } = await orbyvenSupabase
    .from("sales_commercial_documents")
    .update({ status: nextStatus, paid_at: nextPaidAt })
    .eq("organization_id", organizationId)
    .eq("id", invoice.id)
    .eq("document_type", "invoice_draft");
  if (error) throw error;
}

export async function listExpenses(organizationId: string): Promise<BusinessExpense[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("finance_expenses")
    .select(EXPENSE_FIELDS)
    .eq("organization_id", organizationId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BusinessExpense[];
}

export async function listIncomeEntries(organizationId: string): Promise<FinanceIncomeEntry[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("finance_income_entries")
    .select(INCOME_FIELDS)
    .eq("organization_id", organizationId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FinanceIncomeEntry[];
}

export async function listFinanceInvoices(
  organizationId: string
): Promise<FinanceInvoiceWithBalance[]> {
  requireOrganizationId(organizationId);
  const [invoiceResult, incomeResult] = await Promise.all([
    orbyvenSupabase
      .from("sales_commercial_documents")
      .select(INVOICE_FIELDS)
      .eq("organization_id", organizationId)
      .eq("document_type", "invoice_draft")
      .order("updated_at", { ascending: false }),
    orbyvenSupabase
      .from("finance_income_entries")
      .select("commercial_document_id,amount_cents")
      .eq("organization_id", organizationId)
      .not("commercial_document_id", "is", null),
  ]);
  if (invoiceResult.error) throw invoiceResult.error;
  if (incomeResult.error) throw incomeResult.error;

  const paid = new Map<string, number>();
  for (const row of incomeResult.data ?? []) {
    if (!row.commercial_document_id) continue;
    paid.set(
      row.commercial_document_id,
      (paid.get(row.commercial_document_id) ?? 0) + Number(row.amount_cents || 0)
    );
  }

  return ((invoiceResult.data ?? []) as FinanceInvoice[]).map((invoice) => {
    const paidCents = paid.get(invoice.id) ?? 0;
    return {
      ...invoice,
      paid_cents: paidCents,
      outstanding_cents: Math.max(0, invoice.total_cents - paidCents),
    };
  });
}

export async function listExpenseContexts(organizationId: string) {
  requireOrganizationId(organizationId);
  const [clientsResult, tasksResult, documentsResult, purchaseOrdersResult] = await Promise.all([
    orbyvenSupabase
      .from("crm_leads")
      .select("id,name")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    orbyvenSupabase
      .from("ops_tasks")
      .select("id,title,client_id")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false }),
    orbyvenSupabase
      .from("ops_documents")
      .select("id,name,client_id,task_id,estimate_id,purchase_order_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    orbyvenSupabase
      .from("ops_purchase_order_finance_status")
      .select("organization_id,purchase_order_id,reference,supplier_id,supplier_name,task_id,client_id,status,currency,ordered_on,expected_on,ordered_cents,received_cents,recorded_expense_cents,expense_count,document_count,variance_to_order_cents,received_without_recorded_expense_cents")
      .eq("organization_id", organizationId)
      .neq("status", "cancelled")
      .order("ordered_on", { ascending: false, nullsFirst: false })
      .limit(200),
  ]);
  if (clientsResult.error) throw clientsResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (documentsResult.error) throw documentsResult.error;
  if (purchaseOrdersResult.error) throw purchaseOrdersResult.error;
  return {
    clients: (clientsResult.data ?? []) as ExpenseClientLink[],
    tasks: (tasksResult.data ?? []) as ExpenseTaskLink[],
    documents: (documentsResult.data ?? []) as ExpenseDocumentLink[],
    purchaseOrders: ((purchaseOrdersResult.data ?? []) as ExpensePurchaseOrderLink[]).map((row) => ({
      ...row,
      ordered_cents: Number(row.ordered_cents || 0),
      received_cents: Number(row.received_cents || 0),
      recorded_expense_cents: Number(row.recorded_expense_cents || 0),
      expense_count: Number(row.expense_count || 0),
      document_count: Number(row.document_count || 0),
      variance_to_order_cents: Number(row.variance_to_order_cents || 0),
      received_without_recorded_expense_cents: Number(row.received_without_recorded_expense_cents || 0),
    })),
  };
}

export async function createExpense(
  organizationId: string,
  input: CreateExpenseInput
): Promise<BusinessExpense> {
  requireOrganizationId(organizationId);
  const description = input.description.trim();
  const category = input.category.trim() || "other";
  const amountCents = leiToCents(Number(input.amountLei));
  if (!description) throw new Error("Descrierea cheltuielii este obligatorie.");
  if (amountCents <= 0) throw new Error("Valoarea trebuie să fie mai mare decât zero.");

  let linkedClientId = input.clientId || null;
  let linkedTaskId = input.taskId || null;
  let linkedEstimateId = input.estimateId || null;
  let linkedPurchaseOrderId = input.purchaseOrderId || null;
  let linkedVendor = cleanOptional(input.vendor);
  let linkedCurrency = (input.currency?.trim() || "RON").toUpperCase();
  if (linkedTaskId) {
    const { data: task, error: taskError } = await orbyvenSupabase
      .from("ops_tasks")
      .select("id,client_id")
      .eq("organization_id", organizationId)
      .eq("id", linkedTaskId)
      .single();
    if (taskError || !task) throw new Error("Lucrarea nu există în această firmă.");
    if (linkedClientId && task.client_id && linkedClientId !== task.client_id) {
      throw new Error("Clientul ales nu corespunde lucrării.");
    }
    linkedClientId = task.client_id || linkedClientId;
  }
  if (linkedClientId) {
    const { data: client, error: clientError } = await orbyvenSupabase
      .from("crm_leads")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", linkedClientId)
      .single();
    if (clientError || !client) throw new Error("Clientul nu există în această firmă.");
  }
  if (linkedEstimateId) {
    const { data: estimate, error: estimateError } = await orbyvenSupabase
      .from("sales_estimates")
      .select("id,client_id,task_id")
      .eq("organization_id", organizationId)
      .eq("id", linkedEstimateId)
      .single();
    if (estimateError || !estimate) throw new Error("Devizul nu există în această firmă.");
    if (linkedTaskId && estimate.task_id && linkedTaskId !== estimate.task_id) {
      throw new Error("Lucrarea nu corespunde devizului.");
    }
    if (linkedClientId && estimate.client_id && linkedClientId !== estimate.client_id) {
      throw new Error("Clientul nu corespunde devizului.");
    }
    linkedTaskId = estimate.task_id || linkedTaskId;
    linkedClientId = estimate.client_id || linkedClientId;
  }
  if (input.documentId) {
    const { data: document, error: documentError } = await orbyvenSupabase
      .from("ops_documents")
      .select("id,client_id,task_id,estimate_id,purchase_order_id")
      .eq("organization_id", organizationId)
      .eq("id", input.documentId)
      .single();
    if (documentError || !document) throw new Error("Documentul nu există în această firmă.");
    if (linkedClientId && document.client_id && linkedClientId !== document.client_id) {
      throw new Error("Clientul cheltuielii nu corespunde documentului justificativ.");
    }
    if (linkedTaskId && document.task_id && linkedTaskId !== document.task_id) {
      throw new Error("Lucrarea cheltuielii nu corespunde documentului justificativ.");
    }
    if (linkedEstimateId && document.estimate_id && linkedEstimateId !== document.estimate_id) {
      throw new Error("Devizul cheltuielii nu corespunde documentului justificativ.");
    }
    if (linkedPurchaseOrderId && document.purchase_order_id && linkedPurchaseOrderId !== document.purchase_order_id) {
      throw new Error("Comanda furnizor a cheltuielii nu corespunde documentului justificativ.");
    }
    linkedClientId = document.client_id || linkedClientId;
    linkedTaskId = document.task_id || linkedTaskId;
    linkedEstimateId = document.estimate_id || linkedEstimateId;
    linkedPurchaseOrderId = document.purchase_order_id || linkedPurchaseOrderId;
  }

  if (linkedPurchaseOrderId) {
    const { data: order, error: orderError } = await orbyvenSupabase
      .from("ops_purchase_orders")
      .select("id,reference,supplier_id,task_id,status,currency")
      .eq("organization_id", organizationId)
      .eq("id", linkedPurchaseOrderId)
      .in("status", ["ordered", "partially_received", "received"])
      .single();
    if (orderError || !order) {
      throw new Error("Comanda furnizor trebuie să fie comandată sau recepționată înainte de înregistrarea costului.");
    }
    if (linkedTaskId && order.task_id && linkedTaskId !== order.task_id) {
      throw new Error("Lucrarea cheltuielii nu corespunde comenzii furnizor.");
    }
    linkedTaskId = order.task_id || linkedTaskId;
    linkedCurrency = (order.currency || linkedCurrency).toUpperCase();

    const { data: supplier, error: supplierError } = await orbyvenSupabase
      .from("ops_suppliers")
      .select("name")
      .eq("organization_id", organizationId)
      .eq("id", order.supplier_id)
      .single();
    if (supplierError || !supplier) throw new Error("Furnizorul comenzii nu este disponibil.");
    linkedVendor = supplier.name;
    linkedCurrency = order.currency || linkedCurrency;

    if (linkedTaskId) {
      const { data: task, error: taskError } = await orbyvenSupabase
        .from("ops_tasks")
        .select("client_id")
        .eq("organization_id", organizationId)
        .eq("id", linkedTaskId)
        .single();
      if (taskError || !task) throw new Error("Lucrarea comenzii furnizor nu este disponibilă.");
      if (linkedClientId && task.client_id && linkedClientId !== task.client_id) {
        throw new Error("Clientul cheltuielii nu corespunde comenzii furnizor.");
      }
      linkedClientId = task.client_id || linkedClientId;
    }
  }

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { data, error } = await orbyvenSupabase
    .from("finance_expenses")
    .insert({
      organization_id: organizationId,
      occurred_on: input.occurredOn || new Date().toISOString().slice(0, 10),
      category,
      vendor: linkedVendor,
      description,
      amount_cents: amountCents,
      currency: linkedCurrency,
      payment_method: input.paymentMethod || null,
      client_id: linkedClientId,
      task_id: linkedTaskId,
      estimate_id: linkedEstimateId,
      document_id: input.documentId || null,
      purchase_order_id: linkedPurchaseOrderId,
      created_by: authData.user?.id ?? null,
    })
    .select(EXPENSE_FIELDS)
    .single();
  if (error) throw error;
  return data as BusinessExpense;
}

export async function markInvoiceIssuedExternally(
  organizationId: string,
  invoiceId: string,
  input: { dueOn: string; externalReference?: string | null }
): Promise<FinanceInvoice> {
  requireOrganizationId(organizationId);
  const invoice = await getInvoice(organizationId, invoiceId);
  if (invoice.status !== "draft") {
    throw new Error("Doar o ciornă poate fi confirmată ca emisă extern.");
  }
  if (!input.dueOn) throw new Error("Scadența este obligatorie.");

  const now = new Date().toISOString();
  const { data, error } = await orbyvenSupabase
    .from("sales_commercial_documents")
    .update({
      status: "issued",
      issued_at: now,
      due_on: input.dueOn,
      external_reference: cleanOptional(input.externalReference),
    })
    .eq("organization_id", organizationId)
    .eq("id", invoiceId)
    .eq("document_type", "invoice_draft")
    .eq("status", "draft")
    .select(INVOICE_FIELDS)
    .single();
  if (error || !data) {
    throw new Error("Documentul nu a fost actualizat; reîncarcă modulul.");
  }
  return data as FinanceInvoice;
}

export async function createIncome(
  organizationId: string,
  input: CreateIncomeInput
): Promise<FinanceIncomeEntry> {
  requireOrganizationId(organizationId);
  const description = input.description.trim();
  const amountCents = leiToCents(Number(input.amountLei));
  if (!description) throw new Error("Descrierea încasării este obligatorie.");
  if (amountCents <= 0) throw new Error("Suma încasată trebuie să fie mai mare decât zero.");

  let clientId = input.clientId || null;
  let taskId = input.taskId || null;
  let estimateId = input.estimateId || null;
  const commercialDocumentId = input.commercialDocumentId || null;
  let currency = (input.currency?.trim() || "RON").toUpperCase();
  let sourceType: "invoice" | "manual" = "manual";
  let invoice: FinanceInvoice | null = null;

  if (commercialDocumentId) {
    sourceType = "invoice";
    invoice = await getInvoice(organizationId, commercialDocumentId);
    if (!["issued", "paid"].includes(invoice.status)) {
      throw new Error("Confirmă mai întâi emiterea externă a documentului.");
    }
    const alreadyPaid = await paidForInvoice(organizationId, invoice.id);
    const outstanding = Math.max(0, invoice.total_cents - alreadyPaid);
    if (outstanding <= 0) throw new Error("Documentul este deja achitat integral.");
    if (amountCents > outstanding) {
      throw new Error("Încasarea depășește suma rămasă de primit.");
    }
    clientId = invoice.client_id;
    taskId = invoice.task_id;
    estimateId = invoice.estimate_id;
    currency = invoice.currency;
  } else if (taskId) {
    const { data: task, error: taskError } = await orbyvenSupabase
      .from("ops_tasks")
      .select("id,client_id")
      .eq("organization_id", organizationId)
      .eq("id", taskId)
      .single();
    if (taskError || !task) throw new Error("Lucrarea nu există în această firmă.");
    if (clientId && task.client_id && clientId !== task.client_id) {
      throw new Error("Clientul ales nu corespunde lucrării.");
    }
    clientId = task.client_id || clientId;
  }

  if (!commercialDocumentId && estimateId) {
    const { data: estimate, error: estimateError } = await orbyvenSupabase
      .from("sales_estimates")
      .select("id,client_id,task_id,currency")
      .eq("organization_id", organizationId)
      .eq("id", estimateId)
      .single();
    if (estimateError || !estimate) throw new Error("Devizul nu există în această firmă.");
    if (taskId && estimate.task_id && taskId !== estimate.task_id) {
      throw new Error("Lucrarea nu corespunde devizului.");
    }
    if (clientId && estimate.client_id && clientId !== estimate.client_id) {
      throw new Error("Clientul nu corespunde devizului.");
    }
    taskId = estimate.task_id || taskId;
    clientId = estimate.client_id || clientId;
    currency = estimate.currency || currency;
  }

  if (clientId) {
    const { data: client, error: clientError } = await orbyvenSupabase
      .from("crm_leads")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", clientId)
      .single();
    if (clientError || !client) throw new Error("Clientul nu există în această firmă.");
  }

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { data, error } = await orbyvenSupabase
    .from("finance_income_entries")
    .insert({
      organization_id: organizationId,
      occurred_on: input.occurredOn || new Date().toISOString().slice(0, 10),
      source_type: sourceType,
      commercial_document_id: commercialDocumentId,
      client_id: clientId,
      task_id: taskId,
      estimate_id: estimateId,
      description,
      amount_cents: amountCents,
      currency,
      payment_method: input.paymentMethod || null,
      reference: cleanOptional(input.reference),
      note: cleanOptional(input.note),
      created_by: authData.user?.id ?? null,
    })
    .select(INCOME_FIELDS)
    .single();
  if (error) throw error;

  if (invoice) {
    await syncInvoicePaidStatus(
      organizationId,
      invoice,
      (await paidForInvoice(organizationId, invoice.id))
    );
  }
  return data as FinanceIncomeEntry;
}

export async function attachExpenseDocument(
  organizationId: string,
  expenseId: string,
  documentId: string
): Promise<BusinessExpense> {
  requireOrganizationId(organizationId);
  if (!expenseId.trim() || !documentId.trim()) {
    throw new Error("Cheltuiala și documentul sunt obligatorii.");
  }

  const [expenseResult, documentResult, duplicateResult] = await Promise.all([
    orbyvenSupabase
      .from("finance_expenses")
      .select(EXPENSE_FIELDS)
      .eq("organization_id", organizationId)
      .eq("id", expenseId)
      .single(),
    orbyvenSupabase
      .from("ops_documents")
      .select("id,client_id,task_id,estimate_id,purchase_order_id")
      .eq("organization_id", organizationId)
      .eq("id", documentId)
      .single(),
    orbyvenSupabase
      .from("finance_expenses")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("document_id", documentId)
      .neq("id", expenseId)
      .limit(1),
  ]);

  if (expenseResult.error || !expenseResult.data) {
    throw new Error("Cheltuiala nu există în această firmă.");
  }
  if (documentResult.error || !documentResult.data) {
    throw new Error("Documentul nu există în această firmă.");
  }
  if (duplicateResult.error) throw duplicateResult.error;
  if ((duplicateResult.data ?? []).length > 0) {
    throw new Error("Documentul este deja folosit ca dovadă pentru altă cheltuială.");
  }

  const expense = expenseResult.data as BusinessExpense;
  const document = documentResult.data;
  if (expense.client_id && document.client_id && expense.client_id !== document.client_id) {
    throw new Error("Documentul aparține altui client.");
  }
  if (expense.task_id && document.task_id && expense.task_id !== document.task_id) {
    throw new Error("Documentul aparține altei lucrări.");
  }
  if (
    expense.purchase_order_id &&
    document.purchase_order_id &&
    expense.purchase_order_id !== document.purchase_order_id
  ) {
    throw new Error("Documentul aparține altei comenzi furnizor.");
  }

  const { data, error } = await orbyvenSupabase
    .from("finance_expenses")
    .update({ document_id: documentId })
    .eq("organization_id", organizationId)
    .eq("id", expenseId)
    .select(EXPENSE_FIELDS)
    .single();

  if (error || !data) {
    throw error ?? new Error("Dovada nu a putut fi atașată cheltuielii.");
  }
  return data as BusinessExpense;
}

export async function deleteExpense(organizationId: string, expenseId: string) {
  requireOrganizationId(organizationId);
  const { error } = await orbyvenSupabase
    .from("finance_expenses")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", expenseId);
  if (error) throw error;
}

export async function deleteIncome(organizationId: string, incomeId: string) {
  requireOrganizationId(organizationId);
  const { data: existing, error: loadError } = await orbyvenSupabase
    .from("finance_income_entries")
    .select("id,commercial_document_id")
    .eq("organization_id", organizationId)
    .eq("id", incomeId)
    .single();
  if (loadError || !existing) throw new Error("Încasarea nu mai este disponibilă.");

  const invoice = existing.commercial_document_id
    ? await getInvoice(organizationId, existing.commercial_document_id)
    : null;

  const { error } = await orbyvenSupabase
    .from("finance_income_entries")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", incomeId);
  if (error) throw error;

  if (invoice) {
    await syncInvoicePaidStatus(organizationId, invoice);
  }
}
