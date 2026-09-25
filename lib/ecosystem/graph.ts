/**
 * ORBYVEN ecosystem plan. This is a domain graph, NOT a live entitlement registry:
 * only the existing OrbyvenModuleId values can be enabled in production today.
 * Pending capabilities must not be added to ORBYVEN_MODULES until their UI, RLS,
 * migrations and rollout gates are independently validated.
 */
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

export type EcosystemNodeId =
  | "crm"
  | "work"
  | "estimate"
  | "material_recipes"
  | "material_requirements"
  | "client_offer"
  | "invoice_draft"
  | "fiscal_profile"
  | "anaf_connection"
  | "efactura_submission"
  | "budget";

export type EcosystemNode = {
  id: EcosystemNodeId;
  label: string;
  table: string | null;
  workspaceModule: OrbyvenModuleId | null;
  requires: EcosystemNodeId[];
  description: string;
  availability: "live" | "database_only" | "planned";
};

export const ECOSYSTEM_NODES: readonly EcosystemNode[] = [
  { id: "crm", label: "Client / cerere", table: "crm_leads", workspaceModule: "leads", requires: [], availability: "live", description: "Identitatea clientului și istoricul comunicării." },
  { id: "work", label: "Lucrare", table: "ops_tasks", workspaceModule: "tasks", requires: ["crm"], availability: "live", description: "Coordonează execuția și păstrează client_id." },
  { id: "estimate", label: "Deviz", table: "sales_estimates", workspaceModule: "estimates", requires: ["crm", "work"], availability: "live", description: "Liniile, prețurile și manopera sunt în sales_estimate_items." },
  { id: "material_recipes", label: "Rețete materiale", table: "ops_material_recipes", workspaceModule: null, requires: [], availability: "database_only", description: "Rețete reutilizabile per unitate de lucrare." },
  { id: "material_requirements", label: "Necesar materiale", table: "sales_material_requirements", workspaceModule: "estimates", requires: ["estimate"], availability: "live", description: "Cantitate, unitate, cost, furnizor și status comandă legate de deviz." },
  { id: "client_offer", label: "Ofertă pentru client", table: "sales_commercial_documents", workspaceModule: "estimates", requires: ["estimate", "crm"], availability: "live", description: "Document comercial de tip offer, cu snapshot separat de devizul editabil." },
  { id: "invoice_draft", label: "Ciornă factură", table: "sales_commercial_documents", workspaceModule: "estimates", requires: ["client_offer", "crm"], availability: "live", description: "Tip invoice_draft; NU este factură fiscală emisă." },
  { id: "fiscal_profile", label: "Date fiscale firmă", table: null, workspaceModule: null, requires: [], availability: "planned", description: "CUI/CIF, adresă, regim TVA, IBAN și serie/număr, validate înainte de emitere." },
  { id: "anaf_connection", label: "Conexiune ANAF", table: null, workspaceModule: null, requires: ["fiscal_profile"], availability: "planned", description: "Autorizare individuală per firmă, token doar pe server și revocare." },
  { id: "efactura_submission", label: "RO e-Factura", table: null, workspaceModule: null, requires: ["invoice_draft", "fiscal_profile", "anaf_connection"], availability: "planned", description: "Emitere autorizată, XML UBL/RO-CIUS, transmitere, index și rezultat ANAF." },
  { id: "budget", label: "Buget lucrare", table: "finance_budget_entries", workspaceModule: "expenses", requires: ["estimate", "material_requirements"], availability: "database_only", description: "Cost materiale previzionat, facturare și cheltuieli reale fără dublare." },
] as const;

const BY_ID = Object.fromEntries(ECOSYSTEM_NODES.map((node) => [node.id, node])) as Record<EcosystemNodeId, EcosystemNode>;

export function getEcosystemNode(id: EcosystemNodeId) { return BY_ID[id]; }

/** Ordered prerequisites, deduplicated; rejects accidental circular dependencies. */
export function getEcosystemPrerequisites(id: EcosystemNodeId): EcosystemNodeId[] {
  const visited = new Set<EcosystemNodeId>();
  const visiting = new Set<EcosystemNodeId>();
  const ordered: EcosystemNodeId[] = [];
  const visit = (key: EcosystemNodeId) => {
    if (visiting.has(key)) throw new Error("Ecosystem dependency cycle: " + key);
    if (visited.has(key)) return;
    visiting.add(key);
    for (const dependency of BY_ID[key].requires) visit(dependency);
    visiting.delete(key);
    visited.add(key);
    if (key !== id) ordered.push(key);
  };
  visit(id);
  return ordered;
}

export function getEcosystemMissingDependencies(
  id: EcosystemNodeId,
  available: ReadonlySet<EcosystemNodeId>,
): EcosystemNodeId[] {
  return getEcosystemPrerequisites(id).filter((dependency) => !available.has(dependency));
}

/** Prevents mistaking backend database scaffolding for user-facing functionality. */
export function isReadyForCustomerUse(id: EcosystemNodeId): boolean {
  return BY_ID[id].availability === "live";
}
