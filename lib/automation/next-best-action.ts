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
  client_recovery_needed: 12,
  client_retention_follow_up: 13,
  lead_follow_up: 14,
  accepted_estimate_needs_schedule: 15,
  operation_due_soon: 16,
  operation_unplanned: 17,
  client_feedback_waiting: 18,
  client_feedback_due: 19,
  client_reactivation: 20,
  client_review_waiting: 21,
  client_review_opportunity: 22,
  client_referral_waiting: 23,
  client_referral_opportunity: 24,
  client_upsell_due: 25,
  client_upsell_opportunity: 26,
  appointment_upcoming: 27,
};

function ruleOrder(rule?: string) {
  return rule ? (RULE_ORDER[rule] ?? 50) : 50;
}

const CLIENT_CONTEXT_RULES = new Set([
  "lead_follow_up",
  "client_retention_follow_up",
  "client_reactivation",
  "client_feedback_due",
  "client_feedback_waiting",
  "client_recovery_needed",
  "client_review_opportunity",
  "client_review_waiting",
  "client_referral_opportunity",
  "client_referral_waiting",
  "client_upsell_opportunity",
  "client_upsell_due",
]);

function contextKey(item: NextBestActionCandidate) {
  if (item.clientId && CLIENT_CONTEXT_RULES.has(item.rule ?? "")) {
    return "client:" + item.clientId;
  }
  if (item.taskId) return "task:" + item.taskId;
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
