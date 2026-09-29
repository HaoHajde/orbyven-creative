# ORBYVEN Alpha 0.8 — Intelligence Core

Date: 2026-09-29  
Checkpoint: Alpha 0.8  
Base: Alpha 0.7.2 (Finanțe v2 + Activity Center)

## What changed

Alpha 0.8 introduces the first production-ready ORBYVEN Intelligence foundation as a **global workspace capability**, not as another business module.

### ORBYVEN Intelligence Core
- One workspace entry point: **ORBYVEN AI**.
- Deterministic intent router selects a specialist:
  - Operations
  - Finance
  - Documents
  - Web Design
  - ORBYVEN Core
- Read-only business context in this release.
- Every business query is scoped to the authenticated organization.
- Module entitlements and enabled/disabled state are enforced explicitly on the server.
- Finance data is additionally restricted to Owner/Admin/Manager roles.
- No write action is executed by Intelligence Core 0.8.

### Operations Specialist
Can summarize bounded workspace data such as:
- open work/tasks;
- overdue and urgent work;
- active leads and near follow-ups;
- sent estimates;
- next 24h calendar items.

### Finance Specialist
Can summarize:
- current-month operational income;
- current-month expenses;
- monthly operational cashflow;
- invoice-linked outstanding amounts;
- overdue receivables.

Financial totals use paged reads where complete result sets affect sums.

### Documents Specialist
Can report document counts and route the user to the existing Documents module.

### Web Design Specialist
The validated ORBYVEN web-design engine from the earlier AI editor work has been ported onto the current main architecture instead of merging the stale branch.

Current capabilities:
- live preview;
- validated presets;
- layout changes;
- palette/accent changes;
- headline sizing;
- section visibility/order;
- exact user-provided copy;
- Undo and reset;
- local persistence in the browser.

The web-design engine returns **data only**, never executable generated code.

## Safety and architecture boundaries

- Business Intelligence Core is read-only in Alpha 0.8.
- The server endpoint authenticates the user and organization before reading context.
- Service-role access is always explicitly scoped to the authenticated `organization_id`.
- Enabled module + entitlement checks are enforced separately because service-role bypasses normal RLS.
- Finance access is denied to Member/Viewer roles even when the route is called directly.
- The global prompt is capped at 1,200 characters.
- Responses are `Cache-Control: no-store`.
- Web Design Specialist requires a valid ORBYVEN workspace session.

## Model/provider status

Alpha 0.8 does **not** turn every request into an external LLM call.

The existing Supabase AI quota primitives remain available for the next stage, but ORBYVEN Core currently answers deterministic business questions directly from structured ORBYVEN data.

Remote inference will be introduced only for requests that actually need language generation or semantic reasoning. This avoids paying model cost for questions that ORBYVEN can answer exactly from its own database.

## Not yet included

- write actions across CRM/Work/Calendar/Estimates/Finance;
- confirmation workflow for AI mutations;
- persistent AI conversation history;
- remote LLM provider for general reasoning/copy generation;
- tool-calling agent loop;
- Windows desktop ORBYVEN AI surface;
- automatic website publishing.

These are post-0.8 milestones and must preserve the same tenant, role, entitlement and audit boundaries.

## Release acceptance

Required before merge:
- lint;
- TypeScript;
- ecosystem tests including Intelligence Core contract;
- billing/security/legal regression suites;
- performance/data/SEO regression suites;
- production Next.js build;
- architecture guard;
- Vercel production deployment after merge.

