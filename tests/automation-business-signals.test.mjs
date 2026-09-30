import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
  assert.equal(
    signals.some((item) => item.rule === "operation_unplanned"),
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


test("blocked operations become urgent decision signals instead of generic overdue noise", () => {
  const signals = buildBusinessAutomationSignals({
    operations: [operation({ status: "blocked", dueAt: "2026-09-29T10:00:00.000Z" })],
    estimates: [],
    events: [],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
  });

  const blocked = signals.find((item) => item.rule === "operation_blocked");
  assert.ok(blocked);
  assert.equal(blocked.level, "urgent");
  assert.equal(blocked.actionLabel, "Deblochează");
  assert.match(blocked.meta, /termen depășit/i);
  assert.equal(signals.some((item) => item.rule === "operation_overdue"), false);
});

test("sent estimate older than three days gets a follow-up signal when expiry is not already urgent", () => {
  const signals = buildBusinessAutomationSignals({
    operations: [],
    estimates: [estimate({
      status: "sent",
      taskId: null,
      validUntil: "2026-10-10",
      updatedAt: "2026-09-26T05:00:00.000Z",
    })],
    events: [],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
  });

  const signal = signals.find((item) => item.rule === "estimate_follow_up");
  assert.ok(signal);
  assert.equal(signal.module, "estimates");
  assert.equal(signal.actionLabel, "Fă follow-up");
  assert.match(signal.meta, /4 zile/i);
});

test("overlapping events for the same named assignee produce one actionable calendar conflict", () => {
  const signals = buildBusinessAutomationSignals({
    operations: [],
    estimates: [],
    events: [
      {
        id: "event-a",
        title: "Revizie A",
        status: "scheduled",
        startAt: "2026-09-30T08:00:00.000Z",
        endAt: "2026-09-30T10:00:00.000Z",
        assignee: "Andrei",
        clientId: "client-a",
        taskId: "task-a",
      },
      {
        id: "event-b",
        title: "Revizie B",
        status: "scheduled",
        startAt: "2026-09-30T09:00:00.000Z",
        endAt: "2026-09-30T11:00:00.000Z",
        assignee: "andrei",
        clientId: "client-b",
        taskId: "task-b",
      },
    ],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
  });

  const conflicts = signals.filter((item) => item.rule === "calendar_conflict");
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].level, "urgent");
  assert.equal(conflicts[0].module, "calendar");
  assert.equal(conflicts[0].open.recordId, "event-a");
  assert.match(conflicts[0].title, /Andrei/);
});

test("calendar overlap is not inferred when responsibility is missing or different", () => {
  const base = {
    status: "scheduled",
    startAt: "2026-10-01T08:00:00.000Z",
    endAt: "2026-10-01T10:00:00.000Z",
    clientId: null,
    taskId: null,
  };
  const signals = buildBusinessAutomationSignals({
    operations: [],
    estimates: [],
    events: [
      { id: "event-a", title: "A", assignee: "", ...base },
      { id: "event-b", title: "B", assignee: "Maria", ...base },
      { id: "event-c", title: "C", assignee: "Andrei", ...base },
    ],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
  });

  assert.equal(signals.some((item) => item.rule === "calendar_conflict"), false);
});

test("Overview and ORBYVEN Intelligence both consume the shared operational signal engine", () => {
  const overview = readFileSync(join(process.cwd(), "components/modules/OverviewModule.tsx"), "utf8");
  const intelligence = readFileSync(join(process.cwd(), "lib/ai/intelligence-server.ts"), "utf8");

  assert.match(overview, /buildBusinessAutomationSignals/);
  assert.match(overview, /operation_blocked/);
  assert.match(overview, /estimate_follow_up/);
  assert.match(overview, /calendar_conflict/);

  assert.match(intelligence, /buildBusinessAutomationSignals/);
  assert.match(intelligence, /Prioritatea principală/);
  assert.match(intelligence, /Conflicte calendar/);
  assert.match(intelligence, /recordId: signal\.open\.recordId/);
});
