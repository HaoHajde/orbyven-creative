export const WORKSPACE_CUSTOM_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "datetime",
  "boolean",
  "select",
  "multi_select",
  "url",
  "email",
  "phone",
] as const;

export type WorkspaceCustomFieldType = (typeof WORKSPACE_CUSTOM_FIELD_TYPES)[number];

export type WorkspaceCustomFieldOption = {
  value: string;
  label: string;
};

export type WorkspaceCustomFieldConfig = {
  options?: WorkspaceCustomFieldOption[];
  placeholder?: string;
  helpText?: string;
};

export type WorkspaceCustomFieldDefinition = {
  id: string;
  organizationId: string;
  entityType: string;
  fieldKey: string;
  label: string;
  fieldType: WorkspaceCustomFieldType;
  config: WorkspaceCustomFieldConfig;
  required: boolean;
  active: boolean;
  sortOrder: number;
};

export type WorkspaceCustomFieldDefinitionDraft = Omit<
  WorkspaceCustomFieldDefinition,
  "id" | "organizationId"
>;

export type WorkspaceCustomFieldValidation =
  | { valid: true }
  | { valid: false; error: string };

const ENTITY_TYPE_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
const FIELD_KEY_PATTERN = /^[a-z][a-z0-9_]{0,62}$/;
const SIMPLE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optionsFor(definition: Pick<WorkspaceCustomFieldDefinition, "config">) {
  return Array.isArray(definition.config.options) ? definition.config.options : [];
}

export function normalizeWorkspaceCustomFieldKey(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  const withLetterPrefix = /^[a-z]/.test(normalized)
    ? normalized
    : `field_${normalized || "custom"}`;

  return withLetterPrefix.slice(0, 63).replace(/_+$/g, "") || "field_custom";
}

export function validateWorkspaceCustomFieldDefinition(
  input: WorkspaceCustomFieldDefinitionDraft,
): WorkspaceCustomFieldValidation {
  if (!ENTITY_TYPE_PATTERN.test(input.entityType)) {
    return { valid: false, error: "CUSTOM_FIELD_ENTITY_TYPE_INVALID" };
  }
  if (!FIELD_KEY_PATTERN.test(input.fieldKey)) {
    return { valid: false, error: "CUSTOM_FIELD_KEY_INVALID" };
  }

  const label = input.label.trim();
  if (!label || label.length > 120) {
    return { valid: false, error: "CUSTOM_FIELD_LABEL_INVALID" };
  }
  if (!WORKSPACE_CUSTOM_FIELD_TYPES.includes(input.fieldType)) {
    return { valid: false, error: "CUSTOM_FIELD_TYPE_INVALID" };
  }
  if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
    return { valid: false, error: "CUSTOM_FIELD_SORT_ORDER_INVALID" };
  }
  if (!isRecord(input.config)) {
    return { valid: false, error: "CUSTOM_FIELD_CONFIG_INVALID" };
  }

  if (input.fieldType === "select" || input.fieldType === "multi_select") {
    const options = optionsFor(input);
    if (!options.length) {
      return { valid: false, error: "CUSTOM_FIELD_OPTIONS_REQUIRED" };
    }

    const seen = new Set<string>();
    for (const option of options) {
      if (!option || typeof option.value !== "string" || typeof option.label !== "string") {
        return { valid: false, error: "CUSTOM_FIELD_OPTION_INVALID" };
      }
      const value = option.value.trim();
      const optionLabel = option.label.trim();
      if (!value || value.length > 80 || !optionLabel || optionLabel.length > 120 || seen.has(value)) {
        return { valid: false, error: "CUSTOM_FIELD_OPTION_INVALID" };
      }
      seen.add(value);
    }
  }

  return { valid: true };
}

export function validateWorkspaceCustomFieldValue(
  definition: Pick<
    WorkspaceCustomFieldDefinition,
    "fieldType" | "config" | "required"
  >,
  value: unknown,
): WorkspaceCustomFieldValidation {
  if (value === null || value === undefined || value === "") {
    return definition.required
      ? { valid: false, error: "CUSTOM_FIELD_VALUE_REQUIRED" }
      : { valid: true };
  }

  switch (definition.fieldType) {
    case "text":
    case "textarea":
    case "phone":
      return typeof value === "string"
        ? { valid: true }
        : { valid: false, error: "CUSTOM_FIELD_VALUE_TYPE_INVALID" };

    case "number":
      return typeof value === "number" && Number.isFinite(value)
        ? { valid: true }
        : { valid: false, error: "CUSTOM_FIELD_VALUE_TYPE_INVALID" };

    case "boolean":
      return typeof value === "boolean"
        ? { valid: true }
        : { valid: false, error: "CUSTOM_FIELD_VALUE_TYPE_INVALID" };

    case "date":
      return typeof value === "string" && ISO_DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
        ? { valid: true }
        : { valid: false, error: "CUSTOM_FIELD_VALUE_DATE_INVALID" };

    case "datetime":
      return typeof value === "string" && !Number.isNaN(Date.parse(value))
        ? { valid: true }
        : { valid: false, error: "CUSTOM_FIELD_VALUE_DATETIME_INVALID" };

    case "email":
      return typeof value === "string" && SIMPLE_EMAIL_PATTERN.test(value)
        ? { valid: true }
        : { valid: false, error: "CUSTOM_FIELD_VALUE_EMAIL_INVALID" };

    case "url":
      if (typeof value !== "string") {
        return { valid: false, error: "CUSTOM_FIELD_VALUE_URL_INVALID" };
      }
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:"
          ? { valid: true }
          : { valid: false, error: "CUSTOM_FIELD_VALUE_URL_INVALID" };
      } catch {
        return { valid: false, error: "CUSTOM_FIELD_VALUE_URL_INVALID" };
      }

    case "select": {
      if (typeof value !== "string") {
        return { valid: false, error: "CUSTOM_FIELD_VALUE_OPTION_INVALID" };
      }
      const options = new Set(optionsFor(definition).map((option) => option.value));
      return options.has(value)
        ? { valid: true }
        : { valid: false, error: "CUSTOM_FIELD_VALUE_OPTION_INVALID" };
    }

    case "multi_select": {
      if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
        return { valid: false, error: "CUSTOM_FIELD_VALUE_OPTION_INVALID" };
      }
      const values = value as string[];
      if (new Set(values).size !== values.length) {
        return { valid: false, error: "CUSTOM_FIELD_VALUE_OPTION_INVALID" };
      }
      const options = new Set(optionsFor(definition).map((option) => option.value));
      return values.every((item) => options.has(item))
        ? { valid: true }
        : { valid: false, error: "CUSTOM_FIELD_VALUE_OPTION_INVALID" };
    }
  }
}

export function requireWorkspaceCustomFieldMutationConfirmation(confirmed: boolean) {
  if (!confirmed) throw new Error("CUSTOM_FIELD_CONFIRMATION_REQUIRED");
}
