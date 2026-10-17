import type { ImportFieldDefinition } from "@/lib/data-portability/import-preflight";

export const IMPORT_TARGET_IDS = ["crm_contacts"] as const;

export type ImportTargetId = (typeof IMPORT_TARGET_IDS)[number];

export type ImportTargetContract = {
  id: ImportTargetId;
  label: string;
  requiredModuleId: string;
  fields: readonly ImportFieldDefinition[];
  duplicateKeyFields: readonly string[];
  duplicateStrategy: "normalized_email";
};

const CRM_CONTACT_FIELDS: readonly ImportFieldDefinition[] = [
  { key: "name", label: "Nume", required: true, type: "text" },
  { key: "company", label: "Companie", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Telefon", type: "text" },
  { key: "source", label: "Sursă", type: "text" },
  { key: "note", label: "Notă", type: "text" },
  { key: "estimated_value", label: "Valoare estimată", type: "number" },
  { key: "currency", label: "Monedă", type: "text" },
];

const IMPORT_TARGETS: Record<ImportTargetId, ImportTargetContract> = {
  crm_contacts: {
    id: "crm_contacts",
    label: "CRM · contacte și clienți",
    requiredModuleId: "leads",
    fields: CRM_CONTACT_FIELDS,
    duplicateKeyFields: ["email"],
    duplicateStrategy: "normalized_email",
  },
};

export function parseImportTargetId(value: unknown): ImportTargetId | null {
  return typeof value === "string" && (IMPORT_TARGET_IDS as readonly string[]).includes(value)
    ? value as ImportTargetId
    : null;
}

export function getImportTargetContract(targetId: ImportTargetId): ImportTargetContract {
  return IMPORT_TARGETS[targetId];
}
