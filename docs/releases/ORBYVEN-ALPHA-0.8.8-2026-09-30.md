# ORBYVEN Alpha 0.8.8 — Universal Operations + Automation Signals v1

Date: 2026-09-30  
Base: Alpha 0.8.7 — Entity Context v1

## Purpose

Alpha 0.8.8 starts turning ORBYVEN from a collection of useful modules into a connected business operating system.

The release deliberately reuses the existing `tasks` module and `ops_tasks` model instead of creating a separate Orders product. A single operational core can now represent:

- a task;
- a service/field work item;
- a customer order.

This keeps CRM, estimates, calendar, documents, finance and future inventory/procurement integrations on one common operational identity.

## Universal Operations Core

`ops_tasks.kind` now supports:

- `task`;
- `work`;
- `order`.

The existing organization scope, RLS, roles, checklist, client relation, scheduling fields, work dossier and audit boundaries remain unchanged.

The workspace UI presents the module as **Lucrări & comenzi** while keeping the stable internal module id `tasks`, avoiding entitlement and navigation churn.

## Confirmed AI order creation

ORBYVEN Intelligence now understands commands such as:

`Creează comandă Buchet 30 trandafiri; client: Florăria Demo; prioritate: ridicată`

The action still follows the Agent Action safety boundary:

1. parse intent deterministically;
2. create a server-only proposal;
3. show the user the preview;
4. require explicit confirmation;
5. verify role, tenant and module entitlement;
6. execute once;
7. audit the result.

No order is silently created by the language layer.

## Automation Signals v1

A new deterministic engine derives cross-module business signals from existing business records.

### Rules shipped

1. **Operation overdue**
   - active task/work/order with a deadline already passed;
   - opens the exact operational record.

2. **Operation due soon**
   - active operation due within the next 24 hours.

3. **Unplanned work/order**
   - work or order older than 24 hours with neither a schedule nor deadline;
   - prevents requests from becoming forgotten records.

4. **Accepted estimate needs scheduling**
   - accepted estimate linked to an active work/order;
   - no operation schedule and no future calendar event;
   - opens Calendar directly in create mode with work/order and client context prefilled.

5. **Estimate expiry**
   - preserves existing sent-offer expiry monitoring.

6. **Upcoming appointment**
   - preserves the next-24-hours operational calendar signal.

Finance receivable and CRM follow-up signals remain integrated in the same Activity Center.

## Activity Center

The former passive activity list is now the first Automation surface.

Each signal carries a concrete next action such as:

- **Programează**;
- **Rezolvă**;
- **Încasează**;
- **Deschide**.

The engine does not perform risky hidden writes. It detects, recommends and routes. Existing explicit-confirmation boundaries remain in place for AI mutations.

## Why this architecture

Industry-specific products can now be composed without cloning business logic.

Examples:

- florist: order → schedule/production → delivery → payment;
- detailing: booking/work → bay/time → execution → payment;
- installations: work → estimate → planner/materials → schedule → execution;
- asphalt: work → estimate/material calculation → resources → execution.

Future Stock, Procurement, Resource Scheduler and Universal Canvas modules can attach to the same operation id.

## Database change

Production migration:

`20260930062442_ops_tasks_universal_order_kind`

The change only widens the existing `ops_tasks_kind_check` constraint. It does not create a parallel table, remove data or alter RLS policies.

## Not included yet

Alpha 0.8.8 does not yet include:

- stock quantities;
- supplier purchase orders;
- resource capacity planning;
- customer portal;
- autonomous multi-step write chains;
- automatic fiscal issuance.

Those remain separate milestones built on top of this core.

## Release acceptance

Before merge:

- ecosystem tests, including Automation Signals;
- Agent Action order parsing regression;
- full lint and TypeScript validation;
- security, billing, compliance, order-evidence, performance, SEO and data regression suites;
- production Next.js build;
- Supabase constraint verification;
- Supabase security and performance advisors;
- production Vercel deployment check.
