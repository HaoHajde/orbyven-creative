import { commercialIdentity, hasValidCommercialEntityKey } from "@/lib/commercial-identity";

const env = (name: string) => process.env[name]?.trim() ?? "";

const contactEmail = env("ORBYVEN_CONTACT_EMAIL") || "orbyvent@gmail.com";
const supportEmail = env("ORBYVEN_SUPPORT_EMAIL") || contactEmail;
const vatLabel =
  env("ORBYVEN_VAT_LABEL") || env("NEXT_PUBLIC_ORBYVEN_PRICE_TAX_LABEL");

export const legalConfig = {
  tradeName: "ORBYVEN CREATIVE",
  entityType: commercialIdentity.entityType,
  entityKey: commercialIdentity.entityKey,
  legalName: env("ORBYVEN_LEGAL_NAME"),
  taxId: env("ORBYVEN_TAX_ID"),
  registrationNumber: env("ORBYVEN_REGISTRATION_NUMBER"),
  registeredOffice: env("ORBYVEN_REGISTERED_OFFICE"),
  contactEmail,
  supportEmail,
  vatLabel,
  documentVersion: "2026-09-23-v2",
  lastUpdated: "23 septembrie 2026",
  isComplete: Boolean(
    commercialIdentity.entityType !== "prelaunch" &&
      hasValidCommercialEntityKey() &&
      env("ORBYVEN_LEGAL_NAME") &&
      env("ORBYVEN_TAX_ID") &&
      env("ORBYVEN_REGISTRATION_NUMBER") &&
      env("ORBYVEN_REGISTERED_OFFICE") &&
      vatLabel
  ),
} as const;

export function operatorLabel() {
  return legalConfig.legalName || `${legalConfig.tradeName} (proiect în pregătire)`;
}
