# ORBYVEN Alpha 0.8.8 — Plan Mode v1

Date: 2026-09-30
Base: Alpha 0.8.7 — Entity Context v1

## Purpose

Alpha 0.8.8 adds deterministic multi-action planning without introducing autonomous execution.

A request containing multiple supported ORBYVEN mutations can be compiled into a visible ordered plan.

Example:

`Creează client Ana Popescu; apoi creează lucrare Revizie centrală pentru el; apoi programeaz-o mâine la 10:30`

ORBYVEN can compile this into:
1. create client;
2. create work linked to that client;
3. create calendar event linked to that work/client.

## No bulk execution

Plan Mode intentionally has no "confirm all" action.

Every plan step:
- is represented by its own existing server-only Agent Action proposal;
- has its own proposal ID and expiry;
- requires explicit user confirmation;
- is executed through the existing Agent Action executor;
- receives the existing module/role/tenant checks;
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

A forged or out-of-order confirmation is rejected before business mutation.

## Context propagation

Plan Mode v1 can carry bounded newly-created context forward while compiling the plan.

Supported bindings:
- newly created client -> later work/client fields;
- newly created work -> later `lucrare:` fields;
- `programeaz-o` after a work step -> calendar action tied to that work;
- `pregătește devizul` after a work step -> estimate draft intent tied to that work.

ORBYVEN still refuses to invent missing commercial data.

For example, an estimate step without explicit positions/prices makes the plan incomplete and no plan proposals are created.

## Calendar ↔ Work linkage

Calendar Agent Actions now support an explicit `lucrare:` field.

At execution time ORBYVEN revalidates the exact work inside the authenticated organization and writes:
- `client_id`;
- `task_id`.

A conflicting client/work combination remains rejected by the existing work-context validator.

## Persistence without a new table

Alpha 0.8.8 does not add another plan table.

Plan state is reconstructed from existing `ai_action_proposals`:
- organization;
- actor;
- conversation;
- plan metadata;
- proposal status;
- expiry.

This means an active/recent plan can be restored after refresh or from another device while preserving the same server-only proposal boundary.

## UI

ORBYVEN Intelligence now renders a Plan Mode card with:
- ordered steps;
- progress counter;
- Ready / Locked / Executed / Stopped / Expired / Failed states;
- Confirm step;
- Stop plan.

The interface explicitly states that every step is confirmed separately.

## Language Layer boundary

Plan Mode is excluded from Selective Language rewriting.

The model cannot rewrite:
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
- recovery/replanning after a rejected/failed step;
- long-running plans beyond proposal expiry;
- semantic plan generation from vague goals.

Those remain future milestones.

## Release acceptance

Before merge:
- changed-file lint;
- full lint;
- TypeScript;
- Intelligence/Agent Actions/Memory/Context/Language/Entity tests;
- Plan Mode tests;
- sequential dependency ordering test;
- Calendar work-link regression;
- security/billing/legal/order regressions;
- performance/data/SEO regressions;
- production Next.js build;
- Architecture Guard;
- Vercel production success.
