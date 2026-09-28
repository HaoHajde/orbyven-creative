# ORBYVEN Alpha 0.7 consolidation — coordinated release gate (27.09.2026)

This is a staged application integration; the additive database foundation below has now been applied to the ORBYVEN Supabase project, while the consolidated application PR remains unmerged.
- security PR #98: finance RLS, controlled pilot entitlements, service-side project-request quota, signed-file precheck and owner-reviewed webhook recovery;
- Legal & Trust PR #97: staff-only contract evidence + privacy case ledger, immutable B2B offer/Stripe checkout evidence;
- billing PR #102: current/archived PFA→SRL customer account isolation and fiscal SPV idempotency;
- dashboard PR #104: login/access resilience, authenticated QA and CI including business modules.

The selected files were based on Alpha 0.7 main, not used to wholesale overwrite newer Overview, estimate/material, search or portal features. ClientWorkspace composes module entitlement checks with the one-call auth improvement; WorkspaceContent enforces finance role boundaries. Billing checkout stores issuer-scoped terms and a price-verified, signed-content-hash offer prior to creating a Stripe session; a verified webhook anchors final provider data to this snapshot.

## Production state after database hardening

The Legal & Trust tables, order-evidence table, merchant-scoped billing customer table, webhook recovery columns and advisor-requested foreign-key indexes are applied. The project-request server-only cutover is also applied. Keep `ORBYVEN_BILLING_ENABLED=false`, `ORBYVEN_COMMERCIAL_CHECKOUT_PAUSED=true` and `ORBYVEN_OBLIO_ENABLED=false`. No legal entity is presumed, no payment/subscription migration is automated, and no consumer checkout is activated.

### Database sequencing (required)

The additive production database steps below were applied only after confirming zero subscriptions, zero invoices and zero pending billing webhooks. A separate unrelated Supabase project was not repurposed as staging. Future destructive/schema-contract changes still require a dedicated branch/staging environment.

1. Completed for additive production hardening: migration history was checked and live billing tables were empty. A read-only cross-tenant owner test passed. Full Member/Viewer/Manager role-fixture QA remains a staging requirement.
2. Applied/validated database foundation:
   - `20260928165933_legal_trust_foundation_alpha071.sql` (internal evidence, DSAR register),
   - `20260927164000_security_hardening_ii_finance_ip_quota.sql` (finance restrictive RLS, distributed request quota),
   - `20260927164100_pilot_entitlements_private_requests.sql` (explicit existing pilot grants, tenant/storage enforcement),
   - `20260928165937_billing_order_evidence_alpha071.sql` (immutable B2B order snapshot),
   - `20260928165941_billing_merchant_routing_webhook_recovery_alpha071.sql` (Stripe merchant customers + webhook leases).
3. Completed: finance/IP hardening, pilot entitlement controls, Legal & Trust, B2B order evidence, merchant routing/webhook recovery, `20260928165945_created_by_fk_indexes_alpha071.sql`, and `20260928170136_legal_billing_fk_indexes_alpha071.sql` are applied.
4. Pending: merge/deploy the SINGLE combined application commit only after CI remains green. Configure a server-only `ORBYVEN_REQUEST_RATE_LIMIT_SECRET` or verify the documented service-role fallback and trusted ingress-IP handling.
5. Completed: `20260928165945_created_by_fk_indexes_alpha071.sql` and `20260928170136_legal_billing_fk_indexes_alpha071.sql` removed all current unindexed-FK advisor findings.
6. Completed by the security cutover: direct `submit_project_request` execution is revoked for `anon`/ordinary authenticated callers; the advisor warning is gone.
7. Test finance owner/admin/manager access and member/viewer denial through authenticated Supabase REST/RLS, cross-tenant read/write denial, pilot-expired modules and document Storage, authenticated login→dashboard, internal legal page, Stripe test invoice recovery and Oblio SPV failure. Keep live billing OFF.
8. Set protections: GitHub `main` required CI/Quality/Architecture checks, Supabase Auth leaked-password protection and privileged MFA; verify Vercel scope access and runtime errors before any production readiness claim.

## Open external/commercial gates

- Original ANPC SAL pictogram; valid rights/licences for third-party florist/wedding/other pilot photographs and music.
- Final PFA legal clearance, CAEN/accountant review, B2B/B2C documents, real processor/DPA and Stripe/Oblio configurations.
- External service-role key remains secret; browser/client never receives it. Signed file headers do not amount to malware scanning/quarantine.
- Operator-approved webhook retry does not itself redeliver Stripe or trigger fiscal issuance; Stripe provider event redelivery and Oblio reconciliation remain human-controlled.
- Real authenticated dashboard smoke requires dedicated synthetic QA credentials and manual opt-in; an Actions workflow succeeding without that run cannot prove real client login.

## Rollback

If the new web code or RPC gate fails, restore last deployed app commit while maintaining DB additive tables/policies only if role checks allow it; do not casually undo the final public-RPC revoke while the old web code remains. For any rollback across the RPC change, coordinate the old/new project-request API path and rate-limit controls before changing the database.
