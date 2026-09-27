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
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ExpenseClientLink = { id: string; name: string };
export type ExpenseTaskLink = { id: string; title: string; client_id: string | null };
export type ExpenseDocumentLink = { id: string; name: string };

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
};

const FIELDS =
  "id,organization_id,occurred_on,category,vendor,description,amount_cents,currency,payment_method,client_id,task_id,document_id,estimate_id,created_by,created_at,updated_at";

function requireOrganizationId(organizationId: string) {
  if (!organizationId.trim()) throw new Error("organization_id is required.");
}

function leiToCents(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100));
}

export async function listExpenses(organizationId: string): Promise<BusinessExpense[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("finance_expenses")
    .select(FIELDS)
    .eq("organization_id", organizationId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BusinessExpense[];
}

export async function listExpenseContexts(organizationId: string) {
  requireOrganizationId(organizationId);
  const [clientsResult, tasksResult, documentsResult] = await Promise.all([
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
      .select("id,name")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
  ]);
  if (clientsResult.error) throw clientsResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (documentsResult.error) throw documentsResult.error;
  return {
    clients: (clientsResult.data ?? []) as ExpenseClientLink[],
    tasks: (tasksResult.data ?? []) as ExpenseTaskLink[],
    documents: (documentsResult.data ?? []) as ExpenseDocumentLink[],
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
  if (input.taskId) {
    const { data: task, error: taskError } = await orbyvenSupabase
      .from("ops_tasks")
      .select("id,client_id")
      .eq("organization_id", organizationId)
      .eq("id", input.taskId)
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
  let linkedTaskId=input.taskId || null;
  if (input.estimateId) {
    const {data: estimate,error: estimateError}=await orbyvenSupabase.from("sales_estimates")
      .select("id,client_id,task_id").eq("organization_id",organizationId).eq("id",input.estimateId).single();
    if(estimateError||!estimate)throw new Error("Devizul nu există în această firmă.");
    if(linkedTaskId&&estimate.task_id&&linkedTaskId!==estimate.task_id)throw new Error("Lucrarea nu corespunde devizului.");
    if(linkedClientId&&estimate.client_id&&linkedClientId!==estimate.client_id)throw new Error("Clientul nu corespunde devizului.");
    linkedTaskId=estimate.task_id||linkedTaskId;
    linkedClientId=estimate.client_id||linkedClientId;
  }
  if (input.documentId) {
    const { data: document, error: documentError } = await orbyvenSupabase
      .from("ops_documents")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", input.documentId)
      .single();
    if (documentError || !document) throw new Error("Documentul nu există în această firmă.");
  }

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { data, error } = await orbyvenSupabase
    .from("finance_expenses")
    .insert({
      organization_id: organizationId,
      occurred_on: input.occurredOn || new Date().toISOString().slice(0, 10),
      category,
      vendor: input.vendor?.trim() || null,
      description,
      amount_cents: amountCents,
      currency: (input.currency?.trim() || "RON").toUpperCase(),
      payment_method: input.paymentMethod || null,
      client_id: linkedClientId,
      task_id: linkedTaskId,
      estimate_id: input.estimateId || null,
      document_id: input.documentId || null,
      created_by: authData.user?.id ?? null,
    })
    .select(FIELDS)
    .single();
  if (error) throw error;
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
