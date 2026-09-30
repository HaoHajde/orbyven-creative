import test from "node:test";
import assert from "node:assert/strict";
import { buildBusinessAutomationSignals } from "../lib/automation/business-signals.ts";

const now = new Date("2026-09-30T06:00:00.000Z");

function operation(overrides = {}) {
  return {
    id: "op-1",
    title: "Buchet aniversar",
    kind: "order",
    status: "planned",
    priority: "normal",
    clientId: "client-1",
    scheduledAt: null,
    dueAt: null,
    createdAt: "2026-09-28T06:00:00.000Z",
    ...overrides,
  };
}

function estimate(overrides = {}) {
  return {
    id: "est-1",
    reference: "OF-100",
    title: "Ofertă eveniment",
    status: "accepted",
    validUntil: null,
    clientId: "client-1",
    taskId: "op-1",
    updatedAt: "2026-09-30T05:00:00.000Z",
    ...overrides,
  };
}

test("accepted estimate opens a prefilled calendar action for an unscheduled order", () => {
  const signals = buildBusinessAutomationSignals({
    operations: [operation()],
    estimates: [estimate()],
    events: [],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
  });

  const signal = signals.find((item) => item.rule === "accepted_estimate_needs_schedule");
  assert.ok(signal);
  assert.equal(signal.module, "calendar");
  assert.equal(signal.actionLabel, "Programează");
  assert.equal(signal.open.create, true);
  assert.equal(signal.open.taskId, "op-1");
  assert.equal(signal.open.clientId, "client-1");
});

test("a future calendar event suppresses the accepted-offer scheduling signal", () => {
  const signals = buildBusinessAutomationSignals({
    operations: [operation()],
    estimates: [estimate()],
    events: [{
      id: "event-1",
      title: "Livrare",
      status: "scheduled",
      startAt: "2026-10-02T08:00:00.000Z",
      clientId: "client-1",
      taskId: "op-1",
    }],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
  });

  assert.equal(
    signals.some((item) => item.rule === "accepted_estimate_needs_schedule"),
    false
  );
});

test("stale unscheduled work or order becomes an actionable automation signal", () => {
  const signals = buildBusinessAutomationSignals({
    operations: [operation()],
    estimates: [],
    events: [],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
  });

  const signal = signals.find((item) => item.rule === "operation_unplanned");
  assert.ok(signal);
  assert.equal(signal.module, "tasks");
  assert.equal(signal.actionLabel, "Rezolvă");
  assert.match(signal.title, /Comandă fără termen/);
});

test("overdue orders are urgent and keep the correct operational label", () => {
  const signals = buildBusinessAutomationSignals({
    operations: [operation({ dueAt: "2026-09-29T10:00:00.000Z" })],
    estimates: [],
    events: [],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
  });

  const signal = signals.find((item) => item.rule === "operation_overdue");
  assert.ok(signal);
  assert.equal(signal.level, "urgent");
  assert.match(signal.title, /Comandă întârziată/);
});

test("sent estimates retain expiry signals alongside automation rules", () => {
  const signals = buildBusinessAutomationSignals({
    operations: [],
    estimates: [estimate({
      status: "sent",
      taskId: null,
      validUntil: "2026-10-01",
    })],
    events: [],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
  });

  const signal = signals.find((item) => item.rule === "estimate_expiring");
  assert.ok(signal);
  assert.equal(signal.module, "estimates");
});
