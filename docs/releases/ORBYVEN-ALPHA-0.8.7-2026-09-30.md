# ORBYVEN Alpha 0.8.7 — Entity Context v1

Date: 2026-09-30
Base: Alpha 0.8.6 — Selective Language Layer

## Purpose

Alpha 0.8.7 makes ORBYVEN Intelligence more natural without giving the language model ownership over business identity.

The first bounded entity references are:
- client references;
- work/lucrare references.

Examples:
- `Creează o lucrare nouă pentru clientul acela`
- `Creează document Raport pentru lucrarea de mai sus; conținut: ...`

## Deterministic resolution

ORBYVEN does not ask an external model to guess what an entity reference means.

A contextual entity is accepted only when:
1. the user uses an explicit bounded reference such as `clientul acela` or `lucrarea de mai sus`;
2. there is a recent assistant fact identifying exactly one matching contextual candidate;
3. that fact belongs to the same persisted actor + organization conversation;
4. the candidate is no older than 30 minutes;
5. the candidate can still be verified exactly in the authenticated organization's database.

When valid, ORBYVEN transiently augments the parser input with an explicit field:
- `client: <verified name>`;
- `lucrare: <verified title>`.

The user's original message remains the message stored in conversation history.

## Ambiguity behavior

ORBYVEN asks for clarification instead of guessing when:
- no recent candidate exists;
- the candidate is stale;
- the referenced entity no longer exists;
- multiple exact database matches exist.

No Agent Action proposal is created in those cases.

## Explicit user data wins

If the user already supplies:
- `client: ...`;
- `lucrare: ...`;

then contextual resolution is not used for that field.

## Action boundary unchanged

Entity Context does not bypass or replace:
- Agent Action parser;
- role checks;
- module entitlements;
- tenant isolation;
- proposal preview;
- short proposal expiry;
- one-time atomic claim;
- explicit user confirmation;
- execution-time entity validation;
- audit logging.

It only converts a safe recent reference into an explicit parser field.

## Language Layer boundary

External language inference remains optional and does not resolve entity identity.

Entity grounding occurs deterministically before the Agent Action parser.
The Language Layer cannot change facts, actions or resolved entity identity.

## Supported in v1

Client candidate sources:
- assistant fact `Client`;
- assistant fact pair `Tip = Client` + `Nume`.

Work candidate sources:
- assistant fact `Lucrare`;
- assistant fact pair `Tip = Lucrare` + `Titlu`.

Only the latest relevant bounded candidate is considered.

## Not included yet

- pronoun-only resolution such as `el`, `ea`, `acela` without a noun;
- fuzzy semantic entity matching;
- long-term entity memory;
- autonomous cross-module plans;
- hidden multi-step action chaining;
- Finance write actions.

These remain separate future milestones.

## Release acceptance

Before merge:
- changed-file lint;
- full lint;
- TypeScript;
- Intelligence Core tests;
- Agent Action tests;
- Conversation Memory tests;
- Context Follow-up tests;
- Selective Language tests;
- Entity Context tests;
- security/billing/legal/order regressions;
- performance/data/SEO regressions;
- production Next.js build;
- Architecture Guard;
- Vercel production success.
