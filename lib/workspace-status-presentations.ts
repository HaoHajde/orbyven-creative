export type WorkspaceStatusEntityType =
  | "crm_leads"
  | "ops_tasks"
  | "calendar_events"
  | "sales_estimates";

export type WorkspaceSystemStatusDefinition = {
  entityType: WorkspaceStatusEntityType;
  statusKey: string;
  defaultLabel: string;
  defaultColor: string | null;
  defaultOrder: number;
  protected: true;
};

export type WorkspaceStatusPresentationDraft = {
  entityType: WorkspaceStatusEntityType;
  statusKey: string;
  displayLabel: string;
  color: string | null;
  sortOrder: number;
};

export type WorkspaceStatusPresentationOverride = WorkspaceStatusPresentationDraft & {
  organizationId?: string;
};

export type WorkspaceResolvedStatusPresentation = {
  entityType: WorkspaceStatusEntityType;
  statusKey: string;
  displayLabel: string;
  color: string | null;
  sortOrder: number;
  protected: true;
  source: "system" | "override";
};

export type WorkspaceStatusPresentationValidation =
  | { valid: true }
  | { valid: false; error: string };

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export const WORKSPACE_SYSTEM_STATUSES: Readonly<
  Record<WorkspaceStatusEntityType, readonly WorkspaceSystemStatusDefinition[]>
> = {
  crm_leads: [
    { entityType: "crm_leads", statusKey: "new", defaultLabel: "Nou", defaultColor: null, defaultOrder: 0, protected: true },
    { entityType: "crm_leads", statusKey: "contacted", defaultLabel: "Contactat", defaultColor: null, defaultOrder: 1, protected: true },
    { entityType: "crm_leads", statusKey: "qualified", defaultLabel: "Calificat", defaultColor: null, defaultOrder: 2, protected: true },
    { entityType: "crm_leads", statusKey: "proposal", defaultLabel: "Ofertă", defaultColor: null, defaultOrder: 3, protected: true },
    { entityType: "crm_leads", statusKey: "won", defaultLabel: "Câștigat", defaultColor: null, defaultOrder: 4, protected: true },
    { entityType: "crm_leads", statusKey: "lost", defaultLabel: "Pierdut", defaultColor: null, defaultOrder: 5, protected: true },
  ],
  ops_tasks: [
    { entityType: "ops_tasks", statusKey: "planned", defaultLabel: "De făcut", defaultColor: null, defaultOrder: 0, protected: true },
    { entityType: "ops_tasks", statusKey: "in_progress", defaultLabel: "În lucru", defaultColor: null, defaultOrder: 1, protected: true },
    { entityType: "ops_tasks", statusKey: "blocked", defaultLabel: "Blocat", defaultColor: null, defaultOrder: 2, protected: true },
    { entityType: "ops_tasks", statusKey: "done", defaultLabel: "Finalizat", defaultColor: null, defaultOrder: 3, protected: true },
    { entityType: "ops_tasks", statusKey: "cancelled", defaultLabel: "Anulat", defaultColor: null, defaultOrder: 4, protected: true },
  ],
  calendar_events: [
    { entityType: "calendar_events", statusKey: "scheduled", defaultLabel: "Programat", defaultColor: null, defaultOrder: 0, protected: true },
    { entityType: "calendar_events", statusKey: "completed", defaultLabel: "Finalizat", defaultColor: null, defaultOrder: 1, protected: true },
    { entityType: "calendar_events", statusKey: "cancelled", defaultLabel: "Anulat", defaultColor: null, defaultOrder: 2, protected: true },
  ],
  sales_estimates: [
    { entityType: "sales_estimates", statusKey: "draft", defaultLabel: "Draft", defaultColor: null, defaultOrder: 0, protected: true },
    { entityType: "sales_estimates", statusKey: "sent", defaultLabel: "Trimisă", defaultColor: null, defaultOrder: 1, protected: true },
    { entityType: "sales_estimates", statusKey: "accepted", defaultLabel: "Acceptată", defaultColor: null, defaultOrder: 2, protected: true },
    { entityType: "sales_estimates", statusKey: "rejected", defaultLabel: "Respinsă", defaultColor: null, defaultOrder: 3, protected: true },
    { entityType: "sales_estimates", statusKey: "expired", defaultLabel: "Expirată", defaultColor: null, defaultOrder: 4, protected: true },
  ],
};

export function getWorkspaceSystemStatuses(entityType: WorkspaceStatusEntityType) {
  return WORKSPACE_SYSTEM_STATUSES[entityType];
}

export function getWorkspaceSystemStatus(
  entityType: WorkspaceStatusEntityType,
  statusKey: string
) {
  return WORKSPACE_SYSTEM_STATUSES[entityType].find((status) => status.statusKey === statusKey) ?? null;
}

export function isWorkspaceSystemStatus(
  entityType: WorkspaceStatusEntityType,
  statusKey: string
) {
  return Boolean(getWorkspaceSystemStatus(entityType, statusKey));
}

export function validateWorkspaceStatusPresentation(
  input: WorkspaceStatusPresentationDraft
): WorkspaceStatusPresentationValidation {
  if (!isWorkspaceSystemStatus(input.entityType, input.statusKey)) {
    return { valid: false, error: "WORKSPACE_STATUS_SYSTEM_KEY_REQUIRED" };
  }

  const label = input.displayLabel.trim();
  if (!label || label.length > 80) {
    return { valid: false, error: "WORKSPACE_STATUS_LABEL_INVALID" };
  }

  if (input.color !== null && !HEX_COLOR_PATTERN.test(input.color)) {
    return { valid: false, error: "WORKSPACE_STATUS_COLOR_INVALID" };
  }

  if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
    return { valid: false, error: "WORKSPACE_STATUS_SORT_ORDER_INVALID" };
  }

  return { valid: true };
}

export function resolveWorkspaceStatusPresentation(
  entityType: WorkspaceStatusEntityType,
  statusKey: string,
  override?: WorkspaceStatusPresentationOverride | null
): WorkspaceResolvedStatusPresentation {
  const systemStatus = getWorkspaceSystemStatus(entityType, statusKey);
  if (!systemStatus) throw new Error("WORKSPACE_STATUS_SYSTEM_KEY_REQUIRED");

  if (
    override &&
    override.entityType === entityType &&
    override.statusKey === statusKey &&
    validateWorkspaceStatusPresentation(override).valid
  ) {
    return {
      entityType,
      statusKey,
      displayLabel: override.displayLabel.trim(),
      color: override.color,
      sortOrder: override.sortOrder,
      protected: true,
      source: "override",
    };
  }

  return {
    entityType,
    statusKey,
    displayLabel: systemStatus.defaultLabel,
    color: systemStatus.defaultColor,
    sortOrder: systemStatus.defaultOrder,
    protected: true,
    source: "system",
  };
}

export function requireWorkspaceStatusPresentationMutationConfirmation(confirmed: boolean) {
  if (!confirmed) throw new Error("WORKSPACE_STATUS_PRESENTATION_CONFIRMATION_REQUIRED");
}
