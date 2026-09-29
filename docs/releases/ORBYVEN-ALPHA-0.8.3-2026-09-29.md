# ORBYVEN Alpha 0.8.3 — Document Draft Agent Action

Date: 2026-09-29
Base: Alpha 0.8.2 — Estimate Draft Agent Action

## Scope

Alpha 0.8.3 extends the confirmed ORBYVEN Agent Actions boundary with private internal document draft creation.

### New confirmed action

- create Document Draft

Example:

`Creează document Raport intervenție; client: Exemplu SRL; lucrare: Revizie centrală; conținut: S-a verificat instalația și nu s-au identificat pierderi.`

The existing confirmation lifecycle remains unchanged:

1. user gives an explicit request;
2. deterministic parser creates a bounded proposal;
3. ORBYVEN previews the interpreted metadata;
4. user confirms or rejects;
5. one atomic proposal claim can execute the action;
6. a private text file is stored;
7. document metadata is linked to the workspace;
8. successful execution is mirrored to the platform audit log.

## Explicit-content rule

ORBYVEN 0.8.3 does not invent the body of a document.

The user must provide:
- title;
- explicit content.

Optional context:
- exact client name/company;
- exact work title;
- category;
- note.

Supported draft categories:
- general;
- contract;
- other.

## Storage

The created artifact is:
- private;
- stored in `orbyven-documents`;
- `text/plain`;
- stored below the authenticated organization path;
- registered in `ops_documents`;
- optionally linked to the exact same-tenant client and work.

If metadata insertion fails after storage upload, the uploaded object is removed to avoid orphan files.

## Draft/legal boundary

Every generated file begins with:

`ORBYVEN — DRAFT INTERN`

and explicitly states that it is unsigned and not automatically legally validated.

Alpha 0.8.3 does not:
- sign documents;
- apply a qualified electronic signature;
- claim eIDAS validity;
- create fiscal invoices;
- submit data to ANAF;
- certify legal correctness;
- generate a PDF automatically.

## Tenant and role boundaries

- proposal remains tied to one actor + one organization;
- Owner/Admin/Manager/Member mirror existing create permissions;
- Viewer remains read-only;
- Documents must be enabled and entitled both at proposal and execution time;
- client lookup is exact and same-tenant;
- work lookup is exact and same-tenant;
- work/client mismatch fails closed;
- user confirmation remains mandatory.

## Database alignment

Production migration already present in Supabase and now mirrored in Git:

`20260929152916_ai_document_draft_action.sql`

It only extends the allowed Agent Action proposal type list with:

`create_document_draft`

No new public write path is introduced.

## Not included yet

- AI-authored document body;
- remote LLM drafting;
- DOCX/PDF generation;
- signatures;
- document templates;
- autonomous multi-step action chains;
- Finance mutations.

Those features must reuse the same explicit confirmation, tenant, entitlement and audit boundary.

## Release acceptance

Before merge:
- changed-file lint;
- full lint;
- TypeScript;
- existing Agent Actions tests;
- Estimate Agent Action tests;
- Document Agent Action tests;
- billing/security/legal/order regressions;
- performance/data/SEO regressions;
- production Next.js build;
- Architecture Guard;
- Vercel success after merge.
