import type { AutomationSignal } from "@/lib/automation/business-signals";

export type AttentionInboxBucket = "now" | "today" | "attention" | "resolved";

export type ResolvedAttentionEvidence = {
  signal: AutomationSignal;
  resolvedAt: string;
  evidenceId: string;
};

export type AttentionInboxItem = {
  signal: AutomationSignal;
  bucket: AttentionInboxBucket;
  resolvedAt?: string;
  evidenceId?: string;
};

export type AttentionInbox = {
  now: AttentionInboxItem[];
  today: AttentionInboxItem[];
  attention: AttentionInboxItem[];
  resolved: AttentionInboxItem[];
};

function localDateKey(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function activeBucket(signal: AutomationSignal, now: Date, timeZone: string): Exclude<AttentionInboxBucket, "resolved"> {
  if (signal.level === "urgent") return "now";
  if (localDateKey(signal.sortAt, timeZone) === localDateKey(now.toISOString(), timeZone)) return "today";
  return "attention";
}

function byOperationalTime(a: AttentionInboxItem, b: AttentionInboxItem) {
  return a.signal.sortAt.localeCompare(b.signal.sortAt) || a.signal.key.localeCompare(b.signal.key);
}

function byResolvedTimeDesc(a: AttentionInboxItem, b: AttentionInboxItem) {
  return (b.resolvedAt ?? "").localeCompare(a.resolvedAt ?? "") || a.signal.key.localeCompare(b.signal.key);
}

/**
 * Pure presentation read model for ORBYVEN attention.
 *
 * It deliberately does not persist notification/event state. Active items are projected
 * from the existing business-signal engine, while resolved items must come from an
 * external immutable audit/activity evidence source.
 */
export function buildAttentionInbox(input: {
  signals: AutomationSignal[];
  now: Date;
  timeZone: string;
  resolvedEvidence?: ResolvedAttentionEvidence[];
}): AttentionInbox {
  const result: AttentionInbox = {
    now: [],
    today: [],
    attention: [],
    resolved: [],
  };

  const activeKeys = new Set(input.signals.map((signal) => signal.key));

  for (const signal of input.signals) {
    const bucket = activeBucket(signal, input.now, input.timeZone);
    result[bucket].push({ signal, bucket });
  }

  for (const evidence of input.resolvedEvidence ?? []) {
    if (activeKeys.has(evidence.signal.key)) continue;
    if (!evidence.evidenceId.trim()) continue;
    result.resolved.push({
      signal: evidence.signal,
      bucket: "resolved",
      resolvedAt: evidence.resolvedAt,
      evidenceId: evidence.evidenceId,
    });
  }

  result.now.sort(byOperationalTime);
  result.today.sort(byOperationalTime);
  result.attention.sort(byOperationalTime);
  result.resolved.sort(byResolvedTimeDesc);

  return result;
}
