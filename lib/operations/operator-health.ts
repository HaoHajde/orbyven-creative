export type OperatorHealthState =
  | "healthy"
  | "attention"
  | "degraded"
  | "unknown";

export type OperatorHealthCategory =
  | "service"
  | "job"
  | "integration"
  | "data";

export type OperatorHealthScope =
  | { kind: "platform" }
  | { kind: "organization"; organizationId: string };

export type OperatorHealthCheckInput = {
  key: string;
  label: string;
  category: OperatorHealthCategory;
  state: OperatorHealthState;
  checkedAt: string | null;
  scope: OperatorHealthScope;
  latencyMs?: number | null;
  consecutiveFailures?: number | null;
};

export type OperatorHealthItem = {
  key: string;
  label: string;
  category: OperatorHealthCategory;
  state: OperatorHealthState;
  checkedAt: string | null;
  stale: boolean;
  latencyMs: number | null;
  consecutiveFailures: number;
};

export type OperatorHealthSnapshot = {
  state: OperatorHealthState;
  generatedAt: string;
  organizationId: string | null;
  counts: Record<OperatorHealthState, number>;
  items: OperatorHealthItem[];
};

const DEFAULT_STALE_AFTER_MS = 15 * 60 * 1000;

const STATE_ORDER: Record<OperatorHealthState, number> = {
  degraded: 0,
  attention: 1,
  unknown: 2,
  healthy: 3,
};

function normalizedNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function normalizeFailures(value: number | null | undefined) {
  const normalized = normalizedNumber(value);
  return normalized === null ? 0 : Math.floor(normalized);
}

function isVisibleForOrganization(
  scope: OperatorHealthScope,
  organizationId: string | null
) {
  if (scope.kind === "platform") return true;
  return Boolean(organizationId && scope.organizationId === organizationId);
}

function staleState(
  checkedAt: string | null,
  nowMs: number,
  staleAfterMs: number
) {
  if (!checkedAt) return true;
  const checkedMs = Date.parse(checkedAt);
  if (!Number.isFinite(checkedMs)) return true;
  if (checkedMs > nowMs + 60_000) return true;
  return nowMs - checkedMs > staleAfterMs;
}

export function buildOperatorHealthSnapshot(input: {
  checks: OperatorHealthCheckInput[];
  now: Date;
  organizationId?: string | null;
  staleAfterMs?: number;
}): OperatorHealthSnapshot {
  const organizationId = input.organizationId?.trim() || null;
  const staleAfterMs =
    typeof input.staleAfterMs === "number" &&
    Number.isFinite(input.staleAfterMs) &&
    input.staleAfterMs > 0
      ? input.staleAfterMs
      : DEFAULT_STALE_AFTER_MS;
  const nowMs = input.now.getTime();

  const items = input.checks
    .filter((check) => isVisibleForOrganization(check.scope, organizationId))
    .map((check): OperatorHealthItem => {
      const stale = staleState(check.checkedAt, nowMs, staleAfterMs);
      return {
        key: check.key,
        label: check.label,
        category: check.category,
        state: stale ? "unknown" : check.state,
        checkedAt: check.checkedAt,
        stale,
        latencyMs: normalizedNumber(check.latencyMs),
        consecutiveFailures: normalizeFailures(check.consecutiveFailures),
      };
    })
    .sort((left, right) => {
      const severity = STATE_ORDER[left.state] - STATE_ORDER[right.state];
      if (severity !== 0) return severity;
      return left.label.localeCompare(right.label, "ro-RO");
    });

  const counts: Record<OperatorHealthState, number> = {
    healthy: 0,
    attention: 0,
    degraded: 0,
    unknown: 0,
  };
  for (const item of items) counts[item.state] += 1;

  let state: OperatorHealthState = "unknown";
  if (counts.degraded > 0) state = "degraded";
  else if (counts.attention > 0 || counts.unknown > 0) state = "attention";
  else if (counts.healthy > 0) state = "healthy";

  return {
    state,
    generatedAt: input.now.toISOString(),
    organizationId,
    counts,
    items,
  };
}
