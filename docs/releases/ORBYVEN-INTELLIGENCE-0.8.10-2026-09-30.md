# ORBYVEN Intelligence 0.8.10 — Plan Recovery & Smart Replanning

Date: 2026-09-30  
Base: ORBYVEN Alpha 0.9 + Intelligence 0.8.9 Plan Mode

## Purpose

0.8.10 makes Plan Mode recoverable without making ORBYVEN autonomous.

When a plan is blocked because a step was:
- rejected;
- expired;
- failed;
- incomplete because details were missing;

ORBYVEN can now either rebuild the remaining proposal chain or ask the user to correct the missing/ambiguous context.

## Safety model

Plan Recovery never bulk-executes business actions.

A recovered plan:
- gets a new plan ID;
- gets new proposal IDs;
- gets a fresh confirmation TTL;
- gets a new dependency chain;
- contains only the remaining blocked/unfinished steps;
- still requires explicit confirmation for every step.

The recovery endpoint creates proposals only. It does not call the business-action executor.

## Missing and ambiguous information

ORBYVEN refuses to invent context for known unsafe deterministic failures such as:
- missing/ambiguous client;
- missing/ambiguous task/work/order;
- task/client mismatch;
- invalid estimate details;
- invalid event time;
- unavailable module;
- invalid document size.

In those cases the UI exposes **Corectează pasul** and pre-fills the original plan prompt for the user to edit.

The same repair flow is available when Plan Mode detects missing details before proposals are created.

## Retryable recovery

For a rejected, expired, or otherwise recoverable failed step, the user can explicitly request recovery.

The server:
1. reloads the plan scoped to organization + actor;
2. identifies the first blocked terminal step;
3. clones only that step and the remaining steps;
4. strips the old plan metadata;
5. creates a new bounded dependency chain;
6. marks old pending remnants as superseded;
7. returns the new Plan Mode action.

Recovery attempts are capped. After the limit, ORBYVEN requires user correction rather than creating another chain.

## Persistence

Recovery metadata is stored inside the existing server-only proposal payload:
- root plan ID;
- recovery attempt;
- recovered-from plan ID;
- recovered-from step;
- original plan prompt;
- effective source prompt.

No new database table is required.

## Audit

Every successful plan reconstruction mirrors an audit event:
- action: `ai_plan.recovered`;
- previous/new/root plan IDs;
- blocked step;
- recovery reason;
- recovery attempt;
- remaining step count;
- explicit marker that execution still requires user confirmation.

## UI

Plan Mode now shows a **PLAN RECOVERY** card when a plan is blocked.

Possible controls:
- Refă de la pasul N;
- Reîmprospătează de la pasul N;
- Reîncearcă de la pasul N;
- Corectează pasul N.

The composer can be pre-filled for correction without sending or executing anything automatically.

## Boundaries

Still not included:
- Confirm all;
- background execution;
- autonomous retries;
- autonomous editing of missing commercial data;
- Finance writes without explicit business flows;
- model-generated arbitrary tool chains.

## Acceptance

Before merge:
- lint;
- TypeScript;
- Intelligence/Agent Actions/Plan Mode tests;
- Plan Recovery regression tests;
- security/legal/billing/inventory/device regressions;
- production build;
- Architecture Guard;
- Vercel production deployment.
