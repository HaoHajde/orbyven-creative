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
  | "create_calendar_event";

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
    };

export type IntelligenceResponse = {
  specialist: IntelligenceSpecialist;
  answer: string;
  facts: Array<{ label: string; value: string }>;
  actions: IntelligenceAction[];
  generatedBy: "orbyven_core";
};
