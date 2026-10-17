export type WorkspaceReusableTemplateEntityType =
  | "ops_tasks"
  | "calendar_events"
  | "sales_estimates";

export type WorkspaceTaskTemplatePayload = {
  title: string;
  kind?: "task" | "work" | "order";
  priority?: "low" | "normal" | "high" | "urgent";
  description?: string;
  location?: string;
  estimatedMinutes?: number;
};

export type WorkspaceCalendarTemplatePayload = {
  title: string;
  eventType?: "appointment" | "work" | "follow_up" | "internal";
  allDay?: boolean;
  durationMinutes: number;
  location?: string;
  notes?: string;
  reminderMinutes?: number;
};

export type WorkspaceEstimateTemplateItem = {
  description: string;
  quantity: number;
  unitPriceLei: number;
};

export type WorkspaceEstimateTemplatePayload = {
  title: string;
  currency?: string;
  discountLei?: number;
  taxRate?: number | null;
  notes?: string;
  plannedLaborLei?: number;
  otherCostLei?: number;
  items: WorkspaceEstimateTemplateItem[];
};

export type WorkspaceReusableTemplatePayloadByEntity = {
  ops_tasks: WorkspaceTaskTemplatePayload;
  calendar_events: WorkspaceCalendarTemplatePayload;
  sales_estimates: WorkspaceEstimateTemplatePayload;
};

export type WorkspaceReusableTemplateDraft<
  T extends WorkspaceReusableTemplateEntityType = WorkspaceReusableTemplateEntityType,
> = {
  templateKey: string;
  entityType: T;
  name: string;
  description: string | null;
  payload: WorkspaceReusableTemplatePayloadByEntity[T];
  schemaVersion: 1;
  active: boolean;
  sortOrder: number;
};

export type WorkspaceReusableTemplateValidation =
  | { valid: true }
  | { valid: false; error: string };

const TEMPLATE_KEY_PATTERN = /^[a-z][a-z0-9_]{0,62}$/;
const CURRENCY_PATTERN = /^[A-Z]{3,8}$/;
const TASK_KINDS = new Set(["task", "work", "order"]);
const TASK_PRIORITIES = new Set(["low", "normal", "high", "urgent"]);
const EVENT_TYPES = new Set(["appointment", "work", "follow_up", "internal"]);

