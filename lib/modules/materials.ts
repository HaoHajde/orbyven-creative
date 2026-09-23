import { orbyvenSupabase } from "@/lib/orbyven-supabase";

export type MaterialStatus = "planned" | "ordered" | "bought";

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
  status: MaterialStatus;
  position: number;
  created_at: string;
};

export type CreateMaterialRequirementInput = {
  description: string;
  quantity: number;
  unit: string;
  unitCostLei: number;
  vendor?: string;
  sourceEstimateItemId?: string | null;
};

const FIELDS =
  "id,organization_id,estimate_id,source_recipe_id,source_estimate_item_id,description,quantity,unit,unit_cost_cents,vendor,status,position,created_at";

function requireIds(organizationId: string, estimateId: string) {
  if (!organizationId.trim() || !estimateId.trim()) throw new Error("Firma și devizul sunt obligatorii.");
}

export async function listEstimateMaterials(
  organizationId: string,
  estimateId: string
): Promise<MaterialRequirement[]> {
  requireIds(organizationId, estimateId);
  const { data, error } = await orbyvenSupabase.from("sales_material_requirements")
    .select(FIELDS)
    .eq("organization_id", organizationId)
    .eq("estimate_id", estimateId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MaterialRequirement[];
}

export async function addEstimateMaterial(
  organizationId: string,
  estimateId: string,
  input: CreateMaterialRequirementInput
): Promise<MaterialRequirement> {
  requireIds(organizationId, estimateId);
  const description = input.description.trim();
  const quantity = input.quantity;
  const unit = input.unit.trim();
  const costCents = Math.round(input.unitCostLei * 100);
  if (!description || !unit || !Number.isFinite(quantity) || quantity <= 0 || quantity > 1000000) {
    throw new Error("Completează materialul, unitatea și o cantitate validă.");
  }
  if (!Number.isSafeInteger(costCents) || costCents < 0) {
    throw new Error("Costul materialului trebuie să fie valid.");
  }

  // Every reference is resolved under the exact same organization. RLS and the
  // composite FK in Supabase remain the final authority.
  const { data: estimate, error: estimateError } = await orbyvenSupabase
    .from("sales_estimates").select("id")
    .eq("organization_id", organizationId).eq("id", estimateId).single();
  if (estimateError || !estimate) throw new Error("Devizul nu este disponibil în această firmă.");

  if (input.sourceEstimateItemId) {
    const { data: item, error: itemError } = await orbyvenSupabase
      .from("sales_estimate_items").select("id")
      .eq("organization_id", organizationId).eq("estimate_id", estimateId)
      .eq("id", input.sourceEstimateItemId).single();
    if (itemError || !item) throw new Error("Poziția selectată nu aparține acestui deviz.");
  }

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const { data, error } = await orbyvenSupabase
    .from("sales_material_requirements")
    .insert({
      organization_id: organizationId,
      estimate_id: estimateId,
      source_estimate_item_id: input.sourceEstimateItemId || null,
      description,
      quantity,
      unit,
      unit_cost_cents: costCents,
      vendor: input.vendor?.trim() || null,
      status: "planned",
      created_by: authData.user?.id || null,
    })
    .select(FIELDS).single();
  if (error) throw error;
  return data as MaterialRequirement;
}

export async function setEstimateMaterialStatus(
  organizationId: string,
  estimateId: string,
  materialId: string,
  status: MaterialStatus
): Promise<MaterialRequirement> {
  requireIds(organizationId, estimateId);
  if (!["planned", "ordered", "bought"].includes(status)) throw new Error("Status material invalid.");
  const { data, error } = await orbyvenSupabase
    .from("sales_material_requirements").update({ status })
    .eq("organization_id", organizationId)
    .eq("estimate_id", estimateId)
    .eq("id", materialId).select(FIELDS).single();
  if (error) throw error;
  return data as MaterialRequirement;
}
