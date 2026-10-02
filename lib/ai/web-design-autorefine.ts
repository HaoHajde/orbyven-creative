import type { EditableSite, SiteSectionId } from "@/lib/ai/site-editor";
import type { WebDesignStrategy } from "@/lib/ai/web-design-intent";
import {
  critiqueWebDesign,
  type WebDesignQualityReport,
} from "@/lib/ai/web-design-quality";
import {
  evaluateWebDesignReadiness,
  type WebDesignReadinessReport,
} from "@/lib/ai/web-design-readiness";

export type WebDesignAutonomousChange =
  | "rechecked_quality"
  | "restored_strategy_structure"
  | "hid_optional_placeholder_section";

export type WebDesignAutonomousRefinementReport = {
  attempted: boolean;
  passes: number;
  improved: boolean;
  initialQuality: number;
  finalQuality: number;
  initialReadiness: number;
  finalReadiness: number;
  changes: WebDesignAutonomousChange[];
  remainingActions: string[];
};

export type WebDesignAutonomousRefinementResult = {
  draft: EditableSite;
  quality: WebDesignQualityReport;
  readiness: WebDesignReadinessReport;
  refinement: WebDesignAutonomousRefinementReport;
};

const MAX_PASSES = 2;
const CORE_SECTIONS = new Set<SiteSectionId>(["hero", "services", "contact"]);

function cloneDraft(input: EditableSite): EditableSite {
  return {
    ...input,
    sectionOrder: [...input.sectionOrder],
    hiddenSections: [...input.hiddenSections],
    variants: { ...input.variants },
    services: input.services.map((item) => ({ ...item })),
    benefits: input.benefits.map((item) => ({ ...item })),
    gallery: input.gallery.map((item) => ({ ...item })),
    process: input.process.map((item) => ({ ...item })),
    faq: input.faq.map((item) => ({ ...item })),
  };
}

function stableFingerprint(draft: EditableSite) {
  return JSON.stringify({
    layout: draft.layout,
    headlineSize: draft.headlineSize,
    visualTone: draft.visualTone,
    density: draft.density,
    radius: draft.radius,
    sectionOrder: draft.sectionOrder,
    hiddenSections: draft.hiddenSections,
    variants: draft.variants,
    cta: draft.cta,
    textColor: draft.textColor,
    background: draft.background,
    surface: draft.surface,
  });
}

function remainingActions(
  readiness: WebDesignReadinessReport,
  quality: WebDesignQualityReport
) {
  const actions: string[] = [];

  for (const blocker of readiness.blockers) {
    if (blocker.code === "PLACEHOLDER_COPY") {
      actions.push("Înlocuiește conținutul demonstrativ cu informații, proiecte sau produse reale.");
    } else if (blocker.code === "DEMO_BRAND") {
      actions.push("Înlocuiește numele demonstrativ cu numele real al brandului.");
    } else if (blocker.code === "TOO_FEW_READY_SECTIONS") {
      actions.push("Completează structura cu informațiile reale necesare traseului principal.");
    } else if (blocker.code === "QUALITY_REVIEW_REQUIRED") {
      actions.push("Revizuiește problemele tehnice rămase semnalate de Quality Critic.");
    }
  }

  if (quality.issues.some((issue) => issue.code === "REDUNDANT_COPY")) {
    actions.push("Diferențiază textele care repetă aceeași idee în mai multe secțiuni.");
  }

  return [...new Set(actions)].slice(0, 4);
}

function restoreStrategyStructure(
  input: EditableSite,
  strategy: WebDesignStrategy
) {
  if (strategy.mode === "refine") return input;

  const draft = cloneDraft(input);
  const requiredVisible = new Set(strategy.visibleSections);
  draft.hiddenSections = draft.hiddenSections.filter(
    (section) => !requiredVisible.has(section)
  );
  return draft;
}

function hideOptionalPlaceholderSections(
  input: EditableSite,
  strategy: WebDesignStrategy,
  readiness: WebDesignReadinessReport
) {
  if (strategy.mode === "refine") return input;

  const placeholderBlocker = readiness.blockers.find(
    (blocker) => blocker.code === "PLACEHOLDER_COPY"
  );
  if (!placeholderBlocker?.sections.length) return input;

  const strategicVisible = new Set(strategy.visibleSections);
  const optional = placeholderBlocker.sections.filter(
    (section) =>
      !CORE_SECTIONS.has(section) &&
      !strategicVisible.has(section) &&
      !input.hiddenSections.includes(section)
  );

  if (!optional.length) return input;

  const draft = cloneDraft(input);
  draft.hiddenSections = [...new Set([...draft.hiddenSections, ...optional])];
  return draft;
}

export function autonomouslyRefineWebDesign(
  input: EditableSite,
  strategy: WebDesignStrategy
): WebDesignAutonomousRefinementResult {
  const firstQuality = critiqueWebDesign(input, strategy);
  let draft = firstQuality.draft;
  let quality = firstQuality.report;
  let readiness = evaluateWebDesignReadiness(draft, strategy, quality);

  const initialQuality = quality.score;
  const initialReadiness = readiness.score;
  const changes: WebDesignAutonomousChange[] = [];

  let passes = 0;

  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    if (quality.score >= 90 && readiness.score >= 90) break;

    const before = stableFingerprint(draft);
    passes += 1;

    const restored = restoreStrategyStructure(draft, strategy);
    if (stableFingerprint(restored) !== stableFingerprint(draft)) {
      draft = restored;
      changes.push("restored_strategy_structure");
    }

    const optionalHidden = hideOptionalPlaceholderSections(
      draft,
      strategy,
      readiness
    );
    if (stableFingerprint(optionalHidden) !== stableFingerprint(draft)) {
      draft = optionalHidden;
      changes.push("hid_optional_placeholder_section");
    }

    const nextQuality = critiqueWebDesign(draft, strategy);
    draft = nextQuality.draft;
    quality = nextQuality.report;
    readiness = evaluateWebDesignReadiness(draft, strategy, quality);
    changes.push("rechecked_quality");

    const after = stableFingerprint(draft);
    if (before === after && quality.fixesApplied === 0) break;
  }

  return {
    draft,
    quality,
    readiness,
    refinement: {
      attempted: passes > 0,
      passes,
      improved:
        quality.score > initialQuality || readiness.score > initialReadiness,
      initialQuality,
      finalQuality: quality.score,
      initialReadiness,
      finalReadiness: readiness.score,
      changes: [...new Set(changes)],
      remainingActions: remainingActions(readiness, quality),
    },
  };
}
