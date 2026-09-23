/**
 * Pure, offline projections for the proposed ORBYVEN commercial workflow.
 * They neither mutate Supabase nor generate valid invoices nor contact ANAF.
 * All monetary inputs are integer minor units (bani) unless named quantity.
 */
export type EstimateLine = {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
};
export type MaterialIngredient = {
  id: string;
  description: string;
  quantityPerUnit: number;
  unit: string;
  unitCostCents: number;
  vendor?: string | null;
};
export type MaterialRecipe = {
  id: string;
  organizationId: string;
  name: string;
  ingredients: MaterialIngredient[];
};
export type EstimateSource = {
  id: string;
  organizationId: string;
  clientId: string | null;
  workId: string | null;
  title: string;
  reference: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  currency: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  taxRate: number | null;
  updatedAt: string;
  lines: EstimateLine[];
};
export type MaterialRequirementPreview = {
  estimateId: string;
  estimateLineId: string;
  recipeId: string;
  ingredientId: string;
  description: string;
  quantity: number;
  unit: string;
  unitCostCents: number;
  vendor: string | null;
  estimatedCostCents: number;
  status: "planned";
};
export type CommercialPreview = {
  type: "offer" | "invoice_draft";
  sourceEstimateId: string;
  organizationId: string;
  clientId: string;
  workId: string | null;
  currency: string;
  title: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  sourceUpdatedAt: string;
  lines: EstimateLine[];
  fiscalInvoice: false;
};
export type PreviewResult<T> =
  | { ok: true; value: T }
  | { ok: false; reasons: string[] };

function positiveNumber(value: number) {
  return Number.isFinite(value) && value > 0;
}
function nonnegativeMoney(value: number) {
  return Number.isSafeInteger(value) && value >= 0;
}
function validateEstimate(source: EstimateSource): string[] {
  const errors: string[] = [];
  if (!source.organizationId || !source.id) errors.push("Lipsește identitatea firmei/devizului.");
  if (!source.clientId) errors.push("Devizul trebuie asociat unui client.");
  if (!source.workId) errors.push("Pentru fluxul complet, devizul trebuie legat de o lucrare.");
  if (!source.lines.length) errors.push("Devizul nu are poziții.");
  if (!source.currency || source.currency !== "RON") errors.push("Previzualizarea fiscală suportă doar RON în acest prototip.");
  if (![source.subtotalCents, source.discountCents, source.totalCents].every(nonnegativeMoney)) errors.push("Totalurile monetare trebuie să fie valori întregi nenegative.");
  for (const line of source.lines) {
    if (!line.id || !line.description.trim() || !positiveNumber(line.quantity) || !nonnegativeMoney(line.unitPriceCents)) {
      errors.push("Există o poziție de deviz cu cantitate, preț sau descriere invalidă.");
      break;
    }
  }
  return errors;
}

/**
 * A recipe is assigned to exactly one estimate item. Quantities are multiplied
 * once by the actual estimate line quantity; estimates never become shopping lists
 * through accidental multiplication by all rows.
 */
