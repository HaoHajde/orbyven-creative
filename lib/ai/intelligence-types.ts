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
    };

export type IntelligenceResponse = {
  specialist: IntelligenceSpecialist;
  answer: string;
  facts: Array<{ label: string; value: string }>;
  actions: IntelligenceAction[];
  generatedBy: "orbyven_core";
};
