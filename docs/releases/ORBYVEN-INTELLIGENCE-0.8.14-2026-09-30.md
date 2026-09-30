# ORBYVEN Intelligence 0.8.14 — Guided Resolution

Date: 2026-09-30
Base: ORBYVEN Intelligence 0.8.13 Next Best Action + Alpha 0.9.1 / Wave 2

## Purpose

0.8.14 turns a ranked priority into a deterministic resolution playbook.

ORBYVEN can now answer three questions together:
- what should be handled first;
- why it matters;
- what concrete steps should be checked next.

The result remains guidance plus exact workspace navigation. It is not autonomous execution.

## Resolution playbooks

The playbook layer is rule-based and explicit.

Supported examples include:
- blocked or overdue work;
- calendar conflicts;
- appointments missing resources;
- inactive or missing owner;
- execution without accepted estimate;
- accepted estimate waiting for scheduling;
- expiring or stale estimates;
- work due soon or still unplanned;
- upcoming appointments.

Each playbook contains:
- a clear action label;
- a factual operational rationale;
- a short ordered checklist.

Unknown rules receive a conservative generic verification playbook rather than invented business logic.

## Operations AI

The top priorities from Next Best Action are converted into `guided_resolution` actions.

A Guided Resolution action contains:
- source rule;
- priority title;
- rationale;
- ordered checklist;
- exact module/context identifiers;
- optional create intent.

The AI response itself remains read-only.

## UI

ORBYVEN Intelligence renders a dedicated **GUIDED RESOLUTION** card.

The user sees:
- why the issue is important;
- three practical resolution checks;
- one button that opens the exact relevant module/record/form.

Opening context does not perform the business mutation.

## Safety boundaries

0.8.14 does not automatically:
- change work status;
- reassign people or resources;
- reschedule appointments;
- accept/reject estimates;
- contact clients;
- record payments;
- place purchase orders;
- change inventory;
- create arbitrary actions from model output.

Mutation paths continue through explicit user-controlled flows and Plan Mode.

## Architecture

New shared layer:
- `lib/automation/resolution-playbooks.ts`

Reused layers:
- Next Best Action ranking;
- shared business signals;
- workspace navigation;
- existing tenant/auth/RLS boundaries.

No new database table.
No migration.
No external model call.
No new privileged backend endpoint.

## Language safety

Guided Resolution actions are marked deterministic in Selective Language policy, so a language model cannot replace their structured action content.

## Acceptance

Before release:
- lint;
- TypeScript;
- Guided Resolution pure tests;
- Intelligence regressions;
- billing/security/legal/data/SEO regressions;
- production build;
- Architecture Guard;
- production Vercel deployment.
