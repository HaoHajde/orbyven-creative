import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import type { Estimate, EstimateItem } from "@/lib/modules/estimates";

export type MaterialRequirementStatus = "planned" | "ordered" | "bought";
export type CommercialDocumentType = "offer" | "invoice_draft";
export type CommercialDocumentStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "issued"
  | "paid"
  | "cancelled";
export type BudgetEntryStatus = "planned" | "committed" | "actual";

export type MaterialRecipe = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MaterialRecipeItem = {
  id: string;
  organization_id: string;
  recipe_id: string;
  description: string;
  quantity_per_unit: number;
  unit: string;
  unit_cost_cents: number;
  vendor: string | null;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MaterialRequirement = {
  id: string;
  organization_id: string;
  estimate_id: string;
  source_recipe_id: string | null;
  source_estimate_item_id: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_cost_cents: number;
  vendor: string | null;
  status: MaterialRequirementStatus;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CommercialDocument = {
  id: string;
  organization_id: string;
  estimate_id: string;
  client_id: string | null;
  task_id: string | null;
  document_type: CommercialDocumentType;
  reference: string;
  status: CommercialDocumentStatus;
  title: string;
  currency: string;
  subtotal_cents: number;
  discount_cents: number;
  tax_rate: number | null;
  total_cents: number;
  snapshot: Record<string, unknown>;
  generated_from_updated_at: string | null;
  issued_at: string | null;
  paid_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BudgetEntry = {
  id: string;
  organization_id: string;
  estimate_id: string;
  client_id: string | null;
  task_id: string | null;
  source_type: "materials" | "invoice";
  direction: "income" | "expense";
  status: BudgetEntryStatus;
  description: string;
  amount_cents: number;
  currency: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkflowExpense = {
  id: string;
  estimate_id: string | null;
  task_id: string | null;
  description: string;
  amount_cents: number;
  currency: string;
  occurred_on: string;
};

export type CreateMaterialRequirementInput = {
  description: string;
  quantity: number;
  unit?: string;
  unitCostLei?: number;
  vendor?: string;
  estimateItemId?: string | null;
};

const RECIPE_FIELDS =
  "id,organization_id,name,description,created_by,created_at,updated_at";
const RECIPE_ITEM_FIELDS =
  "id,organization_id,recipe_id,description,quantity_per_unit,unit,unit_cost_cents,vendor,position,created_by,created_at,updated_at";
const REQUIREMENT_FIELDS =
  "id,organization_id,estimate_id,source_recipe_id,source_estimate_item_id,description,quantity,unit,unit_cost_cents,vendor,status,position,created_by,created_at,updated_at";
const DOCUMENT_FIELDS =
  "id,organization_id,estimate_id,client_id,task_id,document_type,reference,status,title,currency,subtotal_cents,discount_cents,tax_rate,total_cents,snapshot,generated_from_updated_at,issued_at,paid_at,created_by,created_at,updated_at";
const BUDGET_FIELDS =
  "id,organization_id,estimate_id,client_id,task_id,source_type,direction,status,description,amount_cents,currency,created_by,created_at,updated_at";

function requireOrganizationId(organizationId: string) {
  if (!organizationId.trim()) throw new Error("organization_id is required.");
}

function leiToCents(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100));
}

function cleanOptional(value?: string | null) {
  const next = value?.trim();
  return next ? next : null;
}

function randomReference(prefix: string) {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const token =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()
      : Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${token}`;
}

export async function listMaterialRecipes(organizationId: string): Promise<MaterialRecipe[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("ops_material_recipes")
    .select(RECIPE_FIELDS)
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MaterialRecipe[];
}

export async function listMaterialRecipeItems(
  organizationId: string,
  recipeId: string
): Promise<MaterialRecipeItem[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("ops_material_recipe_items")
    .select(RECIPE_ITEM_FIELDS)
    .eq("organization_id", organizationId)
    .eq("recipe_id", recipeId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MaterialRecipeItem[];
}

export async function listMaterialRequirements(
  organizationId: string,
  estimateId: string
): Promise<MaterialRequirement[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("sales_material_requirements")
    .select(REQUIREMENT_FIELDS)
    .eq("organization_id", organizationId)
    .eq("estimate_id", estimateId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MaterialRequirement[];
}

export async function listCommercialDocuments(
  organizationId: string,
  estimateId: string
): Promise<CommercialDocument[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("sales_commercial_documents")
    .select(DOCUMENT_FIELDS)
    .eq("organization_id", organizationId)
    .eq("estimate_id", estimateId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CommercialDocument[];
}

export async function listBudgetEntries(
  organizationId: string,
  estimateId?: string
): Promise<BudgetEntry[]> {
  requireOrganizationId(organizationId);
  let query = orbyvenSupabase
    .from("finance_budget_entries")
    .select(BUDGET_FIELDS)
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (estimateId) query = query.eq("estimate_id", estimateId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BudgetEntry[];
}

export async function listActualExpensesForEstimate(
  organizationId: string,
  estimateId: string,
  taskId?: string | null
): Promise<WorkflowExpense[]> {
  requireOrganizationId(organizationId);
  let query = orbyvenSupabase
    .from("finance_expenses")
    .select("id,estimate_id,task_id,description,amount_cents,currency,occurred_on")
    .eq("organization_id", organizationId);

  query = taskId
    ? query.or(`estimate_id.eq.${estimateId},task_id.eq.${taskId}`)
    : query.eq("estimate_id", estimateId);

  const { data, error } = await query.order("occurred_on", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WorkflowExpense[];
}

export async function addMaterialRequirement(
  organizationId: string,
  estimateId: string,
  input: CreateMaterialRequirementInput
): Promise<MaterialRequirement> {
  requireOrganizationId(organizationId);
  const description = input.description.trim();
  const quantity = Number(input.quantity);
  if (!description) throw new Error("Descrierea materialului este obligatorie.");
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Cantitatea trebuie să fie mai mare decât zero.");

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { count } = await orbyvenSupabase
    .from("sales_material_requirements")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("estimate_id", estimateId);

  const { data, error } = await orbyvenSupabase
    .from("sales_material_requirements")
    .insert({
      organization_id: organizationId,
      estimate_id: estimateId,
      source_estimate_item_id: input.estimateItemId || null,
      description,
      quantity,
      unit: cleanOptional(input.unit) || "buc",
      unit_cost_cents: leiToCents(Number(input.unitCostLei ?? 0)),
      vendor: cleanOptional(input.vendor),
      position: count ?? 0,
      created_by: authData.user?.id ?? null,
    })
    .select(REQUIREMENT_FIELDS)
    .single();
  if (error) throw error;
  await refreshEstimateBudget(organizationId, estimateId);
  return data as MaterialRequirement;
}

export async function deleteMaterialRequirement(
  organizationId: string,
  estimateId: string,
  requirementId: string
) {
  requireOrganizationId(organizationId);
  const { error } = await orbyvenSupabase
    .from("sales_material_requirements")
    .delete()
    .eq("organization_id", organizationId)
    .eq("estimate_id", estimateId)
    .eq("id", requirementId);
  if (error) throw error;
  await refreshEstimateBudget(organizationId, estimateId);
}

export async function setMaterialRequirementStatus(
  organizationId: string,
  estimateId: string,
  requirementId: string,
  status: MaterialRequirementStatus
): Promise<MaterialRequirement> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("sales_material_requirements")
    .update({ status })
    .eq("organization_id", organizationId)
    .eq("estimate_id", estimateId)
    .eq("id", requirementId)
    .select(REQUIREMENT_FIELDS)
    .single();
  if (error) throw error;
  await refreshEstimateBudget(organizationId, estimateId);
  return data as MaterialRequirement;
}

export async function saveRequirementsAsRecipe(
  organizationId: string,
  estimateId: string,
  name: string
): Promise<MaterialRecipe> {
  requireOrganizationId(organizationId);
  const recipeName = name.trim();
  if (!recipeName) throw new Error("Dă un nume șablonului.");
  const requirements = await listMaterialRequirements(organizationId, estimateId);
  if (!requirements.length) throw new Error("Adaugă cel puțin un material înainte să salvezi șablonul.");

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { data: recipe, error } = await orbyvenSupabase
    .from("ops_material_recipes")
    .insert({
      organization_id: organizationId,
      name: recipeName,
      description: `Creat din necesarul devizului ${estimateId}`,
      created_by: authData.user?.id ?? null,
    })
    .select(RECIPE_FIELDS)
    .single();
  if (error) throw error;

  const rows = requirements.map((item, index) => ({
    organization_id: organizationId,
    recipe_id: recipe.id,
    description: item.description,
    quantity_per_unit: Number(item.quantity),
    unit: item.unit,
    unit_cost_cents: Number(item.unit_cost_cents),
    vendor: item.vendor,
    position: index,
    created_by: authData.user?.id ?? null,
  }));

  const { error: itemError } = await orbyvenSupabase
    .from("ops_material_recipe_items")
    .insert(rows);

  if (itemError) {
    await orbyvenSupabase
      .from("ops_material_recipes")
      .delete()
      .eq("organization_id", organizationId)
      .eq("id", recipe.id);
    throw itemError;
  }

  return recipe as MaterialRecipe;
}

export async function applyMaterialRecipe(
  organizationId: string,
  estimateId: string,
  recipeId: string,
  multiplier: number,
  estimateItemId?: string | null
): Promise<MaterialRequirement[]> {
  requireOrganizationId(organizationId);
  const factor = Number(multiplier);
  if (!Number.isFinite(factor) || factor <= 0) throw new Error("Multiplicatorul trebuie să fie mai mare decât zero.");

  const recipeItems = await listMaterialRecipeItems(organizationId, recipeId);
  if (!recipeItems.length) throw new Error("Șablonul nu conține materiale.");

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { count } = await orbyvenSupabase
    .from("sales_material_requirements")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("estimate_id", estimateId);

  const startPosition = count ?? 0;
  const rows = recipeItems.map((item, index) => ({
    organization_id: organizationId,
    estimate_id: estimateId,
    source_recipe_id: recipeId,
    source_estimate_item_id: estimateItemId || null,
    description: item.description,
    quantity: Number(item.quantity_per_unit) * factor,
    unit: item.unit,
    unit_cost_cents: Number(item.unit_cost_cents),
    vendor: item.vendor,
    status: "planned" as const,
    position: startPosition + index,
    created_by: authData.user?.id ?? null,
  }));

  const { data, error } = await orbyvenSupabase
    .from("sales_material_requirements")
    .insert(rows)
    .select(REQUIREMENT_FIELDS);
  if (error) throw error;
  await refreshEstimateBudget(organizationId, estimateId);
  return (data ?? []) as MaterialRequirement[];
}

async function buildCommercialSnapshot(
  organizationId: string,
  estimate: Estimate,
  items: EstimateItem[]
) {
  const [organizationResult, clientResult, taskResult] = await Promise.all([
    orbyvenSupabase
      .from("organizations")
      .select("id,name")
      .eq("id", organizationId)
      .single(),
    estimate.client_id
      ? orbyvenSupabase
          .from("crm_leads")
          .select("id,name,company,email,phone")
          .eq("organization_id", organizationId)
          .eq("id", estimate.client_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    estimate.task_id
      ? orbyvenSupabase
          .from("ops_tasks")
          .select("id,title,status")
          .eq("organization_id", organizationId)
          .eq("id", estimate.task_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (organizationResult.error) throw organizationResult.error;
  if (clientResult.error) throw clientResult.error;
  if (taskResult.error) throw taskResult.error;

  return {
    generatedAt: new Date().toISOString(),
    organization: organizationResult.data,
    client: clientResult.data,
    task: taskResult.data,
    estimate: {
      id: estimate.id,
      reference: estimate.reference,
      title: estimate.title,
      currency: estimate.currency,
      subtotalCents: Number(estimate.subtotal_cents),
      discountCents: Number(estimate.discount_cents),
      taxRate: estimate.tax_rate,
      totalCents: Number(estimate.total_cents),
      validUntil: estimate.valid_until,
      notes: estimate.notes,
    },
    items: items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unitPriceCents: Number(item.unit_price_cents),
      totalCents: Math.round(Number(item.quantity) * Number(item.unit_price_cents)),
    })),
  };
}

export async function generateCommercialDocument(
  organizationId: string,
  estimate: Estimate,
  items: EstimateItem[],
  documentType: CommercialDocumentType
): Promise<CommercialDocument> {
  requireOrganizationId(organizationId);
  if (documentType === "invoice_draft" && estimate.status !== "accepted") {
    throw new Error("Factura se pregătește după ce devizul este acceptat de client.");
  }
  if (!items.length) throw new Error("Devizul nu are poziții.");

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const snapshot = await buildCommercialSnapshot(organizationId, estimate, items);
  const { data: existing, error: existingError } = await orbyvenSupabase
    .from("sales_commercial_documents")
    .select(DOCUMENT_FIELDS)
    .eq("organization_id", organizationId)
    .eq("estimate_id", estimate.id)
    .eq("document_type", documentType)
    .maybeSingle();
  if (existingError) throw existingError;

  const prefix = documentType === "offer" ? "OF" : "FD";
  const status =
    existing?.status && existing.status !== "cancelled"
      ? existing.status
      : "draft";

  const { data, error } = await orbyvenSupabase
    .from("sales_commercial_documents")
    .upsert(
      {
        organization_id: organizationId,
        estimate_id: estimate.id,
        client_id: estimate.client_id,
        task_id: estimate.task_id,
        document_type: documentType,
        reference: existing?.reference || randomReference(prefix),
        status,
        title:
          documentType === "offer"
            ? `Ofertă — ${estimate.title}`
            : `Factură draft — ${estimate.title}`,
        currency: estimate.currency,
        subtotal_cents: estimate.subtotal_cents,
        discount_cents: estimate.discount_cents,
        tax_rate: estimate.tax_rate,
        total_cents: estimate.total_cents,
        snapshot,
        generated_from_updated_at: estimate.updated_at,
        created_by: existing?.created_by ?? authData.user?.id ?? null,
      },
      { onConflict: "organization_id,estimate_id,document_type" }
    )
    .select(DOCUMENT_FIELDS)
    .single();
  if (error) throw error;
  await refreshEstimateBudget(organizationId, estimate.id);
  return data as CommercialDocument;
}

export async function setCommercialDocumentStatus(
  organizationId: string,
  estimateId: string,
  documentId: string,
  status: CommercialDocumentStatus
): Promise<CommercialDocument> {
  requireOrganizationId(organizationId);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status };
  if (status === "issued") patch.issued_at = now;
  if (status === "paid") {
    patch.issued_at = now;
    patch.paid_at = now;
  }

  const { data, error } = await orbyvenSupabase
    .from("sales_commercial_documents")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("estimate_id", estimateId)
    .eq("id", documentId)
    .select(DOCUMENT_FIELDS)
    .single();
  if (error) throw error;
  await refreshEstimateBudget(organizationId, estimateId);
  return data as CommercialDocument;
}

export async function refreshEstimateBudget(
  organizationId: string,
  estimateId: string
): Promise<BudgetEntry[]> {
  requireOrganizationId(organizationId);
  const [estimateResult, requirementResult, invoiceResult, authResult] = await Promise.all([
    orbyvenSupabase
      .from("sales_estimates")
      .select("id,client_id,task_id,currency,title")
      .eq("organization_id", organizationId)
      .eq("id", estimateId)
      .single(),
    orbyvenSupabase
      .from("sales_material_requirements")
      .select("quantity,unit_cost_cents,status")
      .eq("organization_id", organizationId)
      .eq("estimate_id", estimateId),
    orbyvenSupabase
      .from("sales_commercial_documents")
      .select("id,total_cents,currency,status")
      .eq("organization_id", organizationId)
      .eq("estimate_id", estimateId)
      .eq("document_type", "invoice_draft")
      .maybeSingle(),
    orbyvenSupabase.auth.getUser(),
  ]);

  if (estimateResult.error) throw estimateResult.error;
  if (requirementResult.error) throw requirementResult.error;
  if (invoiceResult.error) throw invoiceResult.error;

  const estimate = estimateResult.data;
  const requirements = requirementResult.data ?? [];
  const materialCents = requirements.reduce(
    (sum, item) => sum + Math.round(Number(item.quantity) * Number(item.unit_cost_cents)),
    0
  );

  if (materialCents > 0) {
    const committed = requirements.some((item) => item.status === "ordered" || item.status === "bought");
    const { error } = await orbyvenSupabase
      .from("finance_budget_entries")
      .upsert(
        {
          organization_id: organizationId,
          estimate_id: estimateId,
          client_id: estimate.client_id,
          task_id: estimate.task_id,
          source_type: "materials",
          direction: "expense",
          status: committed ? "committed" : "planned",
          description: `Necesar materiale — ${estimate.title}`,
          amount_cents: materialCents,
          currency: estimate.currency || "RON",
          created_by: authResult.data.user?.id ?? null,
        },
        { onConflict: "organization_id,estimate_id,source_type" }
      );
    if (error) throw error;
  } else {
    const { error } = await orbyvenSupabase
      .from("finance_budget_entries")
      .delete()
      .eq("organization_id", organizationId)
      .eq("estimate_id", estimateId)
      .eq("source_type", "materials");
    if (error) throw error;
  }

  const invoice = invoiceResult.data;
  if (invoice && invoice.status !== "cancelled") {
    const invoiceStatus: BudgetEntryStatus =
      invoice.status === "paid" ? "actual" : invoice.status === "issued" ? "committed" : "planned";
    const { error } = await orbyvenSupabase
      .from("finance_budget_entries")
      .upsert(
        {
          organization_id: organizationId,
          estimate_id: estimateId,
          client_id: estimate.client_id,
          task_id: estimate.task_id,
          source_type: "invoice",
          direction: "income",
          status: invoiceStatus,
          description: `Factură — ${estimate.title}`,
          amount_cents: Number(invoice.total_cents),
          currency: invoice.currency || estimate.currency || "RON",
          created_by: authResult.data.user?.id ?? null,
        },
        { onConflict: "organization_id,estimate_id,source_type" }
      );
    if (error) throw error;
  } else {
    const { error } = await orbyvenSupabase
      .from("finance_budget_entries")
      .delete()
      .eq("organization_id", organizationId)
      .eq("estimate_id", estimateId)
      .eq("source_type", "invoice");
    if (error) throw error;
  }

  return listBudgetEntries(organizationId, estimateId);
}
