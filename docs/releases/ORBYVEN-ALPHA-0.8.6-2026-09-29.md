# ORBYVEN Alpha 0.8.6 — Selective Language Layer

Date: 2026-09-29
Base: Alpha 0.8.5 — Context Memory v1

## Purpose

Alpha 0.8.6 separates **truth and action** from **language generation**.

ORBYVEN Core remains authoritative for:
- organization and role access;
- module entitlements;
- business reads;
- finance calculations;
- mutation parsing;
- Agent Action proposals;
- confirmation and execution;
- facts;
- navigation/actions.

The optional Language Layer is allowed to change only the prose of selected read-only answers.

## Selection policy

External language inference is never used for:
- create/add/register/schedule mutation commands;
- an answer containing an Agent Action confirmation proposal;
- Web Design Specialist commands;
- normal deterministic questions that do not need explanation.

It may be considered for:
- general conversational requests;
- explicit explain/analyze/summarize/prioritize/recommend-style read requests.

If the feature is disabled, quota is unavailable, the provider fails, times out, or output validation fails, ORBYVEN returns the canonical deterministic answer.

## Explicit opt-in

The layer is OFF by default.

All of these are required before an external request can occur:

- `ORBYVEN_LANGUAGE_LAYER_ENABLED=true`
- `ORBYVEN_LANGUAGE_PROVIDER=openai`
- `ORBYVEN_LANGUAGE_OPENAI_API_KEY=<dedicated secret>`
- `ORBYVEN_LANGUAGE_MODEL=<explicit model id>`

The code intentionally does not fall back to an existing `OPENAI_API_KEY`.
There is intentionally no hard-coded default model.

## Provider request boundary

The OpenAI Responses endpoint is called directly server-side only after quota reservation.

Request behavior:
- `store: false`;
- no tools or function-calling supplied;
- bounded 12 second timeout;
- max 300 output tokens;
- low verbosity;
- server-held credential only.

The provider receives only:
- the current user request;
- ORBYVEN's canonical answer;
- authoritative fact cards required for the answer.

It does not receive:
- Agent Action proposal payloads;
- confirmation capability;
- Supabase credentials;
- module write APIs;
- hidden platform secrets.

## Output guards

Generated prose is rejected and replaced by the canonical answer if it:
- is empty;
- introduces a number not present in the canonical input;
- introduces an execution claim such as created/sent/paid/deleted when the canonical input contains no such claim.

Even when accepted, only `answer` is replaced.

`facts`, `actions`, specialist routing and execution state remain unchanged.

## Quota and telemetry

New server-only tables:

- `ai_language_daily_usage`
- `ai_language_calls`

New server-only RPCs:

- `ai_language_claim`
- `ai_language_finish`

Quota is atomic per organization with configurable server-side limits that are clamped by the database:
- default 30 attempts/day;
- default 4 attempts/minute;
- DB maximum 200/day and 20/minute.

Telemetry stores provider/model, organization, actor, optional conversation ID, status and token counts.

No browser role receives direct table access or RPC execution.

## Database hardening

Production migrations:

- `20260929201932_ai_selective_language_layer.sql`
- `20260929202417_ai_action_proposals_actor_fk_index.sql`

The second migration closes the last previously reported unindexed AI Action actor foreign key.

## Transparency

The AI transparency page now reflects:
- deterministic ORBYVEN Intelligence;
- explicit-confirmation Agent Actions;
- Web Design Specialist;
- optional external Language Layer;
- the fact that external processing is disabled by default.

Before enabling external inference for commercial users, provider/model configuration and the applicable privacy/vendor review must be completed.

## Current production posture

The **0.8.6 code can be deployed with the Language Layer disabled**.

Publishing this release therefore does not itself cause conversation/business data to be sent to an external model.

Enabling it is a separate operations decision.

## Not included

- model-owned facts;
- model-owned tool calls;
- autonomous mutations;
- Finance write actions;
- automatic paid-provider fallback;
- unrestricted full-thread LLM context;
- self-hosted ORBYVEN model.

## Release acceptance

Before merge:
- lint;
- TypeScript;
- existing Intelligence / Agent Actions / Memory / Context tests;
- Selective Language policy and guard tests;
- server-only quota migration contract;
- legal transparency regression;
- security/billing/order regressions;
- performance/data/SEO regressions;
- production Next.js build;
- Architecture Guard;
- Vercel production success.
