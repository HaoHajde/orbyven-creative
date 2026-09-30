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
  operation_assignee_inactive: 3,
  operation_unassigned: 4,
  execution_without_accepted_estimate: 5,
  invoice_receivable: 6,
  inventory_shortage: 7,
  purchase_order_due: 8,
  estimate_expiring: 9,
  estimate_follow_up: 10,
  lead_follow_up: 11,
  accepted_estimate_needs_schedule: 12,
  operation_due_soon: 13,
  operation_unplanned: 14,
  appointment_upcoming: 15,
};

function ruleOrder(rule?: string) {
  return rule ? (RULE_ORDER[rule] ?? 50) : 50;
}

function contextKey(item: NextBestActionCandidate) {
  if (item.taskId) return "task:" + item.taskId;
  if (item.clientId && item.rule === "lead_follow_up") return "client:" + item.clientId;
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
