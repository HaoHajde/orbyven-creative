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
  "calendar_event_resources",
  "sales_estimates",
  "sales_estimate_items",
  "sales_material_requirements",
  "sales_commercial_documents",
  "finance_expenses",
  "finance_income_entries",
  "finance_budget_entries",
  "ops_documents",
  "ops_material_catalog",
  "ops_material_recipes",
  "ops_material_recipe_items",
  "ops_inventory_movements",
  "ops_suppliers",
  "ops_purchase_orders",
  "ops_purchase_order_items",
  "ops_resources",
  "ops_resource_unavailability",
  "people_team_members",
  "thermal_sketches",
  "project_requests",
  "ai_conversations",
  "ai_conversation_messages",
  "ai_action_proposals",
  "billing_terms_acceptances",
  "subscriptions",
  "billing_invoices",
  "billing_accounts",
  "billing_merchant_customers",
  "billing_order_evidence",
  "legal_contract_records",
] as const;

const PER_TABLE_LIMIT = 2000;
const PAGE_SIZE = 500;
const MAX_ARCHIVE_BYTES = 8 * 1024 * 1024;

export class TenantExportError extends Error {}

function canonicalizeExportValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeExportValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string,unknown>)
        .sort(([left],[right]) => left < right ? -1 : left > right ? 1 : 0)
        .map(([key,nested]) => [key,canonicalizeExportValue(nested)])
    );
  }
  return value;
}

function stableRows(rows: unknown[]) {
  return rows
    .map(row => {
      const value=canonicalizeExportValue(row);
      return {value,key:JSON.stringify(value)};
    })
    .sort((left,right) => left.key < right.key ? -1 : left.key > right.key ? 1 : 0)
    .map(item => item.value);
}

export function requireExportableCase(
  item: { organization_id:string;status:string },
  organizationId:string,
) {
  if(item.organization_id!==organizationId || !["authorized","package_generated"].includes(item.status)) {
    throw new TenantExportError("An authorized exit case for this organization is required.");
  }
}

async function loadTenantRows(
  admin:SupabaseClient,
  name:string,
  organizationId:string,
) {
  const {count,error:countError}=await admin.from(name)
    .select("organization_id",{count:"exact",head:true})
    .eq("organization_id",organizationId);
  if(countError || count===null) {
    throw new TenantExportError("Archive cannot safely count "+name);
  }
  if(count>PER_TABLE_LIMIT) {
    throw new TenantExportError("Archive limit reached in "+name+"; manual paginated transfer required.");
  }
  if(count===0)return [];

  const rows:unknown[]=[];
  for(let start=0;start<count;start+=PAGE_SIZE) {
    const end=Math.min(start+PAGE_SIZE-1,count-1);
    const {data,error}=await admin.from(name)
      .select("*").eq("organization_id",organizationId).range(start,end);
    if(error)throw new TenantExportError("Archive cannot safely include "+name);
    rows.push(...(data??[]));
  }
  if(rows.length!==count) {
    throw new TenantExportError("Archive changed while reading "+name+"; retry or use assisted export.");
  }
  return stableRows(rows);
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
    datasets[name]=await loadTenantRows(admin,name,organizationId);
  }
  const archive={
    format:"orbyven-tenant-export",
    version:1,
    case_id:caseId,
    organization_id:organizationId,
    generated_at:generatedAt,
    organization:canonicalizeExportValue(org),
    datasets,
    exclusions:[
      "Storage document/photo/audio bytes (transfer and verify separately)",
      "Supabase Auth identities/passwords/sessions (never included)",
      "Platform staff, internal incident/security audit logs, AI provider telemetry and usage counters",
      "Stripe payment methods and raw webhook payloads",
      "Push-device tokens, external provider records, backups and third-party archives",
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
