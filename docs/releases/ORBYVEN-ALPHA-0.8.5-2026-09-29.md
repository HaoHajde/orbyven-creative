# ORBYVEN Alpha 0.8.5 — Context Memory v1

Date: 2026-09-29
Base: Alpha 0.8.4 — Conversation Memory

## Scope

Alpha 0.8.5 adds the first bounded multi-turn context behavior to ORBYVEN Intelligence.

It is intentionally narrow:
- ORBYVEN does not feed the entire transcript into a model;
- ORBYVEN does not infer hidden business facts;
- ORBYVEN does not silently execute prior requests.

The first supported contextual behavior is **guided mutation completion**.

## Guided follow-ups

When ORBYVEN has just asked for missing details for an Agent Action, the next message can provide only those details.

Example:

1. `Creează deviz Renovare baie; client: Exemplu SRL`
2. ORBYVEN: asks for at least one explicit line item.
3. User: `poziție: Montaj centrală, 1 x 1500 lei`
4. ORBYVEN safely combines the recent request + explicit follow-up.
5. The normal Agent Action proposal is created.
6. Nothing is written until the user confirms.

Supported continuation shapes include:
- client/company/contact labels;
- task/work context;
- estimate line items and commercial fields;
- document explicit content/category/note;
- calendar date/time/duration/reminder details.

## Safety conditions

Conversation context is reused only when all of these are true:
- current message does not start a new mutation command;
- current message clearly looks like structured missing detail;
- previous assistant message explicitly asked for details;
- previous user message contained an explicit create/add/register/schedule command;
- previous assistant request is no older than 30 minutes;
- all messages belong to the same persisted actor + organization thread.

If any condition fails, the new message is processed independently.

## Action boundary unchanged

Context completion never bypasses:
- module entitlement checks;
- role checks;
- exact same-tenant client/work resolution;
- proposal preview;
- short proposal expiry;
- atomic one-time claim;
- explicit confirmation;
- audit log.

The contextual layer only reconstructs the **proposal input**.

## Persistence behavior

The user's actual follow-up message is stored verbatim in conversation history.

The combined effective prompt is transient server-side input and is not written as a replacement for the user's message.

When context is used, the assistant response includes a fact marker:

`Context — Completare din mesajul anterior`

## Not included yet

- unrestricted semantic chat over the full transcript;
- remote LLM conversation reasoning;
- pronoun/entity resolution across long conversations;
- autonomous multi-step plans;
- hidden action chaining;
- Finance mutations.

Those remain future milestones.

## Release acceptance

Before merge:
- lint;
- TypeScript;
- existing Intelligence/Agent Actions/Conversation Memory tests;
- Context Follow-up tests for estimate, document and calendar;
- stale-context rejection;
- new-command isolation;
- billing/security/legal/order regressions;
- performance/data/SEO regressions;
- production Next.js build;
- Architecture Guard;
- Vercel production success.
