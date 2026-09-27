# ORBYVEN — Legal & Trust integration, Alpha 0.7 (draft, NO RELEASE)

## Branch & ownership

The legal integration branch reconciles:
- Alpha 0.7 main (Overview/search/performance)
- PR #102 billing continuity: issuer-scoped Stripe customers, archived merchant webhook secret/portal, idempotent retry fencing and fiscal reconciliation
- PR #97 Legal & Trust: contract/acceptance dossier, privacy request register, immutable accepted-order evidence
- New tenant offboarding: owner request, human staff authorization, bounded organization-scoped JSON package, immutable SHA-256, retention-review case and documented closeout

Both PRs remain DRAFT until code ownership, migration and legal readiness have been checked together. PR #102 changes are included for compatibility, not as authorization to charge customers. Do not overwrite Security PR #98.

## Migration order and staging stop

Supabase ORBYVEN production has 24 recorded migrations as of the read-only audit, including alpha06_material_catalog_revisions. The repository and production migration history are not an exact version-for-version baseline. Do not reset migrations or replay historical filenames. There is no verified ORBYVEN development branch; an unrelated Supabase project is not staging.

Required dedicated ORBYVEN development branch or confirmed staging project BEFORE production release:
1. Reconcile database migration history.
2. Apply the three Legal & Trust migrations and PR #102 merchant-routing migration in verified dependency order: legal_trust_foundation, billing_order_evidence, billing_merchant_routing_and_webhook_recovery, organization_offboarding. The archive needs merchant tables.
3. Verify service-role-only RLS, denied anon/authenticated access to internal registers, status transitions, append-only triggers, foreign-key checks and two-organization isolation.
4. Stripe TEST mode: current/archived merchant signatures, customer scoping, stale event retries, final order evidence, issuer cutover, and amount/tax mismatch rejection.
5. Browser QA authenticated as tenant owner and manager; platform owner/admin vs support, mobile, failed export, size limits, repeat archive retrieval.
6. Approve a single coordinated production release only after review. Commercial checkout remains blocked by the existing legal/fiscal gates.

If a Supabase development branch entails cost, disclose it and obtain user confirmation before creating it. No development branch or live schema mutation was performed for this legal code branch.

## Owner-requested offboarding

- Tenant owner opens /workspace/data-export, creates an export case and tracks status.
- Platform owner/admin explicitly authorizes at /control-center/legal.
- Owner downloads bearer-authenticated JSON scoped to a single organization. It includes organization metadata and allowlisted tenant database records: module/member/CRM/task/calendar/commercial/financial/billing/merchant/manual-contract.
- Each table uses organization_id; above 2,000 records/table or 8 MiB total, the route FAILS instead of returning a partial dataset.
- On generation record SHA-256, actor, timestamp and append-only event. HTTP transmission does NOT prove delivery; status is package_generated. Repeat download recomputes identical checksum; if tenant data changed, arrange a new case.
- Binary Storage documents/photos, Auth credentials, platform incident logs, payment methods, external providers and backups are NOT included. Transfer/verify these separately.
- Staff reviews retention/legal holds/accounting, document handover, delivery confirmation, Storage, backup and subprocessors, then closes with explicit reference. No automatic DELETE, subscription cancellation, invoice cancellation, email confirmation or fabricated GDPR compliance.
- An organization can request another case only after its previous case is closed.

## Checkout compatibility

Accepted B2B offer and merchant identity remain immutable; Stripe session embeds order_evidence_id and price ID. Merchant-scoped billing_merchant_customers replaces unscoped billing_accounts for new checkouts. PR #102 signed-merchant webhook verification and retry leases are retained. Historic test/live mode is anchored to the accepted Stripe offer snapshot, not the current merchant environment.

## Still outside the scope

Legal approval of controller/processor roles, DPA and retention policy; Storage transfer/verified receipt; cross-system or backup deletion; fiscal issuance/live Stripe; B2C invitation checkout; unverified media rights; full production authenticated end-to-end verification.

Reference: GDPR Articles 12, 15–22, 28, 32–34: https://eur-lex.europa.eu/eli/reg/2016/679/oj .
