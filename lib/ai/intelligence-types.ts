import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

export type IntelligenceSpecialist =
  | "operations"
  | "finance"
  | "web_design"
  | "documents"
  | "general";

export type IntelligenceIntent = {
  specialist: IntelligenceSpecialist;
  confidence: "high" | "medium";
  normalizedPrompt: string;
};

export type IntelligenceMutationType =
  | "create_lead"
  | "create_client"
  | "create_task"
  | "create_calendar_event"
  | "create_estimate"
  | "create_document_draft";

export type PlanRecoveryReason = "rejected" | "expired" | "failed";
export type PlanRecoveryMode = "resume" | "needs_input";

export type IntelligenceAction =
  | {
      kind: "open_module";
      label: string;
      moduleId: OrbyvenModuleId;
      recordId?: string;
      clientId?: string;
      taskId?: string;
      estimateId?: string;
    }
  | {
      kind: "open_path";
      label: string;
      href: string;
    }
  | {
      kind: "confirm_proposal";
      label: string;
      proposalId: string;
      actionType: IntelligenceMutationType;
      expiresAt: string;
      targetModule: OrbyvenModuleId;
    }
  | {
      kind: "repair_plan";
      label: string;
      blockedStep: number;
      suggestedPrompt: string;
      message: string;
    }
  | {
      kind: "review_plan";
      label: string;
      planId: string;
      expiresAt: string;
      recovery?: {
        blockedStep: number;
        reason: PlanRecoveryReason;
        mode: PlanRecoveryMode;
        label: string;
        message: string;
      };
      steps: Array<{
        proposalId: string;
        index: number;
        summary: string;
        actionType: IntelligenceMutationType;
        targetModule: OrbyvenModuleId;
        status: "ready" | "locked" | "executed" | "rejected" | "expired" | "failed";
      }>;
    };

export type IntelligenceResponse = {
  specialist: IntelligenceSpecialist;
  answer: string;
  facts: Array<{ label: string; value: string }>;
  actions: IntelligenceAction[];
  generatedBy: "orbyven_core";
};
