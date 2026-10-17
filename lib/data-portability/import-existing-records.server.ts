import { createClient } from "@supabase/supabase-js";

import type { BillingActor } from "@/lib/billing/supabase-server";
import type { ImportTargetContract } from "@/lib/data-portability/import-targets";

export const EXISTING_DUPLICATE_SCAN_LIMIT = 10_000;
const EXISTING_DUPLICATE_PAGE_SIZE = 1_000;

export type ExistingDuplicateCoverage = {
  records: Array<{ email: string }>;
  scannedRecords: number;
  usableDuplicateKeys: number;
};

export class ImportDuplicateCoverageError extends Error {
  readonly code:
    | "ACTOR_TOKEN_REQUIRED"
    | "TARGET_NOT_ENTITLED"
    | "TARGET_ENTITLEMENT_CHECK_FAILED"
    | "EXISTING_DUPLICATE_COUNT_UNAVAILABLE"
    | "EXISTING_DUPLICATE_SCAN_LIMIT"
    | "EXISTING_DUPLICATE_SCAN_FAILED"
    | "EXISTING_DUPLICATE_SCAN_CHANGED"
    | "CROSS_TENANT_DUPLICATE_RESULT";

  constructor(code: ImportDuplicateCoverageError["code"]) {
    super(code);
    this.name = "ImportDuplicateCoverageError";
    this.code = code;
  }
}

type EntitlementRow = {
  organization_id: string;
  module_id: string;
  enabled: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

type CrmDuplicateRow = {
  organization_id: string;
  email: string | null;
};

function supabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) throw new Error("Supabase public configuration is missing.");
  return { url, publishableKey };
}

function createActorScopedClient(actor: BillingActor) {
  const accessToken = actor.accessToken?.trim();
  if (!accessToken) throw new ImportDuplicateCoverageError("ACTOR_TOKEN_REQUIRED");
  const { url, publishableKey } = supabasePublicConfig();
  return createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function entitlementIsActive(row: EntitlementRow, nowMs: number) {
  if (!row.enabled) return false;
  const startsAt = row.starts_at ? Date.parse(row.starts_at) : null;
  const endsAt = row.ends_at ? Date.parse(row.ends_at) : null;
  if (startsAt !== null && (!Number.isFinite(startsAt) || startsAt > nowMs)) return false;
  if (endsAt !== null && (!Number.isFinite(endsAt) || endsAt <= nowMs)) return false;
  return true;
}

async function requireTargetEntitlement(
  client: ReturnType<typeof createActorScopedClient>,
  actor: BillingActor,
  contract: ImportTargetContract,
) {
  const { data, error } = await client
    .from("organization_entitlements")
    .select("organization_id,module_id,enabled,starts_at,ends_at")
    .eq("organization_id", actor.organizationId)
    .eq("module_id", contract.requiredModuleId)
    .limit(20);

  if (error) throw new ImportDuplicateCoverageError("TARGET_ENTITLEMENT_CHECK_FAILED");
  const rows = (data ?? []) as EntitlementRow[];
  if (rows.some(row => row.organization_id !== actor.organizationId || row.module_id !== contract.requiredModuleId)) {
    throw new ImportDuplicateCoverageError("CROSS_TENANT_DUPLICATE_RESULT");
  }
  if (!rows.some(row => entitlementIsActive(row, Date.now()))) {
    throw new ImportDuplicateCoverageError("TARGET_NOT_ENTITLED");
  }
}

async function readCrmEmailCoverage(
  client: ReturnType<typeof createActorScopedClient>,
  actor: BillingActor,
): Promise<ExistingDuplicateCoverage> {
  const countQuery = await client
    .from("crm_leads")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", actor.organizationId)
    .not("email", "is", null);

  if (countQuery.error || countQuery.count === null) {
    throw new ImportDuplicateCoverageError("EXISTING_DUPLICATE_COUNT_UNAVAILABLE");
  }
  if (countQuery.count > EXISTING_DUPLICATE_SCAN_LIMIT) {
    throw new ImportDuplicateCoverageError("EXISTING_DUPLICATE_SCAN_LIMIT");
  }

  const records: Array<{ email: string }> = [];
  let observedRows = 0;
  for (let offset = 0; offset < countQuery.count; offset += EXISTING_DUPLICATE_PAGE_SIZE) {
    const end = Math.min(offset + EXISTING_DUPLICATE_PAGE_SIZE - 1, countQuery.count - 1);
    const { data, error } = await client
      .from("crm_leads")
      .select("organization_id,email")
      .eq("organization_id", actor.organizationId)
      .not("email", "is", null)
      .order("id", { ascending: true })
      .range(offset, end);

    if (error) throw new ImportDuplicateCoverageError("EXISTING_DUPLICATE_SCAN_FAILED");
    const rows = (data ?? []) as CrmDuplicateRow[];
    observedRows += rows.length;
    for (const row of rows) {
      if (row.organization_id !== actor.organizationId) {
        throw new ImportDuplicateCoverageError("CROSS_TENANT_DUPLICATE_RESULT");
      }
      if (typeof row.email === "string" && row.email.trim()) records.push({ email: row.email });
    }
  }

  if (observedRows !== countQuery.count) {
    throw new ImportDuplicateCoverageError("EXISTING_DUPLICATE_SCAN_CHANGED");
  }
  return {
    records,
    scannedRecords: observedRows,
    usableDuplicateKeys: records.length,
  };
}

export async function loadExistingDuplicateCoverage(
  actor: BillingActor,
  contract: ImportTargetContract,
): Promise<ExistingDuplicateCoverage> {
  const client = createActorScopedClient(actor);
  await requireTargetEntitlement(client, actor, contract);

  switch (contract.id) {
    case "crm_contacts":
      return readCrmEmailCoverage(client, actor);
  }
}
