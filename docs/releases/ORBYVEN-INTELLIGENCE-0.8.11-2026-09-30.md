# ORBYVEN Intelligence 0.8.11 — Operational Intelligence

Date: 2026-09-30
Base: ORBYVEN Alpha 0.9 + Intelligence 0.8.10 Plan Recovery

## Purpose

0.8.11 moves ORBYVEN from separate dashboard rules toward one deterministic cross-module attention engine.

The same operational signal logic now feeds:
- Workspace Activity Center;
- Overview attention cards;
- ORBYVEN Intelligence Operations answers.

This prevents the UI and AI from giving contradictory business priorities.

## New shared signals

### Blocked operation
A work/order/task in `blocked` state becomes an urgent signal with a direct deep-link to the record.

If its due date is already exceeded, the signal states that explicitly.

### Estimate follow-up
A sent estimate with no status change for at least three days receives a follow-up signal when it is not already covered by an expiry warning.

This does not send any communication automatically.

### Calendar conflict
ORBYVEN detects overlapping future calendar events when:
- both events have an end time;
- both have the same explicit assignee;
- neither is cancelled;
- the overlap is within the bounded seven-day horizon.

ORBYVEN does not infer a conflict when the assignee is missing or different.

## Existing signals retained

The shared engine continues to support:
- overdue operations;
- due-soon operations;
- work/order without a term or schedule;
- accepted estimate that needs scheduling;
- estimate expiry;
- upcoming appointment.

Activity Center also retains:
- lead follow-ups;
- receivables;
- inventory shortages;
- purchase-order delivery signals.

## Intelligence behavior

Operations answers now use the shared signal engine.

ORBYVEN can:
- state the highest-priority detected signal;
- count blocked/overdue work, stale estimates and calendar conflicts;
- deep-link directly to the affected record;
- fall back to lead follow-up or Tasks when no cross-module signal exists.

No signal executes a business action automatically.

## Overview behavior

Overview no longer maintains separate local rules for blocked operations and stale estimates.

It consumes the shared engine for:
- overdue operations;
- blocked operations;
- estimate follow-up;
- calendar conflict.

Explicit urgent-priority tasks remain a separate Overview priority because urgency is a user-set business priority, not an inferred automation rule.

## Safety

0.8.11 is read/attention intelligence only.

It does not:
- send follow-ups;
- reschedule calendar events;
- unblock tasks;
- change estimate state;
- create invoices or payments;
- perform autonomous multi-step actions.

Mutating actions remain behind the existing explicit confirmation / Plan Mode contracts.

## Acceptance

Before release:
- lint;
- TypeScript;
- automation signal tests;
- Intelligence regression tests;
- security/legal/billing/inventory/device regressions;
- production build;
- Architecture Guard;
- Vercel production deploy.
