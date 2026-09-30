# ORBYVEN Intelligence 0.8.12 — Work Readiness

Date: 2026-09-30
Base: ORBYVEN Alpha 0.9 + Intelligence 0.8.11 Operational Intelligence

## Purpose

0.8.12 adds a deterministic readiness layer on top of the existing operational dossier.

ORBYVEN now checks whether a work/order that is approaching execution has clear ownership and whether an already-started commercial workflow is coherent, without turning optional business data into mandatory blockers.

## Shared global signals

### Operation without owner
For work/order records only, ORBYVEN raises a signal when execution is already in progress, scheduled within seven days, or due within seven days, and no assignee is set.
The signal becomes urgent when execution is already in progress or within 24 hours.

### Inactive assignee
When Team is active and the assignee exactly matches a Team member explicitly marked inactive, ORBYVEN raises a reassignment signal.
Unknown/free-text assignees are never assumed inactive.

### Execution before accepted estimate
When a work/order is already in progress, has one or more linked sent estimates, and has no accepted estimate, ORBYVEN raises an attention signal.
No signal is created when no estimate workflow exists or at least one linked estimate is accepted.

## Work Dossier readiness
The existing Work Dossier now displays a compact ORBYVEN · WORK READINESS strip.
It evaluates current status, ownership, commercial context, scheduling, checklist completion, document visibility, and cost/consumption visibility.
Only meaningful workflow risks become attention.

Documents and cost data are intentionally informational when empty:
- zero documents is not treated as a blocker;
- zero expenses or inventory consumption is not treated as a blocker.

This keeps the engine useful across different SME niches.

## Team integration
Team data is queried only when Team is enabled on the relevant workspace surface.
Only explicitly inactive members are used for readiness signals.

## Shared surfaces
The readiness signals feed the same deterministic business-signal engine used by Workspace Activity Center, Overview, and ORBYVEN Intelligence Operations.
The Work Dossier uses the dedicated pure readiness evaluator for the selected operation.

## Safety
0.8.12 is read/attention intelligence.
It does not assign employees, accept estimates, send commercial messages, create financial entries, upload documents, change task status, or modify schedules automatically.
Any mutating AI flow remains behind the existing explicit confirmation / Plan Mode contracts.

## Data boundaries
- operation candidate reads remain bounded;
- Team inactive-member reads are bounded and only used when Team is active;
- Overview retains bounded seven-day calendar reads;
- finance visibility remains role-gated;
- no new database table or migration is required.

## Acceptance
- lint;
- TypeScript;
- shared automation signal tests;
- Work Readiness pure evaluator tests;
- data-efficiency regression;
- security/legal/billing/inventory/device regressions;
- production build;
- Architecture Guard;
- Vercel production deployment.
