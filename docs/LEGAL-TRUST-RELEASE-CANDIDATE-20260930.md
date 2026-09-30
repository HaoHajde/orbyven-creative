# ORBYVEN Legal & Trust — release candidate 2026-09-30

This branch extends the Legal & Trust foundation already present in current main. It does not activate production billing or perform automatic erasure.

## Current-main facts

- Legal contract and privacy-request code is already present in main.
- B2B immutable order evidence and merchant-scoped Stripe continuity are already present in main.
- Production Supabase has not yet applied the repository Legal/Order/Merchant migrations.
- Billing already links to /workspace/data-export, while current main lacks that route/page; this release closes that gap.
- The immutable order snapshot now records Stripe livemode explicitly because webhook verification already relies on snapshot.stripe_livemode.

## Offboarding scope

Tenant owner may request an export; platform owner/admin must authorize it. The generated JSON is organization-scoped, size-bounded and SHA-256 anchored. It includes current business data such as CRM, tasks, calendar/resources, estimates, finance, documents, materials, inventory/procurement, thermal plans and user-facing AI conversations/proposals.

It deliberately excludes Auth credentials/sessions, platform/security audit data, raw Stripe webhooks/payment methods, AI provider telemetry/usage counters, push-device tokens, Storage binary bytes, backups and third-party archives. Those require separate human review and transfer.

Generation is not proof of delivery. Retention review and closure remain documented manual actions. No database delete, subscription cancellation, invoice cancellation or legal-compliance certification is automated.

## Staging sequence

1. Dedicated Supabase development branch based on ORBYVEN production.
2. Apply repository migrations in order:
   - 20260928165933 legal_trust_foundation_alpha071
   - 20260928165937 billing_order_evidence_alpha071
   - 20260928165941 billing_merchant_routing_webhook_recovery_alpha071
   - 20260930210500 organization_offboarding_release
3. Verify RLS/grants, trigger immutability, valid/invalid state transitions and cross-tenant denial.
4. Run Stripe test-mode acceptance/session/webhook checks.
5. Authenticated browser QA for owner vs member and platform owner/admin.
6. Only then consider production migration and release.

External legal/accounting/employment-status approvals remain separate release gates.
