# ORBYVEN Alpha 0.8.3 — Document Draft Agent Action

Date: 2026-09-29
Base: Alpha 0.8.2 — Estimate Draft Agent Action

## Scope

Alpha 0.8.3 adds a controlled text-document draft action to ORBYVEN Intelligence.

### New confirmed action
- create private text document draft

The existing Agent Actions boundary remains unchanged:
prompt → bounded proposal → preview → explicit Confirm/Reject → one execution → audit.

## Explicit-content rule

ORBYVEN 0.8.3 does not invent document body text.
The user must provide:
- document title;
- explicit `conținut:`.

Optional context:
- category;
- client;
- work;
- estimate/deviz.

## Generated artifact

The confirmed action creates a private `.txt` file in the existing `orbyven-documents` bucket and a matching `ops_documents` record.

Every generated text file starts with:
- `DRAFT — ORBYVEN`
- `Necesită verificare înainte de utilizare.`

The bucket is private and already supports `text/plain`.

## Allowed categories

Generated drafts are restricted to:
- general;
- contract;
- estimate;
- other.

The parser refuses generated categories representing:
- invoice/factură;
- receipt/bon/chitanță;
- photo/media.

This release does not create fiscal documents.

## Context integrity

Context lookup is exact and same-tenant:
- client name/company;
- work title;
- estimate reference/title.

Existing client/work/estimate relationships are inherited when possible.
Context mismatches fail closed.

## Storage failure handling

Storage upload happens before metadata insert.
If `ops_documents` insert fails, ORBYVEN attempts to remove the uploaded object before returning failure.

## Permissions

Document creation mirrors existing module policy:
- Owner/Admin/Manager/Member can create when Documents is enabled and entitled;
- Viewer remains read-only.

The server re-checks module entitlement before execution.

## Not included yet

- generated DOCX/PDF;
- autonomous copy generation;
- legal/fiscal finalization;
- signatures;
- document sending;
- Finance mutations.

## Release acceptance

Before merge:
- lint;
- TypeScript;
- Agent Actions + document draft tests;
- billing/security/legal/order regressions;
- performance/data/SEO regressions;
- production build;
- Architecture Guard;
- Vercel success after merge.
