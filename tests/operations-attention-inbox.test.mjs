import test from "node:test";
import assert from "node:assert/strict";
import { buildAttentionInbox } from "../lib/operations/attention-inbox.ts";

const base = {
  rule: "operation_due_soon",
  module: "tasks",
  title: "Lucrare",
  meta: "meta",
  actionLabel: "Deschide",
  open: { recordId: "op-1" },
};

const signal = (overrides = {}) => ({
  ...base,
  key: "signal-1",
  level: "attention",
  sortAt: "2026-10-17T12:00:00.000Z",
  ...overrides,
});

test("projects active business signals into Acum / Azi / Atenție", () => {
  const inbox = buildAttentionInbox({
    signals: [
      signal({ key: "urgent", level: "urgent", sortAt: "2026-10-18T07:00:00.000Z" }),
      signal({ key: "today", level: "upcoming", sortAt: "2026-10-17T20:00:00.000Z" }),
      signal({ key: "later", level: "attention", sortAt: "2026-10-19T08:00:00.000Z" }),
    ],
    now: new Date("2026-10-17T14:00:00.000Z"),
    timeZone: "Europe/Bucharest",
  });

  assert.deepEqual(inbox.now.map((item) => item.signal.key), ["urgent"]);
  assert.deepEqual(inbox.today.map((item) => item.signal.key), ["today"]);
  assert.deepEqual(inbox.attention.map((item) => item.signal.key), ["later"]);
});

test("resolved presentation requires external evidence and never overrides an active signal", () => {
  const resolved = signal({ key: "resolved", sortAt: "2026-10-16T08:00:00.000Z" });
  const stillActive = signal({ key: "active" });
  const inbox = buildAttentionInbox({
    signals: [stillActive],
    now: new Date("2026-10-17T14:00:00.000Z"),
    timeZone: "Europe/Bucharest",
    resolvedEvidence: [
      { signal: resolved, resolvedAt: "2026-10-17T10:00:00.000Z", evidenceId: "audit-1" },
      { signal: stillActive, resolvedAt: "2026-10-17T11:00:00.000Z", evidenceId: "audit-2" },
      { signal: signal({ key: "invalid" }), resolvedAt: "2026-10-17T12:00:00.000Z", evidenceId: "" },
    ],
  });

  assert.deepEqual(inbox.resolved.map((item) => item.signal.key), ["resolved"]);
  assert.equal(inbox.resolved[0].evidenceId, "audit-1");
});

test("Romanian local day boundaries drive Azi instead of UTC date", () => {
  const inbox = buildAttentionInbox({
    signals: [signal({ key: "bucharest-today", level: "upcoming", sortAt: "2026-10-16T22:30:00.000Z" })],
    now: new Date("2026-10-17T00:30:00.000Z"),
    timeZone: "Europe/Bucharest",
  });
  assert.deepEqual(inbox.today.map((item) => item.signal.key), ["bucharest-today"]);
});
