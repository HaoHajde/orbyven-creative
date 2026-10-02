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
        suggestedPrompt?: string;
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

export type IntelligenceFocusReason =
  | "blocked"
  | "overdue"
  | "priority"
  | "unassigned"
  | "unplanned"
  | "lead_followup"
  | "estimate_followup"
  | "appointment";

export type IntelligenceFocusInsight = {
  reason?: IntelligenceFocusReason;
  why: string;
  consequence: string;
  nextStep: string;
  confidence: "high" | "medium";
};

export type IntelligenceDecisionOption = {
  label: string;
  impact: string;
  tradeoff: string;
  whenToUse: string;
  handoffPrompt?: string;
};

export type IntelligenceDecisionSupport = {
  subject: string;
  options: IntelligenceDecisionOption[];
  handoffAvailable?: boolean;
  confidence: "high" | "medium";
};

export type IntelligenceOutcome = {
  planId: string;
  status: "resolved" | "shifted" | "still_priority";
  previousFocus?: string;
  currentFocus?: string;
  summary: string;
  confidence: "high" | "medium";
};

export type IntelligenceResponse = {
  specialist: IntelligenceSpecialist;
  answer: string;
  facts: Array<{ label: string; value: string }>;
  actions: IntelligenceAction[];
  focus?: IntelligenceFocusInsight;
  decision?: IntelligenceDecisionSupport;
  outcome?: IntelligenceOutcome;
  generatedBy: "orbyven_core";
};