const TASK_KEYS = new Set([
  "title",
  "kind",
  "priority",
  "description",
  "location",
  "estimatedMinutes",
]);
const CALENDAR_KEYS = new Set([
  "title",
  "eventType",
  "allDay",
  "durationMinutes",
  "location",
  "notes",
  "reminderMinutes",
]);
const ESTIMATE_KEYS = new Set([
  "title",
  "currency",
  "discountLei",
  "taxRate",
  "notes",
  "plannedLaborLei",
  "otherCostLei",
  "items",
]);
const ESTIMATE_ITEM_KEYS = new Set(["description", "quantity", "unitPriceLei"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>) {
  return Object.keys(value).every((key) => allowed.has(key));
}

function requiredTrimmedString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function optionalString(value: unknown, maxLength: number) {
  return value === undefined || (typeof value === "string" && value.length <= maxLength);
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function nonnegativeNumber(value: unknown) {
  return finiteNumber(value) && value >= 0;
}

function nonnegativeInteger(value: unknown) {
  return finiteNumber(value) && Number.isInteger(value) && value >= 0;
}

export function normalizeWorkspaceReusableTemplateKey(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  const withLetterPrefix = /^[a-z]/.test(normalized)
    ? normalized
    : `template_${normalized || "custom"}`;

  return withLetterPrefix.slice(0, 63).replace(/_+$/g, "") || "template_custom";
}

export function validateWorkspaceReusableTemplatePayload(
  entityType: WorkspaceReusableTemplateEntityType,
  payload: unknown,
): WorkspaceReusableTemplateValidation {
  if (!isRecord(payload)) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_PAYLOAD_INVALID" };
  }

  if (entityType === "ops_tasks") {
    if (!hasOnlyKeys(payload, TASK_KEYS)) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_TASK_FIELDS_INVALID" };
    }
    if (!requiredTrimmedString(payload.title, 160)) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_TITLE_INVALID" };
    }
    if (payload.kind !== undefined && (typeof payload.kind !== "string" || !TASK_KINDS.has(payload.kind))) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_TASK_KIND_INVALID" };
    }
    if (
      payload.priority !== undefined &&
      (typeof payload.priority !== "string" || !TASK_PRIORITIES.has(payload.priority))
    ) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_TASK_PRIORITY_INVALID" };
    }
    if (!optionalString(payload.description, 4000) || !optionalString(payload.location, 240)) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_TEXT_INVALID" };
    }
    if (
      payload.estimatedMinutes !== undefined &&
      (!nonnegativeInteger(payload.estimatedMinutes) || payload.estimatedMinutes > 100000)
    ) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_TASK_DURATION_INVALID" };
    }
    return { valid: true };
  }

  if (entityType === "calendar_events") {
    if (!hasOnlyKeys(payload, CALENDAR_KEYS)) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_CALENDAR_FIELDS_INVALID" };
    }
    if (!requiredTrimmedString(payload.title, 160)) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_TITLE_INVALID" };
    }
    if (
      payload.eventType !== undefined &&
      (typeof payload.eventType !== "string" || !EVENT_TYPES.has(payload.eventType))
    ) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_EVENT_TYPE_INVALID" };
    }
    if (payload.allDay !== undefined && typeof payload.allDay !== "boolean") {
      return { valid: false, error: "WORKSPACE_TEMPLATE_ALL_DAY_INVALID" };
    }
    if (
      !finiteNumber(payload.durationMinutes) ||
      !Number.isInteger(payload.durationMinutes) ||
      payload.durationMinutes <= 0 ||
      payload.durationMinutes > 525600
    ) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_EVENT_DURATION_INVALID" };
    }
    if (!optionalString(payload.location, 240) || !optionalString(payload.notes, 4000)) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_TEXT_INVALID" };
    }
    if (
      payload.reminderMinutes !== undefined &&
      (!nonnegativeInteger(payload.reminderMinutes) || payload.reminderMinutes > 10080)
    ) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_REMINDER_INVALID" };
    }
    return { valid: true };
  }

  if (!hasOnlyKeys(payload, ESTIMATE_KEYS)) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_ESTIMATE_FIELDS_INVALID" };
  }
  if (!requiredTrimmedString(payload.title, 160)) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_TITLE_INVALID" };
  }
  if (
    payload.currency !== undefined &&
    (typeof payload.currency !== "string" || !CURRENCY_PATTERN.test(payload.currency))
  ) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_CURRENCY_INVALID" };
  }
  if (payload.discountLei !== undefined && !nonnegativeNumber(payload.discountLei)) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_DISCOUNT_INVALID" };
  }
  if (
    payload.taxRate !== undefined &&
    payload.taxRate !== null &&
    (!finiteNumber(payload.taxRate) || payload.taxRate < 0 || payload.taxRate > 100)
  ) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_TAX_INVALID" };
  }
  if (!optionalString(payload.notes, 4000)) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_TEXT_INVALID" };
  }
  if (payload.plannedLaborLei !== undefined && !nonnegativeNumber(payload.plannedLaborLei)) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_LABOR_INVALID" };
  }
  if (payload.otherCostLei !== undefined && !nonnegativeNumber(payload.otherCostLei)) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_OTHER_COST_INVALID" };
  }
  if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 100) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_ESTIMATE_ITEMS_INVALID" };
  }
  for (const item of payload.items) {
    if (!isRecord(item) || !hasOnlyKeys(item, ESTIMATE_ITEM_KEYS)) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_ESTIMATE_ITEM_FIELDS_INVALID" };
    }
    if (!requiredTrimmedString(item.description, 300)) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_ESTIMATE_ITEM_DESCRIPTION_INVALID" };
    }
    if (!finiteNumber(item.quantity) || item.quantity <= 0) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_ESTIMATE_ITEM_QUANTITY_INVALID" };
    }
    if (!nonnegativeNumber(item.unitPriceLei)) {
      return { valid: false, error: "WORKSPACE_TEMPLATE_ESTIMATE_ITEM_PRICE_INVALID" };
    }
  }
  return { valid: true };
}

export function validateWorkspaceReusableTemplateDraft(
  input: WorkspaceReusableTemplateDraft,
): WorkspaceReusableTemplateValidation {
  if (!TEMPLATE_KEY_PATTERN.test(input.templateKey)) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_KEY_INVALID" };
  }
  if (!requiredTrimmedString(input.name, 100)) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_NAME_INVALID" };
  }
  if (input.description !== null && (typeof input.description !== "string" || input.description.length > 500)) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_DESCRIPTION_INVALID" };
  }
  if (input.schemaVersion !== 1) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_SCHEMA_VERSION_INVALID" };
  }
  if (typeof input.active !== "boolean") {
    return { valid: false, error: "WORKSPACE_TEMPLATE_ACTIVE_INVALID" };
  }
  if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
    return { valid: false, error: "WORKSPACE_TEMPLATE_SORT_ORDER_INVALID" };
  }
  return validateWorkspaceReusableTemplatePayload(input.entityType, input.payload);
}

export function materializeWorkspaceReusableTemplatePrefill<
  T extends WorkspaceReusableTemplateEntityType,
>(
  entityType: T,
  payload: WorkspaceReusableTemplatePayloadByEntity[T],
): WorkspaceReusableTemplatePayloadByEntity[T] {
  const validation = validateWorkspaceReusableTemplatePayload(entityType, payload);
  if (!validation.valid) throw new Error(validation.error);

  if (entityType === "sales_estimates") {
    const source = payload as WorkspaceEstimateTemplatePayload;
    return {
      ...source,
      title: source.title.trim(),
      items: source.items.map((item) => ({
        description: item.description.trim(),
        quantity: item.quantity,
        unitPriceLei: item.unitPriceLei,
      })),
    } as WorkspaceReusableTemplatePayloadByEntity[T];
  }

  return {
    ...payload,
    title: payload.title.trim(),
  } as WorkspaceReusableTemplatePayloadByEntity[T];
}

export function requireWorkspaceReusableTemplateMutationConfirmation(confirmed: boolean) {
  if (!confirmed) throw new Error("WORKSPACE_TEMPLATE_CONFIRMATION_REQUIRED");
}
