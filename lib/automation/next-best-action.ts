export type NextBestActionLevel = "urgent" | "attention" | "upcoming";

export type NextBestActionCandidate = {
  key: string;
  level: NextBestActionLevel;
  sortAt: string;
  rule?: string;
  module?: string;
  recordId?: string;
  taskId?: string;
  clientId?: string;
};

const LEVEL_ORDER: Record<NextBestActionLevel, number> = {
  urgent: 0,
  attention: 1,
  upcoming: 2,
};

// Explicit business precedence. No learned score and no hidden weighting.
const RULE_ORDER: Record<string, number> = {
  operation_blocked: 0,
  operation_overdue: 1,
  calendar_conflict: 2,
  appointment_needs_resources: 3,
  operation_assignee_inactive: 4,
  operation_unassigned: 5,
  execution_without_accepted_estimate: 6,
  invoice_receivable: 7,
  inventory_shortage: 8,
  purchase_order_due: 9,
  estimate_expiring: 10,
  estimate_follow_up: 11,
  client_retention_follow_up: 12,
  lead_follow_up: 13,
  client_reactivation: 14,
  accepted_estimate_needs_schedule: 15,
  operation_due_soon: 16,
  operation_unplanned: 17,
  appointment_upcoming: 18,
  post_service_recovery: 19,
  post_service_feedback: 20,
  post_service_feedback_followup: 21,
  post_service_review: 22,
  post_service_review_followup: 23,
  post_service_referral: 24,
  post_service_referral_followup: 25,
  post_service_upsell: 26,
};

function ruleOrder(rule?: string) {
  return rule ? (RULE_ORDER[rule] ?? 50) : 50;
}

function contextKey(item: NextBestActionCandidate) {
  if (item.taskId) return "task:" + item.taskId;
  if (
    item.clientId &&
    ["lead_follow_up", "client_retention_follow_up", "client_reactivation"].includes(item.rule ?? "")
  ) {
    return "client:" + item.clientId;
  }
  if (item.module && item.recordId) return item.module + ":" + item.recordId;
  return item.key;
}

export function compareNextBestActions(
  left: NextBestActionCandidate,
  right: NextBestActionCandidate
) {
  const byLevel = LEVEL_ORDER[left.level] - LEVEL_ORDER[right.level];
  if (byLevel) return byLevel;

  const byRule = ruleOrder(left.rule) - ruleOrder(right.rule);
  if (byRule) return byRule;

  const byTime = left.sortAt.localeCompare(right.sortAt);
  if (byTime) return byTime;

  return left.key.localeCompare(right.key);
}

export function rankNextBestActions<T extends NextBestActionCandidate>(
  items: T[],
  options: { dedupeContext?: boolean; limit?: number } = {}
): T[] {
  const ranked = [...items].sort(compareNextBestActions);
  const dedupeContext = options.dedupeContext ?? true;
  const limit = options.limit ?? ranked.length;

  if (!dedupeContext) return ranked.slice(0, limit);

  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of ranked) {
    const key = contextKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}
