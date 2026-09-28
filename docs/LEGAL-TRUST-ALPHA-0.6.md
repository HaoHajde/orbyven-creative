# ORBYVEN Legal & Trust — internal Alpha 0.6 draft

## Deployment boundary

This feature branch intentionally does not touch main, live Supabase or Vercel. Before any release:
1. Reconcile the existing database migration history (live currently includes migrations not present in repository). Available Supabase projects include ORBYVEN and a separate unrelated project; **no verified ORBYVEN staging project exists**. Never use the unrelated project as test storage.
2. Apply `20260925144000_legal_trust_foundation.sql` and then `20260927181500_billing_order_evidence.sql` to a dedicated controlled ORBYVEN staging database using the Supabase migration workflow; verify RLS, grants, triggers and rollback/restore.
3. Run npm run validate; test access as platform owner/admin and deny ordinary client/support/anonymous roles. Run Stripe **test mode** for published-price match/mismatch, duplicate/reordered/webhook retry, same-org evidence linkage, customer details, failed session, blocked post-completion mutation and unfinished checkout.
4. Confirm final merge/deployment and migration sequence as a separate release decision.

## What this actually implements

- **Contracts**: Control Center `/control-center/legal` lists real `billing_terms_acceptances` and subscription snapshots for one selected organization, and optionally registers immutable SHA-256-anchored references to other documents. It **does not** claim manual registration proves signature, identity, acceptance, consent or content authenticity; originals must live in a verified private archive. Duplicate hash/type/org entries are rejected. Historic merchant snapshot is recorded from server config when present, not backfilled on old acceptances.
- **Privacy requests**: Internal-only cases for an ORBYVEN-controlled purpose (org null), or one client organization (processor vs controller **must be assessed**, defaults to undetermined). No raw ID card or email is required in the registry; use pseudonymous reference and secure contact records kept elsewhere. Request type, received time, initial calendar-month deadline, staff state changes and notes are recorded. A DB trigger writes immutable events. Manual response, extension notification, export and erasure are **not automated**; no worker impersonates tenant instructions.
- **Staff authorization**: Existing Control Center bearer-token auth and platform_owner/platform_admin check; Supabase service-role **server only**; DB tables RLS-enabled with no anon/authenticated policies or grants. No public GDPR request endpoint and no bypass of client RLS.
- **Workflow**: received -> identity_check OR triage -> in_progress -> responded -> closed, with response/closure requiring documented action. Received dates, initial deadlines and original case scope cannot be altered after insert.

## Operational caveats

- One-month baseline is NOT an absolute deadline determination for all roles/requests; art. 12(3) may permit extension with a timely notice and reasons. Case handler must verify identity only when proportionate, assess actual controller/processor, legal holds, and provide response through appropriate secure channel.
- Storing a hash/reference does not verify the file is in Storage; implementation deliberately avoids untrusted uploads and public document links. A future signed-document workflow should verify the private file and capture a document version/content hash at the actual acceptance moment.
- New checkout attempts freeze a **B2B order offer snapshot**: displayed plan/price/period/tax label, Stripe price ID/price tax behavior, commitment, enabled modules, exact checkbox acknowledgement, legal version/paths, legal merchant, actor/organization, acceptance references, time and stable SHA-256 over canonical JSON. In the verified Stripe completion webhook, the provider's final charge/tax/discount, mode, session ID, payment status and buyer/billing identity (when provided) are added without altering the accepted offer. Historical orders are **not** backfilled from current prices or identities. This is not a hash of the full legal-document content, a digital signature, proof of email delivery, a tax invoice, or proof that an `unpaid` checkout has been collected.
- The UI lists max 100 records per category and max 500 organizations. Pagination, retention/legal-hold automation, DSAR export/delete, AI publish audit, verified media rights and B2C checkout are separate stages.
- GDPR art. 28 processor relationships require documented controller instructions; do not delete client data simply because a person requests it from ORBYVEN.

Sources: GDPR https://eur-lex.europa.eu/eli/reg/2016/679/oj (arts. 12, 15–22, 28, 32–34).

## Order evidence boundaries

- `billing_order_evidence` is written by the server only, with an immutable accepted offer and immutable verified checkout outcome once completed. It links the actual `billing_terms_acceptances` rows. The registrar API requires verified platform staff for viewing.
- Before recording acceptance, the server compares the configured Stripe Price against the published RON price, active flag, test/live mode, billing interval, quantity scheme and tax behavior. A missing tax label or exclusive tax mismatch blocks checkout. Promotion codes are disabled until a separate discounted-price disclosure can be designed.
- A verified `checkout.session.completed` event captures actual checkout totals, Stripe payment status, customer reference, and buyer details actually supplied. `checkout_completed` means the customer finished the provider's checkout, **not that the invoice is fiscally issued or payment necessarily settled**.
- A failed request leaves an `accepted` or `checkout_failed` record for investigation. If Stripe completes before the API stores its session ID, the signed webhook wins and the API checks the matching ID before returning a URL.
- No migration or billing feature in this PR is applied to live Supabase. Checkout remains paused under existing business/legal activation gates.
