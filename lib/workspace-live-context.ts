import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";

export const WORKSPACE_LIVE_CONTEXT_EVENT = "orbyven:workspace-live-context";

export type WorkspaceLiveContext = Pick<
  WorkspaceOpenOptions,
  "clientId" | "taskId" | "estimateId" | "purchaseOrderId"
>;
