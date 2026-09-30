# ORBYVEN Intelligence 0.8.13 — Next Best Action

Date: 2026-09-30
Base: ORBYVEN Alpha 0.9 + Intelligence 0.8.12 Work Readiness

## Purpose

0.8.13 adds one deterministic prioritization layer over ORBYVEN operational signals so Overview, Activity Center and Operations AI agree on what should be handled first.

It does not invent a hidden AI score.

## Deterministic ordering

Priority is decided by:
1. signal severity: urgent → attention → upcoming;
2. explicit business-rule precedence;
3. earliest relevant business time;
4. stable key ordering.

Examples of higher-precedence rules:
- blocked operation;
- overdue operation;
- immediate calendar conflict;
- inactive or missing owner;
- execution without accepted estimate;
- overdue receivable / procurement blockers;
- estimate follow-up;
- upcoming appointments.

The rule order is explicit in code and testable.

## Context deduplication

When multiple signals describe the same operational context, ORBYVEN can keep the highest-priority next action instead of showing several competing cards for the same work/order.

Context is derived from:
- task/work/order ID first;
- explicit lead/client context where safe;
- module + record ID fallback.

The underlying business signals are not deleted. This only affects the ranked action view.

## Shared surfaces

### Operations AI
The first three actions are selected through the common Next Best Action engine.
The headline uses the same top-ranked signal.

### Workspace Activity Center
The activity feed is ranked with the same engine and collapses duplicate operational context.

### Overview
The attention list uses the same ordering and context deduplication.
User-set urgent task priority remains visible as an explicit business input.

## Safety

0.8.13 is read/prioritization intelligence only.

It does not:
- execute actions automatically;
- send follow-ups;
- assign team members;
- reschedule appointments;
- accept offers;
- create financial entries;
- modify inventory;
- infer financial value not present in data.

Any mutation remains behind explicit confirmation / Plan Mode.

## Data boundaries

- no new database table;
- no migration;
- no external model call;
- no unbounded read added;
- no hidden scoring weights;
- no change to RLS or tenant isolation.

## Acceptance

Before release:
- lint;
- TypeScript;
- Next Best Action pure tests;
- automation signal regressions;
- security/legal/billing/inventory/device regressions;
- production build;
- Architecture Guard;
- Vercel production deploy.
