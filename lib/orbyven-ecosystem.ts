import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

/**
 * Commercial workflow blueprint. Planned capabilities are not public modules
 * until matching tables, migrations, RLS, business services and QA exist.
 */
export type EcosystemStepId =
  | "client" | "work" | "estimate" | "materials" | "offer" | "invoice" | "efactura";

export type EcosystemStep = {
  id: EcosystemStepId;
  title: string;
  description: string;
  dependsOn: EcosystemStepId[];
  existingModules: OrbyvenModuleId[];
  implementation: "available" | "prototype" | "planned" | "regulated";
  releaseGate?: string;
};

export const ECOSYSTEM_STEPS: readonly EcosystemStep[] = [
  {
    id: "client", title: "Client / cerere", description: "Identitatea și istoricul relației comerciale.",
    dependsOn: [], existingModules: ["leads"], implementation: "available",
  },
  {
    id: "work", title: "Lucrare", description: "Context, responsabil și programare pentru client.",
    dependsOn: ["client"], existingModules: ["tasks"], implementation: "available",
  },
  {
    id: "estimate", title: "Deviz", description: "Cantități, manoperă, prețuri și revizie.",
    dependsOn: ["client", "work"], existingModules: ["estimates"], implementation: "available",
  },
  {
    id: "materials", title: "Necesar materiale", description: "Cantități distincte de manoperă, de procurat și de rezervat.",
    dependsOn: ["estimate"], existingModules: ["estimates"], implementation: "prototype",
    releaseGate: "Poziții structurate, unități de măsură și snapshot de prețuri.",
  },
  {
    id: "offer", title: "Ofertă pentru client", description: "Versiune comercială din deviz, cu termeni și acceptare explicită.",
    dependsOn: ["estimate", "materials"], existingModules: ["estimates", "leads"], implementation: "prototype",
    releaseGate: "Revizii imuabile și dovada acceptării ofertei.",
  },
  {
    id: "invoice", title: "Factură", description: "Document fiscal creat dintr-o ofertă acceptată, nu un PDF redenumit.",
    dependsOn: ["offer"], existingModules: [], implementation: "planned",
    releaseGate: "Profil fiscal, serie unică, TVA per linie, credit note și jurnal auditabil.",
  },
  {
    id: "efactura", title: "RO e-Factura / ANAF", description: "XML RO-CIUS, autorizare SPV, transmitere, răspuns și arhivare.",
    dependsOn: ["invoice"], existingModules: [], implementation: "regulated",
    releaseGate: "OAuth/certificat autorizat, XML validat, API ANAF, recipisă și tratarea erorilor.",
  },
] as const;

export const MODULE_RELATIONS: Partial<Record<OrbyvenModuleId, readonly OrbyvenModuleId[]>> = {
  leads: [],
  tasks: ["leads"],
  calendar: ["tasks", "leads"],
  estimates: ["leads", "tasks", "documents", "expenses"],
  documents: ["leads", "tasks", "estimates"],
  expenses: ["tasks", "documents", "estimates"],
  team: ["tasks"],
  overview: [],
};

export function missingRecommendedModules(
  moduleId: OrbyvenModuleId,
  enabled: readonly OrbyvenModuleId[]
): OrbyvenModuleId[] {
  return (MODULE_RELATIONS[moduleId] ?? []).filter((id) => !enabled.includes(id));
}

export function requiredSteps(stepId: EcosystemStepId): EcosystemStepId[] {
  const found = new Set<EcosystemStepId>();
  const walk = (id: EcosystemStepId) => {
    const step = ECOSYSTEM_STEPS.find((candidate) => candidate.id === id);
    if (!step) throw new Error("Unknown ecosystem step: " + id);
    for (const dependency of step.dependsOn) {
      if (!found.has(dependency)) { walk(dependency); found.add(dependency); }
    }
  };
  walk(stepId);
  return [...found];
}

export function unmetSteps(
  stepId: EcosystemStepId,
  completed: readonly EcosystemStepId[]
): EcosystemStepId[] {
  return requiredSteps(stepId).filter((id) => !completed.includes(id));
}

/** Guard against presenting unavailable commercial features as delivered. */
export function isReleasedEcosystemStep(stepId: EcosystemStepId): boolean {
  return ECOSYSTEM_STEPS.find((step) => step.id === stepId)?.implementation === "available";
}
