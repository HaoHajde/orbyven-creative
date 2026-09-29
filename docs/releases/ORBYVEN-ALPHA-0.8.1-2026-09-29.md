# ORBYVEN Alpha 0.8.1 — Agent Actions

Date: 2026-09-29  
Base: Alpha 0.8 — Intelligence Core

## Scope

Alpha 0.8.1 turns ORBYVEN Intelligence from a read-only assistant into a controlled operator for a small set of high-value workspace actions.

### Supported confirmed actions

- create Lead;
- create Client;
- create Task / Work item;
- create Calendar appointment.

The action is never executed directly from the prompt.

Flow:

1. user asks ORBYVEN to create something;
2. deterministic parser converts the request into a bounded payload;
3. ORBYVEN stores a short-lived server-only proposal;
4. UI displays the interpreted fields;
5. user explicitly confirms or rejects;
6. one successful claim can execute the proposal;
7. result and execution metadata remain in the proposal record and are mirrored to platform audit log.

## Safety boundaries

- Viewer remains read-only.
- Owner/Admin/Manager/Member mirror the existing create permissions of CRM, Tasks and Calendar.
- Required module must be both enabled and entitled at proposal time and again at execution time.
- Proposal belongs to one organization + one actor.
- Browser roles have no direct SELECT/INSERT/UPDATE access to `ai_action_proposals`.
- Proposals expire after 15 minutes.
- Claim transition is `pending -> executing` and is filtered atomically by actor, organization, status and expiry.
- Duplicate confirmation cannot execute a proposal twice.
- Client links use an exact normalized match inside the same organization; ambiguous or missing client names fail closed.
- Finance, estimate and document writes are not part of 0.8.1.

## Natural-language support

Current deterministic commands include Romanian forms such as:

- `Creează lead Ana Popescu; telefon: 0712345678`
- `Adaugă client Mihai Ionescu`
- `Creează lucrare Revizie centrală; client: Exemplu SRL; prioritate: urgent`
- `Programează o programare Revizie tehnică mâine la 10:30; durata: 90`

Calendar interpretation uses the workspace timezone and previews the resolved date/time before confirmation.

## Persistence and audit

New server-only table:

- `public.ai_action_proposals`

It stores:
- organization;
- actor;
- action type;
- validated payload;
- human-readable summary;
- lifecycle status;
- expiry;
- execution result;
- failure code;
- timestamps.

Successful execution is mirrored to `platform_audit_log` with the proposal id and explicit-confirmation marker.

## Not included yet

- update/delete actions;
- estimate/deviz creation;
- generated document creation and storage;
- finance mutations;
- autonomous action chains;
- background execution;
- remote LLM-generated mutation payloads.

Those must reuse this confirmation and audit boundary instead of bypassing it.

## Release acceptance

Before merge:
- changed-file lint;
- full lint;
- TypeScript;
- Agent Actions parser and contract tests;
- existing ecosystem/billing/security/legal/order tests;
- performance/data/SEO regression tests;
- production Next.js build;
- Architecture Guard;
- Vercel success after merge.
