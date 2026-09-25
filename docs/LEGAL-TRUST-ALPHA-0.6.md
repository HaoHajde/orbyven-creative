# ORBYVEN Legal & Trust — internal Alpha 0.6 draft

## Deployment boundary

This feature branch intentionally does not touch main, live Supabase or Vercel. Before any release:
1. Reconcile the existing database migration history (live currently includes migrations not present in repository).
2. Apply \`20260925144000_legal_trust_foundation.sql\` to controlled staging using the Supabase migration workflow; verify RLS, grants, triggers and rollback/restore.
3. Run npm run validate; test access as platform owner/admin and deny ordinary client/support/anonymous roles.
4. Confirm final merge/deployment and migration sequence as a separate release decision.

## What this actually implements

- **Contracts**: Control Center \`/control-center/legal\` lists real \`billing_terms_acceptances\` and subscription snapshots for one selected organization, and optionally registers immutable SHA-256-anchored references to other documents. It **does not** claim manual registration proves signature, identity, acceptance, consent or content authenticity; originals must live in a verified private archive. Duplicate hash/type/org entries are rejected. Historic merchant snapshot is recorded from server config when present, not backfilled on old acceptances.
- **Privacy requests**: Internal-only cases for an ORBYVEN-controlled purpose (org null), or one client organization (processor vs controller **must be assessed**, defaults to undetermined). No raw ID card or email is required in the registry; use pseudonymous reference and secure contact records kept elsewhere. Request type, received time, initial calendar-month deadline, staff state changes and notes are recorded. A DB trigger writes immutable events. Manual response, extension notification, export and erasure are **not automated**; no worker impersonates tenant instructions.
- **Staff authorization**: Existing Control Center bearer-token auth and platform_owner/platform_admin check; Supabase service-role **server only**; DB tables RLS-enabled with no anon/authenticated policies or grants. No public GDPR request endpoint and no bypass of client RLS.
- **Workflow**: received -> identity_check OR triage -> in_progress -> responded -> closed, with response/closure requiring documented action. Received dates, initial deadlines and original case scope cannot be altered after insert.

## Operational caveats

- One-month baseline is NOT an absolute deadline determination for all roles/requests; art. 12(3) may permit extension with a timely notice and reasons. Case handler must verify identity only when proportionate, assess actual controller/processor, legal holds, and provide response through appropriate secure channel.
- Storing a hash/reference does not verify the file is in Storage; implementation deliberately avoids untrusted uploads and public document links. A future signed-document workflow should verify the private file and capture a document version/content hash at the actual acceptance moment.
- Existing checkout stores a legal-document version and acceptance time but not a frozen plan price/complete order form in the acceptance row. Contract dossier surfaces what actually exists; do not claim historical price/contract proof it cannot establish.
- The UI lists max 100 records per category and max 500 organizations. Pagination, retention/legal-hold automation, DSAR export/delete, AI publish audit, verified media rights and B2C checkout are separate stages.
- GDPR art. 28 processor relationships require documented controller instructions; do not delete client data simply because a person requests it from ORBYVEN.

Sources: GDPR https://eur-lex.europa.eu/eli/reg/2016/679/oj (arts. 12, 15–22, 28, 32–34).
