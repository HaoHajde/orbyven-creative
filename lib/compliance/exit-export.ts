import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

// Explicit allowlist: never export auth.users, platform staff/logs, other tenant
// tables, payment methods, raw webhook payloads or provider credentials.
// Storage file BYTES and third-party records require a separate manual transfer.
export const TENANT_EXPORT_TABLES = [
  "organization_profiles",
  "organization_members",
  "organization_modules",
  "organization_entitlements",
  "crm_leads",
  "crm_lead_activities",
  "ops_tasks",
  "ops_task_checklist_items",
  "calendar_events",
  "sales_estimates",
  "sales_estimate_items",
  "sales_material_requirements",
  "sales_commercial_documents",
  "finance_expenses",
  "finance_budget_entries",
  "ops_documents",
  "ops_material_catalog",
  "ops_material_recipes",
  "ops_material_recipe_items",
  "people_team_members",
  "billing_terms_acceptances",
  "subscriptions",
  "billing_invoices",
  "billing_accounts",
  "billing_merchant_customers",
  "billing_order_evidence",
  "legal_contract_records",
] as const;

const PER_TABLE_LIMIT = 2000;
const MAX_ARCHIVE_BYTES = 8 * 1024 * 1024;

export class TenantExportError extends Error {}

export function requireExportableCase(
  item: { organization_id:string;status:string },
  organizationId:string,
) {
  if(item.organization_id!==organizationId || !["authorized","package_generated"].includes(item.status)) {
    throw new TenantExportError("An authorized exit case for this organization is required.");
  }
}

export async function buildTenantArchive(
  admin:SupabaseClient,
  organizationId:string,
  caseId:string,
  generatedAt:string,
) {
  const {data:org,error:orgError}=await admin.from("organizations")
    .select("id,name,slug,legal_name,lifecycle_status,created_at,updated_at")
    .eq("id",organizationId).maybeSingle();
  if(orgError||!org)throw new TenantExportError("Organization is unavailable.");

  const datasets:Record<string,unknown[]> = {};
  // Sequential for predictable bounds. No partial archive is ever returned.
  for(const name of TENANT_EXPORT_TABLES) {
    const {data,error}=await admin.from(name)
      .select("*").eq("organization_id",organizationId)
      .range(0,PER_TABLE_LIMIT);
    if(error)throw new TenantExportError("Archive cannot safely include "+name);
    if((data??[]).length>PER_TABLE_LIMIT) {
      throw new TenantExportError("Archive limit reached in "+name+"; manual paginated transfer required.");
    }
    datasets[name]=data??[];
  }
  const archive={
    format:"orbyven-tenant-export",
    version:1,
    case_id:caseId,
    organization_id:organizationId,
    generated_at:generatedAt,
    organization:org,
    datasets,
    exclusions:[
      "Storage document/photo/audio bytes (transfer and verify separately)",
      "Supabase Auth identities/passwords/sessions (never included)",
      "Platform staff, internal incident and security audit logs",
      "Stripe payment methods and raw webhook payloads",
      "External provider records, backups and third-party archives",
    ],
    notice:"Generating this archive is not confirmation of delivery, erasure, retention review or contract termination.",
  };
  const payload=JSON.stringify(archive,null,2);
  if(Buffer.byteLength(payload,"utf8")>MAX_ARCHIVE_BYTES) {
    throw new TenantExportError("Archive exceeds safe response limit; manual export required.");
  }
  const sha256=createHash("sha256").update(payload,"utf8").digest("hex");
  return {payload,sha256,counts:Object.fromEntries(Object.entries(datasets).map(([k,v])=>[k,v.length]))};
}
