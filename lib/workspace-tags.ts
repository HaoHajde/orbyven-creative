export type WorkspaceTag = {
  id: string;
  organizationId: string;
  tagKey: string;
  name: string;
  color: string | null;
  active: boolean;
  sortOrder: number;
};

export type WorkspaceTagDraft = Omit<WorkspaceTag, "id" | "organizationId">;

export type WorkspaceTagValidation =
  | { valid: true }
  | { valid: false; error: string };

const TAG_KEY_PATTERN = /^[a-z][a-z0-9_]{0,62}$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const ENTITY_TYPE_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;

export function normalizeWorkspaceTagKey(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  const withLetterPrefix = /^[a-z]/.test(normalized)
    ? normalized
    : `tag_${normalized || "custom"}`;

  return withLetterPrefix.slice(0, 63).replace(/_+$/g, "") || "tag_custom";
}

export function validateWorkspaceTag(input: WorkspaceTagDraft): WorkspaceTagValidation {
  if (!TAG_KEY_PATTERN.test(input.tagKey)) {
    return { valid: false, error: "WORKSPACE_TAG_KEY_INVALID" };
  }

  const name = input.name.trim();
  if (!name || name.length > 80) {
    return { valid: false, error: "WORKSPACE_TAG_NAME_INVALID" };
  }

  if (input.color !== null && !HEX_COLOR_PATTERN.test(input.color)) {
    return { valid: false, error: "WORKSPACE_TAG_COLOR_INVALID" };
  }

  if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
    return { valid: false, error: "WORKSPACE_TAG_SORT_ORDER_INVALID" };
  }

  return { valid: true };
}

export function validateWorkspaceTagAssignment(input: {
  entityType: string;
  entityId: string;
}): WorkspaceTagValidation {
  if (!ENTITY_TYPE_PATTERN.test(input.entityType)) {
    return { valid: false, error: "WORKSPACE_TAG_ENTITY_TYPE_INVALID" };
  }

  const entityId = input.entityId.trim();
  if (!entityId || entityId.length > 160) {
    return { valid: false, error: "WORKSPACE_TAG_ENTITY_ID_INVALID" };
  }

  return { valid: true };
}

export function requireWorkspaceTagMutationConfirmation(confirmed: boolean) {
  if (!confirmed) throw new Error("WORKSPACE_TAG_CONFIRMATION_REQUIRED");
}
