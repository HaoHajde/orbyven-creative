import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

// Navigation intent is UI-only: the existing organization-scoped module APIs and RLS
// continue to authorize every read and write.
export type WorkspaceOpenOptions = {
  create?: boolean;
  recordId?: string;
  clientId?: string;
  taskId?: string;
  estimateId?: string;
  purchaseOrderId?: string;
  documentId?: string;
  expenseId?: string;
  documentCategory?: "general" | "estimate" | "contract" | "invoice" | "photo" | "receipt" | "other";
  prefillTitle?: string;
};

export type WorkspaceNavigationIntent = WorkspaceOpenOptions & {
  module: OrbyvenModuleId;
  token: number;
};
