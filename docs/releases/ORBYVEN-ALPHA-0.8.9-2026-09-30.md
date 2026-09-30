# ORBYVEN Alpha 0.8.9 — Plan Mode v1

Date: 2026-09-30  
Base: Alpha 0.8.8 — Universal Operations + Automation Signals

## Purpose

Alpha 0.8.9 adds deterministic multi-action planning on top of the universal Operations core, without introducing autonomous execution.

A request containing multiple supported ORBYVEN mutations can be compiled into a visible ordered plan.

Example:

`Creează client Ana Popescu; apoi creează lucrare Revizie centrală pentru el; apoi programeaz-o mâine la 10:30`

ORBYVEN compiles that request into separate, reviewable Agent Actions.

The same bounded mechanism supports the universal `order` operation type introduced in Alpha 0.8.8, so a created order can also be carried into later calendar or estimate context.

## No bulk execution

Plan Mode intentionally has no "Confirm all" action.

Every plan step:
- is represented by its own existing server-only Agent Action proposal;
- has its own proposal ID and expiry;
- requires explicit user confirmation;
- uses the existing Agent Action executor;
- receives the existing role, entitlement and tenant checks;
- is independently audited.

Only the first eligible step is ready.

Later steps remain locked until the immediately preceding proposal reaches the executed state.

## Dependency enforcement

Plan dependencies are stored inside server-only proposal payload metadata:

`__orbyven_plan`

The metadata contains:
- plan ID;
- step number;
- total steps;
- previous proposal ID.

Before a plan proposal is atomically claimed for execution, the server:
1. loads the previous proposal in the same organization + actor scope;
2. requires it to be executed;
3. verifies both proposals belong to the same plan;
4. verifies the dependency is exactly the previous step.

A forged or out-of-order confirmation is rejected before any business mutation.

## Universal context propagation

Plan Mode can carry bounded newly-created context forward while compiling the plan.

Supported bindings:
- newly created client -> later client fields;
- newly created work -> later `lucrare:` fields;
- newly created order -> later `comanda:` fields;
- `programeaz-o` after a work/order step -> calendar action tied to that exact operation;
- `pregătește devizul` after a work/order step -> estimate-draft intent tied to that exact operation.

ORBYVEN still refuses to invent missing commercial data.

For example, an estimate step without explicit positions/prices makes the plan incomplete and no plan proposals are created.

## Calendar ↔ Universal Operations

Calendar Agent Actions now support an explicit operation context.

At execution time ORBYVEN revalidates the exact work/order inside the authenticated organization and writes:
- `client_id`;
- `task_id`.

A conflicting client/operation combination is rejected by the same tenant-scoped context validator already used by estimates/documents.

## Persistence without a new table

Alpha 0.8.9 does not add a plan table.

Plan state is reconstructed from existing `ai_action_proposals`, scoped by:
- organization;
- actor;
- conversation;
- plan metadata;
- proposal status;
- expiry.

An active/recent plan can therefore be restored after refresh or from another device while retaining the same server-only proposal boundary.

## UI

ORBYVEN Intelligence renders a Plan Mode card with:
- ordered steps;
- progress counter;
- Ready / Locked / Executed / Stopped / Expired / Failed states;
- Confirm step;
- Stop plan.

Every step is confirmed separately.

## Language Layer boundary

Plan Mode is excluded from Selective Language rewriting.

The optional language provider cannot rewrite:
- step order;
- plan identity;
- proposal IDs;
- dependencies;
- action types;
- confirmation state.

## Audit

Executed Agent Actions continue using `platform_audit_log`.

For plan steps, audit metadata additionally contains:
- `plan_id`;
- `plan_step`;
- `plan_total`.

## Limits in v1

Plan Mode supports up to 8 mutation steps and a 30-minute proposal window.

Not included:
- one-click plan execution;
- background/autonomous execution;
- automatic Finance writes;
- arbitrary model-generated tool chains;
- automatic recovery/replanning after a rejected/failed step;
- long-running plans beyond proposal expiry;
- vague-goal autonomous planning.

## Release acceptance

Before merge:
- changed-file lint;
- full lint;
- TypeScript;
- Intelligence / Agent Actions / Memory / Context / Language / Entity tests;
- Universal Operations + Automation Signals regression tests;
- Plan Mode tests;
- sequential dependency ordering tests;
- Calendar work/order-link regression;
- security/billing/legal/order regressions;
- performance/data/SEO regressions;
- production Next.js build;
- Architecture Guard;
- Vercel production success.
