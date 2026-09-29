# ORBYVEN Alpha 0.8.4 — Conversation Memory

Date: 2026-09-29
Base: Alpha 0.8.3 — Document Draft Agent Action

## Scope

Alpha 0.8.4 adds persistent ORBYVEN Intelligence conversation threads.

The goal of this release is continuity:
- a conversation survives refresh;
- the same account can resume it from another device;
- the transcript remains isolated to one organization + one actor;
- Agent Action outcomes are preserved;
- expired or previously confirmed actions cannot be re-triggered from saved history.

## Server-only storage

Two new server-only tables are introduced:

- `ai_conversations`
- `ai_conversation_messages`

Browser roles receive no direct grants.

Every conversation is scoped by:
- `organization_id`;
- `actor_id`.

Every message is constrained by a composite foreign key back to the exact same:
- conversation;
- organization;
- actor.

## Persisted message model

Stored messages include:
- role: user / assistant;
- assistant specialist;
- text content;
- bounded fact cards;
- timestamps.

Stored messages intentionally do **not** include:
- Agent Action payloads;
- confirmation buttons;
- executable actions;
- provider secrets;
- arbitrary generated code.

A loaded historical message therefore cannot recreate a stale confirmation flow.

## Request lifecycle

For a normal Intelligence request:

1. authenticate actor;
2. validate or create the conversation;
3. persist the user message;
4. run ORBYVEN Intelligence;
5. persist the assistant answer;
6. return the same conversation ID to the client.

The conversation title is derived from the first prompt and bounded to 120 characters.

## Agent Actions

`ai_action_proposals` now has an optional `conversation_id`.

When an action proposal is created inside a thread:
- the proposal remembers the conversation;
- the proposal remains short-lived and server-only;
- confirmation still uses the existing one-time execution boundary.

After explicit confirmation or rejection:
- the outcome is appended to the transcript;
- the proposal payload itself is not copied into history.

Conversation-history persistence is **non-authoritative** for action execution:
if saving the history outcome fails after an action was already executed/rejected,
the action result remains authoritative and is returned to the user.

## UI

ORBYVEN AI now includes:
- persistent transcript view;
- New conversation;
- recent conversation history;
- resume thread;
- cross-device server persistence.

Historical assistant messages are loaded with zero executable actions.

## Current boundary

Alpha 0.8.4 is persistent history, not semantic multi-turn reasoning.

The saved transcript is not yet automatically injected into:
- the deterministic intent router;
- mutation parsing;
- remote LLM context.

That contextual reasoning layer belongs to the next milestone so persistence and reasoning remain independently testable.

## Database alignment

Production migration:

`20260929195804_ai_conversation_memory.sql`

The migration is additive and includes:
- conversation tables;
- indexes;
- RLS enabled;
- service-role-only grants;
- optional proposal → conversation link.

## Release acceptance

Before merge:
- changed-file lint;
- full lint;
- TypeScript;
- Intelligence Core tests;
- Agent Actions tests;
- Estimate/Document Agent Action tests;
- Conversation Memory tests;
- billing/security/legal/order regressions;
- performance/data/SEO regressions;
- production Next.js build;
- Architecture Guard;
- Vercel success after merge.
