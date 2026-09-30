import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  normalizeResourceIds,
  schedulerErrorMessage,
} from "../lib/modules/resource-core.ts";
import { buildBusinessAutomationSignals } from "../lib/automation/business-signals.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("resource ids are deduplicated and bounded", () => {
  assert.deepEqual(normalizeResourceIds([" a ", "b", "a", ""]), ["a", "b"]);
  assert.throws(() => normalizeResourceIds(Array.from({ length: 21 }, (_, index) => String(index))));
});

test("database scheduler errors become useful Romanian messages", () => {
  assert.match(
    schedulerErrorMessage(new Error("resource_schedule_conflict")),
    /deja programată/
  );
  assert.match(
    schedulerErrorMessage(new Error("resource_unavailable")),
    /indisponibilă/
  );
});

test("upcoming work without resources becomes an attention signal", () => {
  const now = new Date("2026-09-30T06:00:00.000Z");
  const signals = buildBusinessAutomationSignals({
    operations: [{
      id: "work-1",
      title: "Montaj centrală",
      kind: "work",
      status: "planned",
      priority: "normal",
      clientId: "client-1",
      scheduledAt: null,
      dueAt: null,
      createdAt: "2026-09-30T05:00:00.000Z",
    }],
    estimates: [],
    events: [{
      id: "event-1",
      title: "Montaj centrală",
      status: "scheduled",
      startAt: "2026-09-30T12:00:00.000Z",
      clientId: "client-1",
      taskId: "work-1",
      resourceCount: 0,
    }],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
  });

  const signal = signals.find((item) => item.rule === "appointment_needs_resources");
  assert.ok(signal);
  assert.equal(signal.level, "attention");
  assert.equal(signal.module, "calendar");
  assert.equal(signal.actionLabel, "Alocă");
});

test("resource-ready work keeps the normal upcoming signal", () => {
  const now = new Date("2026-09-30T06:00:00.000Z");
  const signals = buildBusinessAutomationSignals({
    operations: [{
      id: "work-1",
      title: "Montaj centrală",
      kind: "work",
      status: "planned",
      priority: "normal",
      clientId: null,
      scheduledAt: null,
      dueAt: null,
      createdAt: "2026-09-30T05:00:00.000Z",
    }],
    estimates: [],
    events: [{
      id: "event-1",
      title: "Montaj centrală",
      status: "scheduled",
      startAt: "2026-09-30T12:00:00.000Z",
      clientId: null,
      taskId: "work-1",
      resourceCount: 2,
    }],
    now,
    locale: "ro-RO",
    timeZone: "Europe/Bucharest",
  });

  assert.equal(
    signals.some((item) => item.rule === "appointment_needs_resources"),
    false
  );
  assert.equal(
    signals.some((item) => item.rule === "appointment_upcoming"),
    true
  );
});

test("calendar and team use the same shared resource engine", () => {
  const calendar = read("components/modules/CalendarModule.tsx");
  const team = read("components/modules/TeamModule.tsx");
  const service = read("lib/modules/resources.ts");

  assert.match(calendar, /setCalendarEventResources/);
  assert.match(calendar, /RESOURCE_TYPE_LABELS/);
  assert.match(team, /createOperationalResource/);
  assert.match(team, /Resurse operaționale/);
  assert.match(service, /calendar_event_resources/);
  assert.match(service, /ops_resources/);
});


test("production scheduler migration preserves RLS and conflict guards", () => {
  const migration = read("supabase/migrations/20260930080226_alpha091_scheduler_resources_core.sql");
  assert.match(migration, /create table if not exists public\.ops_resources/i);
  assert.match(migration, /create table if not exists public\.calendar_event_resources/i);
  assert.match(migration, /create table if not exists public\.ops_resource_unavailability/i);
  assert.match(migration, /pg_advisory_xact_lock/i);
  assert.match(migration, /resource_schedule_conflict/i);
  assert.match(migration, /resource_unavailable/i);
  assert.match(migration, /security invoker/i);
  assert.match(migration, /alter table public\.ops_resources enable row level security/i);
  assert.match(migration, /calendar_event_resources_insert_operator/i);
  assert.match(migration, /people_team_members_resource_sync/i);
});
