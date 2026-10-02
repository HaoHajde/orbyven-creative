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
  purchaseOrderId?: string;
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
  procurement_cost_missing: 8,
  inventory_shortage: 9,
  purchase_order_due: 10,
  procurement_evidence_missing: 11,
  procurement_cost_variance: 12,
  estimate_expiring: 13,
  estimate_follow_up: 14,
  client_retention_follow_up: 15,
  lead_follow_up: 16,
  client_reactivation: 17,
  accepted_estimate_needs_schedule: 18,
  operation_due_soon: 19,
  operation_unplanned: 20,
  appointment_upcoming: 21,
  post_service_recovery: 22,
  post_service_feedback: 23,
  post_service_feedback_followup: 24,
  post_service_review: 25,
  post_service_review_followup: 26,
  post_service_referral: 27,
  post_service_referral_followup: 28,
  post_service_upsell: 29,
};

function ruleOrder(rule?: string) {
  return rule ? (RULE_ORDER[rule] ?? 50) : 50;
}

function contextKey(item: NextBestActionCandidate) {
  if (item.purchaseOrderId) return "purchase-order:" + item.purchaseOrderId;
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
