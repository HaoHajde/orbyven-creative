import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

/**
 * ORBYVEN Alpha 0.5: explicit operational dependencies for existing, deployed
 * modules only. Future capabilities (materials, invoices, ANAF) are modeled in
 * lib/workflows/ecosystem.ts until their schema, RLS and UI exist.
 */
export const MODULE_REQUIRES: Record<OrbyvenModuleId, readonly OrbyvenModuleId[]> = {
  overview: [],
  leads: ["overview"],
  tasks: ["leads"],
  calendar: ["tasks"],
  estimates: ["tasks"],
  documents: ["overview"],
  expenses: ["tasks"],
  team: ["overview"],
};

export function getModuleActivationPlan(
  target: OrbyvenModuleId,
  current: readonly OrbyvenModuleId[]
): OrbyvenModuleId[] {
  const enabled = new Set(current);
  const visiting = new Set<OrbyvenModuleId>();
  const plan: OrbyvenModuleId[] = [];
  function visit(id: OrbyvenModuleId) {
    if (visiting.has(id)) throw new Error("Module dependency cycle: " + id);
    visiting.add(id);
    for (const prerequisite of MODULE_REQUIRES[id]) visit(prerequisite);
    visiting.delete(id);
    if (!enabled.has(id) && !plan.includes(id)) plan.push(id);
  }
  visit(target);
  return plan;
}

/** Return all active dependents; never silently hide data-bearing modules. */
export function getModuleDisableBlockers(
  target: OrbyvenModuleId,
  current: readonly OrbyvenModuleId[]
): OrbyvenModuleId[] {
  const active = new Set(current);
  if (target === "overview") return ["overview"];
  return current.filter((id) => {
    if (id === target || !active.has(id)) return false;
    const plan = getModuleActivationPlan(id, []);
    return plan.includes(target);
  });
}

export function findMissingDependencies(
  current: readonly OrbyvenModuleId[]
): { module: OrbyvenModuleId; missing: OrbyvenModuleId[] }[] {
  const active = new Set(current);
  return current
    .map((module) => ({
      module,
      missing: getModuleActivationPlan(module, []).filter((id) => !active.has(id)),
    }))
    .filter((entry) => entry.missing.length > 0);
}
