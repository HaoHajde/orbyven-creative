import { orbyvenSupabase } from "@/lib/orbyven-supabase";

export type EstimateStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export type Estimate = {
  id: string;
  organization_id: string;
  reference: string;
  status: EstimateStatus;
  title: string;
  client_id: string | null;
  task_id: string | null;
  currency: string;
  subtotal_cents: number;
  discount_cents: number;
  tax_rate: number | null;
  total_cents: number;
  valid_until: string | null;
  notes: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EstimateItem = {
  id: string;
  organization_id: string;
  estimate_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EstimateLink = { id: string; name: string; company?: string | null };
export type EstimateTaskLink = { id: string; title: string; status: string };

export type EstimateItemInput = {
  description: string;
  quantity: number;
  unitPriceLei: number;
};

export type CreateEstimateInput = {
  title: string;
  clientId?: string | null;
  taskId?: string | null;
  currency?: string;
  discountLei?: number;
  taxRate?: number | null;
  validUntil?: string | null;
  notes?: string;
  items: EstimateItemInput[];
};

const ESTIMATE_FIELDS =
  "id,organization_id,reference,status,title,client_id,task_id,currency,subtotal_cents,discount_cents,tax_rate,total_cents,valid_until,notes,sent_at,accepted_at,created_by,created_at,updated_at";
const ITEM_FIELDS =
  "id,organization_id,estimate_id,description,quantity,unit_price_cents,position,created_by,created_at,updated_at";

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

function totals(items: EstimateItemInput[], discountLei = 0, taxRate: number | null = null) {
  const subtotalCents = items.reduce((sum, item) => {
    const quantity = Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
    return sum + Math.round(quantity * leiToCents(item.unitPriceLei));
  }, 0);
  const discountCents = Math.min(subtotalCents, leiToCents(discountLei));
  const taxableCents = Math.max(0, subtotalCents - discountCents);
  const normalizedTax = taxRate === null || !Number.isFinite(taxRate) ? null : Math.min(100, Math.max(0, taxRate));
  const taxCents = normalizedTax === null ? 0 : Math.round(taxableCents * (normalizedTax / 100));
  return {
    subtotalCents,
    discountCents,
    taxRate: normalizedTax,
    totalCents: taxableCents + taxCents,
  };
}

export async function listEstimates(organizationId: string): Promise<Estimate[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("sales_estimates")
    .select(ESTIMATE_FIELDS)
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Estimate[];
}

export async function listEstimateItems(
  organizationId: string,
  estimateId: string
): Promise<EstimateItem[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("sales_estimate_items")
    .select(ITEM_FIELDS)
    .eq("organization_id", organizationId)
    .eq("estimate_id", estimateId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EstimateItem[];
}

export async function listEstimateClients(organizationId: string): Promise<EstimateLink[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("crm_leads")
    .select("id,name,company")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EstimateLink[];
}

export async function listEstimateTasks(organizationId: string): Promise<EstimateTaskLink[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("ops_tasks")
    .select("id,title,status")
    .eq("organization_id", organizationId)
    .eq("kind", "work")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EstimateTaskLink[];
}

export async function createEstimate(
  organizationId: string,
  input: CreateEstimateInput
): Promise<Estimate> {
  requireOrganizationId(organizationId);
  const title = input.title.trim();
  const items = input.items
    .map((item) => ({
      description: item.description.trim(),
      quantity: Number(item.quantity),
      unitPriceLei: Number(item.unitPriceLei),
    }))
    .filter((item) => item.description && Number.isFinite(item.quantity) && item.quantity > 0);

  if (!title) throw new Error("Titlul ofertei este obligatoriu.");
  if (!items.length) throw new Error("Adaugă cel puțin o poziție în deviz.");

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const calculated = totals(items, input.discountLei ?? 0, input.taxRate ?? null);

  const { data: created, error } = await orbyvenSupabase
    .from("sales_estimates")
    .insert({
      organization_id: organizationId,
      title,
      client_id: input.clientId || null,
      task_id: input.taskId || null,
      currency: (input.currency?.trim() || "RON").toUpperCase(),
      subtotal_cents: calculated.subtotalCents,
      discount_cents: calculated.discountCents,
      tax_rate: calculated.taxRate,
      total_cents: calculated.totalCents,
      valid_until: input.validUntil || null,
      notes: cleanOptional(input.notes),
      created_by: authData.user?.id ?? null,
    })
    .select(ESTIMATE_FIELDS)
    .single();
  if (error) throw error;

  const itemRows = items.map((item, index) => ({
    organization_id: organizationId,
    estimate_id: created.id,
    description: item.description,
    quantity: item.quantity,
    unit_price_cents: leiToCents(item.unitPriceLei),
    position: index,
    created_by: authData.user?.id ?? null,
  }));

  const { error: itemError } = await orbyvenSupabase.from("sales_estimate_items").insert(itemRows);
  if (itemError) throw itemError;
  return created as Estimate;
}

export async function setEstimateStatus(
  organizationId: string,
  estimateId: string,
  status: EstimateStatus
): Promise<Estimate> {
  requireOrganizationId(organizationId);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status };
  if (status === "sent") patch.sent_at = now;
  if (status === "accepted") patch.accepted_at = now;

  const { data, error } = await orbyvenSupabase
    .from("sales_estimates")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", estimateId)
    .select(ESTIMATE_FIELDS)
    .single();
  if (error) throw error;
  return data as Estimate;
}

export async function deleteEstimate(organizationId: string, estimateId: string) {
  requireOrganizationId(organizationId);
  const { error } = await orbyvenSupabase
    .from("sales_estimates")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", estimateId);
  if (error) throw error;
}
