import { orbyvenSupabase } from "@/lib/orbyven-supabase";

/**
 * Read-only tenant-scoped view of the tables already deployed by ORBYVEN.
 * Does not treat subscription invoices (billing_invoices) as customers' invoices.
 */
export type WorkflowOverview = {
  estimate: {
    id: string;
    organization_id: string;
    reference: string;
    status: string;
    title: string;
    client_id: string | null;
    task_id: string | null;
    updated_at: string;
  };
  items: Array<{ id: string; estimate_id: string; description: string; quantity: number; unit_price_cents: number }>;
  requirements: Array<{
    id: string; estimate_id: string; source_estimate_item_id: string | null; description: string;
    quantity: number; unit: string; unit_cost_cents: number; vendor: string | null; status: string;
  }>;
  documents: Array<{
    id: string; estimate_id: string; document_type: string; reference: string;
    status: string; snapshot: unknown; generated_from_updated_at: string | null;
  }>;
  budget: Array<{
    id: string; estimate_id: string; source_type: string; direction: string;
    status: string; amount_cents: number; description: string;
  }>;
  sourceIsStale: boolean;
};

/** All reads include organization_id and rely on auth-bound Supabase RLS as well. */
export async function loadCommercialWorkflow(
  organizationId: string,
  estimateId: string,
): Promise<WorkflowOverview> {
  if (!organizationId.trim() || !estimateId.trim()) throw new Error("Firma și devizul sunt obligatorii.");

  const [estimate, items, requirements, documents, budget] = await Promise.all([
    orbyvenSupabase.from("sales_estimates")
      .select("id,organization_id,reference,status,title,client_id,task_id,updated_at")
      .eq("organization_id", organizationId).eq("id", estimateId).single(),
    orbyvenSupabase.from("sales_estimate_items")
      .select("id,estimate_id,description,quantity,unit_price_cents")
      .eq("organization_id", organizationId).eq("estimate_id", estimateId).order("position"),
    orbyvenSupabase.from("sales_material_requirements")
      .select("id,estimate_id,source_estimate_item_id,description,quantity,unit,unit_cost_cents,vendor,status")
      .eq("organization_id", organizationId).eq("estimate_id", estimateId).order("position"),
    orbyvenSupabase.from("sales_commercial_documents")
      .select("id,estimate_id,document_type,reference,status,snapshot,generated_from_updated_at")
      .eq("organization_id", organizationId).eq("estimate_id", estimateId),
    orbyvenSupabase.from("finance_budget_entries")
      .select("id,estimate_id,source_type,direction,status,amount_cents,description")
      .eq("organization_id", organizationId).eq("estimate_id", estimateId),
  ]);

  if (estimate.error || !estimate.data) throw estimate.error ?? new Error("Devizul nu există în această firmă.");
  for (const result of [items, requirements, documents, budget]) if (result.error) throw result.error;

  const typedEstimate = estimate.data as WorkflowOverview["estimate"];
  const typedDocuments = (documents.data ?? []) as WorkflowOverview["documents"];
  return {
    estimate: typedEstimate,
    items: (items.data ?? []) as WorkflowOverview["items"],
    requirements: (requirements.data ?? []) as WorkflowOverview["requirements"],
    documents: typedDocuments,
    budget: (budget.data ?? []) as WorkflowOverview["budget"],
    sourceIsStale: typedDocuments.some((document) =>
      document.generated_from_updated_at !== null
      && new Date(document.generated_from_updated_at).getTime() < new Date(typedEstimate.updated_at).getTime()
    ),
  };
}
