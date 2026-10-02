"use client";

import { useEffect } from "react";
import {
  WORKSPACE_LIVE_CONTEXT_EVENT,
  type WorkspaceLiveContext,
} from "@/lib/workspace-live-context";

export function useWorkspaceLiveContext(context: WorkspaceLiveContext) {
  useEffect(() => {
    const detail: WorkspaceLiveContext = {
      clientId: context.clientId,
      taskId: context.taskId,
      estimateId: context.estimateId,
      purchaseOrderId: context.purchaseOrderId,
      documentId: context.documentId,
    };
    window.dispatchEvent(
      new CustomEvent<WorkspaceLiveContext>(WORKSPACE_LIVE_CONTEXT_EVENT, {
        detail,
      })
    );
  }, [
    context.clientId,
    context.taskId,
    context.estimateId,
    context.purchaseOrderId,
    context.documentId,
  ]);
}
