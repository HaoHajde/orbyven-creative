import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBusinessAutomationSignals } from "../lib/automation/business-signals.ts";
import { rankNextBestActions } from "../lib/automation/next-best-action.ts";
import { evaluateWorkReadiness } from "../lib/automation/work-readiness.ts";

const now = new Date("2026-09-30T06:00:00.000Z");

function operation(overrides = {}) {
  return {
    id: "op-1",
    title: "Buchet aniversar",
    kind: "order",
    status: "planned",
    priority: "normal",
    assignee: null,
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


test("near execution without an assignee becomes a Work Readiness ownership signal", () => {
  const signals = buildBusinessAutomationSignals({
    operations: [operation({
      kind: "work",
      scheduledAt: "2026-10-02T08:00:00.000Z",
      createdAt: "2026-09-30T05:00:00.000Z",
    })],
    estimates: [],
    events: [],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
  });

  const signal = signals.find((item) => item.rule === "operation_unassigned");
  assert.ok(signal);
  assert.equal(signal.module, "tasks");
  assert.equal(signal.actionLabel, "Alocă responsabil");
  assert.equal(signal.level, "attention");
});

test("an explicitly inactive Team member is signaled without treating unknown names as inactive", () => {
  const activeWindow = operation({
    kind: "work",
    status: "in_progress",
    assignee: "Andrei Popescu",
    createdAt: "2026-09-30T05:00:00.000Z",
  });
  const inactiveSignals = buildBusinessAutomationSignals({
    operations: [activeWindow],
    estimates: [],
    events: [],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
    inactiveAssigneeNames: ["andrei popescu"],
  });
  assert.ok(inactiveSignals.some((item) => item.rule === "operation_assignee_inactive"));

  const unknownSignals = buildBusinessAutomationSignals({
    operations: [activeWindow],
    estimates: [],
    events: [],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
    inactiveAssigneeNames: ["Alt Membru"],
  });
  assert.equal(
    unknownSignals.some((item) => item.rule === "operation_assignee_inactive"),
    false
  );
});

test("execution with a sent but unaccepted linked estimate creates a commercial readiness risk", () => {
  const signals = buildBusinessAutomationSignals({
    operations: [operation({
      kind: "work",
      status: "in_progress",
      assignee: "Andrei",
      createdAt: "2026-09-30T05:00:00.000Z",
    })],
    estimates: [estimate({ status: "sent" })],
    events: [],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
  });

  const signal = signals.find((item) => item.rule === "execution_without_accepted_estimate");
  assert.ok(signal);
  assert.equal(signal.level, "attention");
  assert.match(signal.title, /ofertă neacceptată/i);
});

test("accepted estimate or no commercial workflow avoids false execution-risk alerts", () => {
  const work = operation({
    kind: "work",
    status: "in_progress",
    assignee: "Andrei",
    createdAt: "2026-09-30T05:00:00.000Z",
  });
  for (const estimates of [[], [estimate({ status: "accepted" })]]) {
    const signals = buildBusinessAutomationSignals({
      operations: [work],
      estimates,
      events: [],
      now,
      locale: "ro-RO",
      timeZone: "Europe/Bucharest",
    });
    assert.equal(
      signals.some((item) => item.rule === "execution_without_accepted_estimate"),
      false
    );
  }
});

test("Work Readiness treats empty Documents and Costs as visibility, not mandatory blockers", () => {
  const readiness = evaluateWorkReadiness({
    operation: {
      kind: "work",
      status: "planned",
      assignee: "Andrei",
      scheduledAt: "2026-10-02T08:00:00.000Z",
      dueAt: null,
      progress: 0,
    },
    context: {
      estimatesCount: 0,
      sentEstimatesCount: 0,
      acceptedEstimatesCount: 0,
      documentsCount: 0,
      upcomingEventsCount: 1,
      expensesCount: 0,
      expensesCents: 0,
      inventoryMovementsCount: 0,
      inventoryConsumedCents: 0,
    },
    checklist: { total: 0, done: 0 },
    inactiveAssigneeNames: [],
    enabled: {
      estimates: true,
      documents: true,
      calendar: true,
      expenses: true,
      inventory: true,
      team: true,
    },
    canAccessFinances: true,
    now,
  });

  assert.equal(readiness.level, "ready");
  assert.equal(readiness.attentionCount, 0);
  assert.equal(readiness.checks.find((item) => item.key === "documents")?.state, "info");
  assert.equal(readiness.checks.find((item) => item.key === "costs")?.state, "info");
});

test("Work Readiness flags meaningful ownership and commercial issues inside the dossier", () => {
  const readiness = evaluateWorkReadiness({
    operation: {
      kind: "work",
      status: "in_progress",
      assignee: null,
      scheduledAt: "2026-09-30T08:00:00.000Z",
      dueAt: "2026-10-01T08:00:00.000Z",
      progress: 35,
    },
    context: {
      estimatesCount: 1,
      sentEstimatesCount: 1,
      acceptedEstimatesCount: 0,
      documentsCount: 1,
      upcomingEventsCount: 1,
      expensesCount: 1,
      expensesCents: 15000,
      inventoryMovementsCount: 0,
      inventoryConsumedCents: 0,
    },
    checklist: { total: 3, done: 1 },
    inactiveAssigneeNames: [],
    enabled: {
      estimates: true,
      documents: true,
      calendar: true,
      expenses: true,
      inventory: true,
      team: true,
    },
    canAccessFinances: true,
    now,
  });

  assert.equal(readiness.level, "attention");
  assert.ok(readiness.attentionCount >= 2);
  assert.equal(readiness.checks.find((item) => item.key === "ownership")?.state, "attention");
  assert.equal(readiness.checks.find((item) => item.key === "commercial")?.state, "attention");
});

test("Work Readiness wiring is shared by dossier, Activity, Overview and Operations AI", () => {
  const dossier = readFileSync(join(process.cwd(), "components/modules/tasks/WorkFileSummary.tsx"), "utf8");
  const activity = readFileSync(join(process.cwd(), "lib/modules/activity.ts"), "utf8");
  const overview = readFileSync(join(process.cwd(), "components/modules/OverviewModule.tsx"), "utf8");
  const intelligence = readFileSync(join(process.cwd(), "lib/ai/intelligence-server.ts"), "utf8");

  assert.match(dossier, /evaluateWorkReadiness/);
  assert.match(dossier, /ORBYVEN · WORK READINESS/);
  assert.match(activity, /inactiveAssigneeNames/);
  assert.match(overview, /operation_unassigned/);
  assert.match(overview, /execution_without_accepted_estimate/);
  assert.match(intelligence, /operation_assignee_inactive/);
  assert.match(intelligence, /Risc comercial/);
});


test("Next Best Action uses explicit business precedence instead of opaque scoring", () => {
  const ranked = rankNextBestActions([
    {
      key: "follow",
      level: "urgent",
      sortAt: "2026-09-29T06:00:00.000Z",
      rule: "lead_follow_up",
      module: "leads",
      recordId: "lead-1",
    },
    {
      key: "blocked",
      level: "urgent",
      sortAt: "2026-09-30T06:00:00.000Z",
      rule: "operation_blocked",
      module: "tasks",
      recordId: "task-1",
      taskId: "task-1",
    },
  ]);
  assert.equal(ranked[0].key, "blocked");
});

test("Next Best Action collapses duplicate attention for the same operation context", () => {
  const ranked = rankNextBestActions([
    {
      key: "owner",
      level: "urgent",
      sortAt: "2026-09-30T08:00:00.000Z",
      rule: "operation_unassigned",
      module: "tasks",
      recordId: "task-1",
      taskId: "task-1",
    },
    {
      key: "commercial",
      level: "urgent",
      sortAt: "2026-09-30T07:00:00.000Z",
      rule: "execution_without_accepted_estimate",
      module: "tasks",
      recordId: "task-1",
      taskId: "task-1",
    },
  ]);
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].key, "owner");
});

test("Next Best Action remains stable for equal business context", () => {
  const ranked = rankNextBestActions([
    { key: "b", level: "attention", sortAt: "2026-09-30T08:00:00.000Z", rule: "estimate_follow_up" },
    { key: "a", level: "attention", sortAt: "2026-09-30T08:00:00.000Z", rule: "estimate_follow_up" },
  ], { dedupeContext: false });
  assert.deepEqual(ranked.map((item) => item.key), ["a", "b"]);
});

test("Operations AI, Activity and Overview consume the shared Next Best Action engine", () => {
  const ai = readFileSync(join(process.cwd(), "lib/ai/intelligence-server.ts"), "utf8");
  const activity = readFileSync(join(process.cwd(), "lib/modules/activity.ts"), "utf8");
  const overview = readFileSync(join(process.cwd(), "components/modules/OverviewModule.tsx"), "utf8");
  assert.match(ai, /rankNextBestActions/);
  assert.match(activity, /rankNextBestActions/);
  assert.match(overview, /rankNextBestActions/);
});