export function expandMaterialRequirements(
  source: EstimateSource,
  assignments: ReadonlyArray<{ estimateLineId: string; recipe: MaterialRecipe }>,
): PreviewResult<MaterialRequirementPreview[]> {
  const errors = validateEstimate(source);
  const byItem = new Map(source.lines.map((line) => [line.id, line]));
  const used = new Set<string>();
  const requirements: MaterialRequirementPreview[] = [];
  for (const { estimateLineId, recipe } of assignments) {
    const line = byItem.get(estimateLineId);
    if (!line) { errors.push("Rețetă asociată unei poziții inexistente în deviz."); continue; }
    if (used.has(estimateLineId)) { errors.push("Aceeași poziție de deviz a primit două rețete."); continue; }
    used.add(estimateLineId);
    if (recipe.organizationId !== source.organizationId) {
      errors.push("Rețeta materialelor nu aparține firmei curente.");
      continue;
    }
    if (!recipe.ingredients.length) {
      errors.push("Rețeta „" + recipe.name + "” nu are materiale.");
      continue;
    }
    for (const item of recipe.ingredients) {
      if (!positiveNumber(item.quantityPerUnit) || !nonnegativeMoney(item.unitCostCents) || !item.description.trim() || !item.unit.trim()) {
        errors.push("Material invalid în rețeta „" + recipe.name + "”.");
        continue;
      }
      const quantity = line.quantity * item.quantityPerUnit;
      const estimatedCostCents = Math.round(quantity * item.unitCostCents);
      if (!positiveNumber(quantity) || !nonnegativeMoney(estimatedCostCents)) {
        errors.push("Costul materialelor depășește limitele previzualizării.");
        continue;
      }
      requirements.push({
        estimateId: source.id,
        estimateLineId: line.id,
        recipeId: recipe.id,
        ingredientId: item.id,
        description: item.description.trim(),
        quantity,
        unit: item.unit.trim(),
        unitCostCents: item.unitCostCents,
        vendor: item.vendor?.trim() || null,
        estimatedCostCents,
        status: "planned",
      });
    }
  }
  if (!assignments.length) errors.push("Selectează cel puțin o rețetă pentru a genera necesarul.");
  return errors.length ? { ok: false, reasons: [...new Set(errors)] } : { ok: true, value: requirements };
}

export function buildClientOffer(source: EstimateSource): PreviewResult<CommercialPreview> {
  const errors = validateEstimate(source);
  if (source.status === "rejected" || source.status === "expired") errors.push("Devizul respins sau expirat nu poate fi ofertat direct.");
  if (errors.length) return { ok: false, reasons: errors };
  return {
    ok: true,
    value: {
      type: "offer", sourceEstimateId: source.id, organizationId: source.organizationId,
      clientId: source.clientId!, workId: source.workId, currency: source.currency,
      title: source.title, subtotalCents: source.subtotalCents, discountCents: source.discountCents,
      totalCents: source.totalCents, sourceUpdatedAt: source.updatedAt,
      lines: source.lines.map((line) => ({ ...line })), fiscalInvoice: false,
    },
  };
}

/** A draft is not an invoice number, not an issuance event, not a submission. */
export function buildInvoiceDraft(
  source: EstimateSource,
  offerAccepted: boolean,
): PreviewResult<CommercialPreview> {
  const result = buildClientOffer(source);
  if (!result.ok) return result;
  const reasons: string[] = [];
  if (!offerAccepted || source.status !== "accepted") reasons.push("Oferta și devizul trebuie acceptate explicit înaintea facturii.");
  if (!source.taxRate && source.taxRate !== 0) reasons.push("Regimul fiscal și categoria TVA trebuie confirmate separat.");
  if (reasons.length) return { ok: false, reasons };
  return {
    ok: true,
    value: { ...result.value, type: "invoice_draft" },
  };
}

export type FiscalReadiness = {
  legalEntityApproved: boolean;
  buyerDetailsApproved: boolean;
  vatCategoryApproved: boolean;
  invoiceNumberReserved: boolean;
  invoiceSnapshotLocked: boolean;
  anafAuthorizationActive: boolean;
  roleAuthorized: boolean;
  explicitUserConfirmation: boolean;
};

/** Preparation-only gate; no network connection, XML generation or SPV submission. */
export function getFiscalSubmissionBlockers(gates: FiscalReadiness): string[] {
  const required: ReadonlyArray<[keyof FiscalReadiness, string]> = [
    ["legalEntityApproved", "Confirmă datele fiscale și regimul emitentului."],
    ["buyerDetailsApproved", "Confirmă identitatea fiscală a cumpărătorului."],
    ["vatCategoryApproved", "Confirmă categoriile și regulile TVA pentru fiecare linie."],
    ["invoiceNumberReserved", "Rezervă numărul unic din seria fiscală."],
    ["invoiceSnapshotLocked", "Blochează o versiune emisă, nemodificabilă, a facturii."],
    ["anafAuthorizationActive", "Conectează și autorizează firma la SPV/ANAF."],
    ["roleAuthorized", "Este necesar un utilizator cu rol de emitere autorizat."],
    ["explicitUserConfirmation", "Emiterea și transmiterea necesită confirmare explicită."],
  ];
  return required.filter(([name]) => !gates[name]).map(([, reason]) => reason);
}
