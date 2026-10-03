import type { EditableSite } from "./site-editor.ts";
import { buildWebDesignStrategy, webDesignStrategyInstruction, type WebDesignStrategy } from "./web-design-intent.ts";
import { designDnaInstruction } from "./web-design-variation.ts";
import { resolveWebDesignRefineScope, webDesignRefineScopeInstruction, type WebDesignRefineScope } from "./web-design-refine-locks.ts";
import type { WebDesignInterviewFact } from "./web-design-interview.ts";
import { applyVerifiedSectionEvidence, type WebDesignVerifiedSectionPlan } from "./web-design-section-evidence.ts";

export type WebDesignGenerationContext = {
  strategy: WebDesignStrategy;
  sectionEvidence: WebDesignVerifiedSectionPlan;
  strategyInstruction: string;
  variationInstruction: string;
  refineScope: WebDesignRefineScope;
  refineInstruction: string;
};

export function prepareWebDesignGenerationContext(
  prompt: string,
  current: EditableSite,
  interviewFacts: WebDesignInterviewFact[]
): WebDesignGenerationContext {
  const baseStrategy = buildWebDesignStrategy(prompt, current);
  const sectionEvidence = applyVerifiedSectionEvidence(baseStrategy, interviewFacts, current);
  const strategy = sectionEvidence.strategy;
  const refineScope = resolveWebDesignRefineScope(prompt, strategy);

  return {
    strategy,
    sectionEvidence,
    strategyInstruction: webDesignStrategyInstruction(strategy),
    variationInstruction: designDnaInstruction(current, strategy, prompt),
    refineScope,
    refineInstruction: webDesignRefineScopeInstruction(refineScope),
  };
}
