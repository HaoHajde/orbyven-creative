import type { EditableSite } from "@/lib/ai/site-editor";
import type { WebDesignStrategy } from "@/lib/ai/web-design-intent";
import {
  autonomouslyRefineWebDesign,
  type WebDesignAutonomousRefinementResult,
} from "@/lib/ai/web-design-autorefine";
import {
  applySpecificDesignDna,
  designDnaDistance,
  getAlternativeDesignDnaCandidates,
  type DesignDna,
} from "@/lib/ai/web-design-variation";

export type WebDesignCandidateSelectionReport = {
  evaluatedCandidates: number;
  selectedDna: string | null;
  selectedScore: number;
  selectedDistance: number;
  styleAffinity: number;
};

export type WebDesignCandidateSelectionResult = WebDesignAutonomousRefinementResult & {
  selection: WebDesignCandidateSelectionReport;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s&/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function styleAffinity(prompt: string, dna: DesignDna) {
  const value = normalize(prompt);
  const terms: Record<DesignDna["visualTone"], string[]> = {
    luxury: ["luxury", "premium", "elegant", "black gold", "negru auriu", "rafinat"],
    minimal: ["minimal", "minimalist", "clean", "simplu", "aerisit", "luminos"],
    bold: ["bold", "puternic", "contrast", "conversie", "impact"],
    technical: ["tehnic", "technical", "industrial", "precis", "ingineresc"],
    warm: ["cald", "warm", "uman", "friendly", "floral", "organic"],
    editorial: ["editorial", "magazine", "contrast", "tipografie", "story"],
  };

  const matches = terms[dna.visualTone].filter((term) => value.includes(term)).length;
  if (matches === 0) return 50;
  return Math.min(100, 70 + matches * 15);
}

function weightedScore(
  result: WebDesignAutonomousRefinementResult,
  current: EditableSite,
  prompt: string,
  dna: DesignDna
) {
  const distance = designDnaDistance(current, result.draft);
  const distanceScore = Math.min(100, Math.round((distance / 14) * 100));
  const affinity = styleAffinity(prompt, dna);

  const score =
    result.quality.score * 0.42 +
    result.readiness.score * 0.33 +
    distanceScore * 0.15 +
    affinity * 0.1;

  return {
    score: Math.round(score * 10) / 10,
    distance,
    affinity,
  };
}

export function selectBestWebDesignCandidate(
  draft: EditableSite,
  current: EditableSite,
  strategy: WebDesignStrategy,
  prompt: string
): WebDesignCandidateSelectionResult {
  if (strategy.mode !== "alternative") {
    const result = autonomouslyRefineWebDesign(draft, strategy);
    return {
      ...result,
      selection: {
        evaluatedCandidates: 1,
        selectedDna: null,
        selectedScore: Math.round(
          (result.quality.score * 0.56 + result.readiness.score * 0.44) * 10
        ) / 10,
        selectedDistance: designDnaDistance(current, result.draft),
        styleAffinity: 50,
      },
    };
  }

  const candidates = getAlternativeDesignDnaCandidates(current, prompt, 3);
  const evaluated = candidates.map((dna) => {
    const candidate = applySpecificDesignDna(draft, dna);
    const result = autonomouslyRefineWebDesign(candidate, strategy);
    const ranking = weightedScore(result, current, prompt, dna);
    return { dna, result, ranking };
  });

  evaluated.sort((left, right) => {
    if (right.ranking.score !== left.ranking.score) {
      return right.ranking.score - left.ranking.score;
    }
    if (right.result.quality.score !== left.result.quality.score) {
      return right.result.quality.score - left.result.quality.score;
    }
    if (right.result.readiness.score !== left.result.readiness.score) {
      return right.result.readiness.score - left.result.readiness.score;
    }
    if (right.ranking.distance !== left.ranking.distance) {
      return right.ranking.distance - left.ranking.distance;
    }
    return left.dna.id.localeCompare(right.dna.id);
  });

  const winner = evaluated[0];
  if (!winner) {
    const fallback = autonomouslyRefineWebDesign(draft, strategy);
    return {
      ...fallback,
      selection: {
        evaluatedCandidates: 1,
        selectedDna: null,
        selectedScore: Math.round(
          (fallback.quality.score * 0.56 + fallback.readiness.score * 0.44) * 10
        ) / 10,
        selectedDistance: designDnaDistance(current, fallback.draft),
        styleAffinity: 50,
      },
    };
  }

  return {
    ...winner.result,
    selection: {
      evaluatedCandidates: evaluated.length,
      selectedDna: winner.dna.id,
      selectedScore: winner.ranking.score,
      selectedDistance: winner.ranking.distance,
      styleAffinity: winner.ranking.affinity,
    },
  };
}
