import { createBillingServiceClient, type BillingActor } from "@/lib/billing/supabase-server";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import { detectOperationalQuery } from "@/lib/ai/operational-query-core";
import { answerOperationalQuery } from "@/lib/ai/operational-query";

async function loadAvailableModules(actor: BillingActor) {
  const client = createBillingServiceClient(actor);
  const [modulesResult, entitlementsResult] = await Promise.all([
    client.from("organization_modules")
      .select("module_id,enabled")
      .eq("organization_id", actor.organizationId)
      .eq("enabled", true),
    client.from("organization_entitlements")
      .select("module_id,enabled,starts_at,ends_at")
      .eq("organization_id", actor.organizationId)
      .eq("enabled", true),
  ]);
  if (modulesResult.error) throw modulesResult.error;
  if (entitlementsResult.error) throw entitlementsResult.error;

  const now = Date.now();
  const entitled = new Set(
    (entitlementsResult.data ?? [])
      .filter((row) =>
        (!row.starts_at || new Date(row.starts_at).getTime() <= now) &&
        (!row.ends_at || new Date(row.ends_at).getTime() > now))
      .map((row) => row.module_id as OrbyvenModuleId),
  );
  const available = new Set<OrbyvenModuleId>(["overview"]);
  for (const row of modulesResult.data ?? []) {
    const moduleId = row.module_id as OrbyvenModuleId;
    if (entitled.has(moduleId)) available.add(moduleId);
  }
  return available;
}

export async function answerOperationalQueryForActor(
  actor: BillingActor,
  prompt: string,
) {
  if (!detectOperationalQuery(prompt)) return null;
  const available = await loadAvailableModules(actor);
  return answerOperationalQuery(actor, available, prompt);
}
