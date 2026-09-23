/**
 * Commercial operator identity is intentionally separate from the ORBYVEN brand.
 * An entity key is an internal immutable identifier for ONE legal issuer
 * (e.g. pfa-2027-01, then srl-2028-01). Never reuse it for another CUI/CIF.
 *
 * PRELAUNCH is not a merchant and must never pass live-billing readiness.
 */
export type CommercialEntityType = "prelaunch" | "pfa" | "srl";

const entityTypeValue = process.env.ORBYVEN_COMMERCIAL_ENTITY_TYPE?.trim().toLowerCase() ?? "";
const entityType: CommercialEntityType =
  entityTypeValue === "pfa" || entityTypeValue === "srl" ? entityTypeValue : "prelaunch";

export const commercialIdentity = {
  entityType,
  /** Empty until the first legitimate merchant is approved and created. */
  entityKey: process.env.ORBYVEN_COMMERCIAL_ENTITY_KEY?.trim() ?? "",
  /** Stops NEW purchases, without blocking webhook history or customer access. */
  checkoutPaused: process.env.ORBYVEN_COMMERCIAL_CHECKOUT_PAUSED !== "false",
} as const;

export function hasValidCommercialEntityKey() {
  return /^[a-z0-9][a-z0-9_-]{2,63}$/.test(commercialIdentity.entityKey);
}

/** RO prefix is VAT-related and not a different underlying numeric CIF. */
export function normalizeRomanianTaxId(value: string) {
  return value.replace(/\s+/g, "").replace(/^RO/i, "").toUpperCase();
}
