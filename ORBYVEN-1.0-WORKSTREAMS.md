# ORBYVEN 1.0 — Parallel Workstreams

## Goal

Finish the universal ORBYVEN 1.0 foundation before pilot feedback without creating divergent mega-branches.

`main` remains the only canonical source of truth. Every worker must inspect current `main` before implementing anything and must not rebuild a capability that already exists in a sufficient form.

The 1.0 rule is: prefer universal capabilities useful to most SMEs over vertical-specific features. Product Film / Video AI is not on the critical 1.0 path.

## Workstream A — Universal Core

Checkpoint: `.orbyven/handoff/universal-core.json`

Scope, in priority order:

1. universal onboarding and first-run setup;
2. global search / command palette;
3. universal Create action;
4. custom fields;
5. configurable tags and business statuses;
6. reusable business templates;
7. final Dashboard/Core 0.8.25 reconciliation only when the universal foundation is stable.

Rules:

- preserve the beginner/noob-friendly, maximum-three-click product principle;
- do not directly wire shared shell/navigation files while another worker owns overlapping integration work;
- build self-contained contracts/components first, then let the coordinator schedule shared-shell wiring;
- preserve auth, tenant, role, entitlement and confirmation-only mutation boundaries;
- no wholesale merge of legacy Dashboard PRs.

## Workstream B — Data & Portability

Checkpoint: `.orbyven/handoff/data-portability.json`

Scope, in priority order:

1. universal import foundation for existing business entities;
2. preview + column mapping + validation + duplicate handling;
3. safe retry/rollback semantics where supported by the current data model;
4. universal attachments contract and contextual linking;
5. export / backup / offboarding UI completion over existing audited backend capability;
6. user-readable import/export reports.

Rules:

- reuse current tenant-scoped data APIs and audited export/offboarding contracts;
- do not add a second storage/data abstraction if one already exists;
- fail closed on cross-tenant ambiguity;
- do not silently overwrite existing records;
- new dependencies require explicit justification and architecture review.

## Workstream C — Operations & Reliability

Checkpoint: `.orbyven/handoff/operations-reliability.json`

Scope, in priority order:

1. unified Notification Center / attention inbox;
2. universal activity/audit timeline presentation over existing evidence where available;
3. unified Settings/Admin Center;
4. user-facing error recovery and retry states;
5. operator observability / health surface for failures and critical jobs;
6. notification delivery preferences and channel controls over supported channels.

Rules:

- one attention model: Now / Today / Attention / Resolved, not scattered notification systems;
- prefer read models over new duplicated event stores;
- security/audit evidence remains immutable where current contracts require it;
- observability must not expose secrets, raw credentials, cross-tenant data or sensitive provider payloads;
- shared shell wiring is coordinator-controlled when overlap exists.

## Workstream D — Release Coordinator

Checkpoint: `.orbyven/handoff/release-coordinator.json`

The coordinator does not create a parallel product implementation. It:

1. verifies current `main`, PRs, CI and checkpoints;
2. detects overlapping file/contract ownership before work is integrated;
3. decides integration order;
4. keeps PRs small and ownership-label compliant;
5. schedules shared-shell wiring after worker contracts are stable;
6. prevents stale/legacy PRs from being merged wholesale;
7. tracks remaining 1.0 gates: branch protection, authenticated E2E, real-device smoke, production alias verification, final integrity pass and commercial/legal gates.

## Git / PR discipline

Repository ownership rules in `INTEGRATION-AUTOMATION.md` remain authoritative.

A workstream is not an ownership label. Each implementation PR must use the existing ownership label that matches the paths actually changed:

- `chat-1-modules` — Modules + Client Workspace Experience;
- `chat-2-platform` — Platform Core + Auth + Supabase + Onboarding + Control Center;
- `chat-3-billing` — Legal + Billing + Entitlements;
- `chat-4-public` — Public Website + Templates + Marketing.

If one workstream needs both platform and module changes, split them into separate PRs whenever practical. Use `architecture-cross-domain-approved` only for genuinely inseparable contract changes.

No worker should create a large long-lived branch containing several unrelated milestones. After one atomic capability is green and integrated, start the next milestone from current `main`.

## Shared-file collision rule

The following are treated as coordinator-controlled integration surfaces whenever two workers need them concurrently:

- workspace/root shells;
- global navigation and utility bars;
- global search/create launchers;
- shared module registries;
- app-wide providers/state roots;
- global settings navigation;
- common database migrations that define cross-domain contracts.

Workers should expose narrow contracts/components/functions first instead of independently editing these integration surfaces.

If current `main` changed an owned contract since the checkpoint, sync/rebase and inspect the diff before continuing. If ownership is ambiguous, stop as `BLOCKED_EXTERNAL` rather than guessing.

## Definition of done for each milestone

A milestone is done only when:

- the implementation is based on current `main`;
- the worker checkpoint records the branch/commit/PR;
- relevant targeted tests pass;
- Architecture Guard / Quality Gate / CI evidence is green as applicable;
- responsive and tenant/auth/security contracts are preserved;
- no known shared-file collision is hidden;
- coordinator review says it is safe to integrate.

## 1.0 critical gates after feature work

Feature-complete does not mean release-complete. ORBYVEN 1.0 still requires:

- production alias/domain verification;
- authenticated end-to-end regression on critical business flow;
- Windows + mobile real-device smoke;
- appropriate `main` branch protection / required checks;
- final integrity pass over architecture, security, SEO, legal/compliance and offboarding;
- commercial billing/legal activation only after the existing professional/manual gates are satisfied.
