import type { SiteSectionId } from "./site-editor.ts";
import type {
  WebDesignBriefGap,
  WebDesignBriefGapId,
  WebDesignBriefGapReport,
} from "./web-design-brief-gaps.ts";
import type { WebDesignReadinessReport } from "./web-design-readiness.ts";
import type { WebDesignAutonomousRefinementReport } from "./web-design-autorefine.ts";
import type { WebDesignEvidenceGuardReport } from "./web-design-evidence.ts";

export type WebDesignPublishStatus =
  | "ready"
  | "needs_input"
  | "needs_review";

export type WebDesignPublishStep =
  | {
      type: "ask_user";
      gapId: WebDesignBriefGapId;
      label: string;
      question: string;
      sections: SiteSectionId[];
    }
  | {
      type: "review";
      label: string;
      question: null;
      sections: SiteSectionId[];
    }
  | {
      type: "ready";
      label: string;
      question: null;
      sections: [];
    };

export type WebDesignPublishPlan = {
  score: number;
  status: WebDesignPublishStatus;
  publishable: boolean;
  requiredInputCount: number;
  optionalInputCount: number;
  requiredGapIds: WebDesignBriefGapId[];
  optionalGapIds: WebDesignBriefGapId[];
  autoResolvedCount: number;
  nextStep: WebDesignPublishStep;
};

const OPTIONAL_GAPS = new Set<WebDesignBriefGapId>([
  "claim_evidence",
]);

function uniqueGaps(gaps: WebDesignBriefGap[]) {
  const seen = new Set<WebDesignBriefGapId>();
  return gaps.filter((gap) => {
    if (seen.has(gap.id)) return false;
    seen.add(gap.id);
    return true;
  });
}

function publishScore(
  readiness: WebDesignReadinessReport,
  briefGaps: WebDesignBriefGapReport,
  requiredInputCount: number
) {
  const briefScore = Math.max(
    0,
    Math.min(100, briefGaps.completionScore)
  );
  const readinessScore = Math.max(
    0,
    Math.min(100, readiness.score)
  );
  const requiredPenalty = Math.min(30, requiredInputCount * 6);

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        Math.min(readinessScore, briefScore) - requiredPenalty
      )
    )
  );
}

function reviewSections(readiness: WebDesignReadinessReport) {
  return [
    ...new Set(
      readiness.blockers.flatMap((blocker) => blocker.sections)
    ),
  ].slice(0, 4);
}

export function buildWebDesignPublishPlan(
  readiness: WebDesignReadinessReport,
  briefGaps: WebDesignBriefGapReport,
  refinement: WebDesignAutonomousRefinementReport,
  evidence: WebDesignEvidenceGuardReport
): WebDesignPublishPlan {
  const gaps = uniqueGaps(briefGaps.gaps);

  const requiredGaps = gaps.filter(
    (gap) => !OPTIONAL_GAPS.has(gap.id)
  );
  const optionalGaps = gaps.filter((gap) =>
    OPTIONAL_GAPS.has(gap.id)
  );

  const publishable =
    readiness.status === "ready" &&
    readiness.blockers.length === 0 &&
    requiredGaps.length === 0;

  const autoResolvedCount =
    new Set(refinement.changes).size +
    evidence.revertedFields.length;

  if (requiredGaps.length > 0) {
    const next = [...requiredGaps].sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }
      return left.label.localeCompare(right.label, "ro");
    })[0];

    return {
      score: publishScore(readiness, briefGaps, requiredGaps.length),
      status: "needs_input",
      publishable: false,
      requiredInputCount: requiredGaps.length,
      optionalInputCount: optionalGaps.length,
      requiredGapIds: requiredGaps.map((gap) => gap.id),
      optionalGapIds: optionalGaps.map((gap) => gap.id),
      autoResolvedCount,
      nextStep: {
        type: "ask_user",
        gapId: next.id,
        label: next.label,
        question: next.question,
        sections: next.sections,
      },
    };
  }

  if (!publishable) {
    return {
      score: publishScore(readiness, briefGaps, 0),
      status: "needs_review",
      publishable: false,
      requiredInputCount: 0,
      optionalInputCount: optionalGaps.length,
      requiredGapIds: [],
      optionalGapIds: optionalGaps.map((gap) => gap.id),
      autoResolvedCount,
      nextStep: {
        type: "review",
        label: "revizie finală",
        question: null,
        sections: reviewSections(readiness),
      },
    };
  }

  return {
    score: 100,
    status: "ready",
    publishable: true,
    requiredInputCount: 0,
    optionalInputCount: optionalGaps.length,
    requiredGapIds: [],
    optionalGapIds: optionalGaps.map((gap) => gap.id),
    autoResolvedCount,
    nextStep: {
      type: "ready",
      label: "gata de publicare",
      question: null,
      sections: [],
    },
  };
}
