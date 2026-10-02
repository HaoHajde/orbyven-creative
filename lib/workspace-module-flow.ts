import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";

export type WorkspaceModuleFlow = {
  summary: string;
  createLabel?: string;
  next: readonly OrbyvenModuleId[];
  related: readonly OrbyvenModuleId[];
};

export type WorkspaceFlowContext = Pick<
  WorkspaceOpenOptions,
  "clientId" | "taskId" | "estimateId" | "purchaseOrderId" | "documentId"
>;

export const WORKSPACE_MODULE_FLOW: Record<OrbyvenModuleId, WorkspaceModuleFlow> = {
  overview: {
    summary: "Vezi ce cere atenție și intră direct în modulul potrivit.",
    next: ["leads", "tasks", "calendar", "expenses"],
    related: ["leads", "tasks", "calendar", "estimates", "inventory", "expenses"],
  },
  leads: {
    summary: "Cerere → client → lucrare, ofertă sau programare.",
    createLabel: "Cerere",
    next: ["tasks", "estimates", "calendar"],
    related: ["tasks", "estimates", "calendar", "documents", "expenses"],
  },
  tasks: {
    summary: "Lucrare → programare → materiale → documente → încasare.",
    createLabel: "Lucrare",
    next: ["calendar", "inventory", "documents", "expenses"],
    related: ["leads", "calendar", "estimates", "inventory", "documents", "expenses", "thermal", "team"],
  },
  calendar: {
    summary: "Programare → resurse → execuție, fără suprapuneri.",
    createLabel: "Programare",
    next: ["tasks", "team"],
    related: ["tasks", "team", "leads", "documents"],
  },
  estimates: {
    summary: "Deviz → ofertă → lucrare → materiale → bani.",
    createLabel: "Deviz",
    next: ["tasks", "inventory", "expenses"],
    related: ["leads", "tasks", "inventory", "documents", "expenses"],
  },
  documents: {
    summary: "Păstrează dovada lângă client, lucrare, achiziție sau ofertă.",
    createLabel: "Document",
    next: ["tasks", "expenses"],
    related: ["leads", "tasks", "estimates", "inventory", "expenses"],
  },
  inventory: {
    summary: "Necesar → rezervare → comandă furnizor → consum pe lucrare.",
    next: ["tasks", "documents", "expenses"],
    related: ["tasks", "estimates", "documents", "expenses"],
  },
  expenses: {
    summary: "Încasări + costuri + scadențe, legate de activitatea reală.",
    createLabel: "Cheltuială",
    next: ["tasks", "estimates"],
    related: ["leads", "tasks", "estimates", "inventory", "documents"],
  },
  thermal: {
    summary: "Plan tehnic → lucrare → deviz, fără să rupi contextul proiectului.",
    next: ["tasks", "estimates"],
    related: ["tasks", "estimates", "documents"],
  },
  team: {
    summary: "Oameni și resurse → disponibilitate → programare.",
    next: ["calendar", "tasks"],
    related: ["calendar", "tasks"],
  },
};

export function getEnabledWorkspaceFlow(
  moduleId: OrbyvenModuleId,
  enabledModules: readonly OrbyvenModuleId[],
) {
  const enabled = new Set(enabledModules);
  const flow = WORKSPACE_MODULE_FLOW[moduleId];
  return {
    ...flow,
    next: flow.next.filter((id) => enabled.has(id)),
    related: flow.related.filter((id) => enabled.has(id) && id !== moduleId),
  };
}

export function getWorkspaceTargetOptions(
  target: OrbyvenModuleId,
  context: WorkspaceFlowContext,
  extra: Pick<WorkspaceOpenOptions, "create"> = {},
): WorkspaceOpenOptions {
  const base: WorkspaceOpenOptions =
    target === "leads"
      ? { recordId: context.clientId }
      : target === "tasks"
        ? { recordId: context.taskId, clientId: context.clientId, estimateId: context.estimateId }
        : target === "calendar"
          ? { clientId: context.clientId, taskId: context.taskId }
          : target === "estimates"
            ? { recordId: context.estimateId, clientId: context.clientId, taskId: context.taskId }
            : target === "documents"
              ? { recordId: context.documentId, taskId: context.taskId, purchaseOrderId: context.purchaseOrderId }
              : target === "inventory"
                ? { taskId: context.taskId }
                : target === "expenses"
                  ? {
                      clientId: context.clientId,
                      taskId: context.taskId,
                      estimateId: context.estimateId,
                      purchaseOrderId: context.purchaseOrderId,
                      documentId: context.documentId,
                    }
                  : target === "thermal"
                    ? { taskId: context.taskId }
                    : {};

  const result = { ...base, ...extra };
  if (extra.create) delete result.recordId;
  return result;
}
