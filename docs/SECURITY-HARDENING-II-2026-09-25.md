# ORBYVEN Security Hardening II — release gate (25.09.2026)

**Current state:** code + migrations staged on `security/alpha-05-hardening-ii`, built on Alpha 0.6 `77ef2b8`. No live SQL or release until coordinated cutover. **No production SQL and no Vercel deployment** from this security branch until the coordinated release with code + legal chats. The branch name is historical; its actual base is Alpha 0.6.

## Implemented in this branch

- Finance read/write on `finance_expenses` and `finance_budget_entries`: owner/admin/manager only via restrictive RLS, composed with existing active-tenant and paid-entitlement checks. Neither `member` nor `viewer` can retrieve company-wide financial rows even by direct Supabase API calls.
- Overview does not query/show company expenses to member/viewer; Expenses module shows a compact permission message, keeping the Alpha 0.6 UI/layout unchanged.
- Public project requests: server-side 12 attempts/IP/hour distributed Postgres quota; HMAC-SHA256 IP fingerprint, no raw address in new table; 48-hour cleanup, RLS, service-role-only claim function. Missing service-role/IP/database migration fails closed (submission unavailable) rather than quietly removing protection. A dedicated HMAC secret is recommended; if unset, the existing server-only service-role key provides domain-separated HMAC signing.
- The direct `submit_project_request` RPC becomes service-role only in the FINAL post-deployment cutover migration `20260925153100_*`. Until that migration is applied, the anon RPC remains reachable and can bypass IP quotas; keep the cutover interval brief and monitor requests. Legacy `public.leads` anon INSERT remains a separate contact-form abuse surface.
- Operator-only webhook health/recovery endpoint, `/api/admin/billing/webhook-recovery`: GET for platform owner/admin, POST only platform owner. Requires explicit provider-state review, aged pending record, audit log and conditional transition to retryable. Never automatically triggers fiscal issuance or a Stripe replay.
- Browser-side leading-byte validation for common PDF/image/Office signatures in addition to existing Storage MIME and size policy. **Not malware scanning**: add trusted server-side AV/quarantine before allowing untrusted customer attachments to be shared or downloaded commercially.
- Offline regression tests including file signatures and static security boundaries, plus a read-only two-tenant test script for staging after migration.

## Required release sequence

1. Synchronize this branch with the latest `main` and confirm none of the legal/UI/workspace changes were overwritten. Keep Vercel branch auto-deploy disabled.
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` in the target Vercel environments. Set a dedicated encrypted `ORBYVEN_REQUEST_RATE_LIMIT_SECRET` (32+ random characters) if possible, otherwise the service key is used for domain-separated HMAC. Do not commit actual values.
3. On staging, apply `20260925152000_*` (finance/IP) and `20260925153000_*` (seven time-limited entitlements for each of the four existing pilot orgs). Test finance-member denial, a fresh organization without a subscription, pilot access and expired entitlement. Apply these first two to production BEFORE app deployment. Do not apply the server-only RPC cutover yet.
4. Deploy combined validated application commit ONCE. Confirm `/api/project-requests` accepts valid JSON, returns 429 after quota, 500 on missing service config, and email limits still work. Vercel overwrites `x-forwarded-for` on its normal ingress; verify trusted proxy setup if one is introduced. THEN apply `20260925153100_*` to revoke anonymous RPC. Verify anon/authenticated RPC returns permission denied while the application form still works.
5. Test owner/admin/manager finance access, member/viewer denial, suspension, entitlement downgrade, signed URL and cross-tenant access with two authenticated test accounts. Existing demo owners alone do not prove member denial.
6. For a stale Stripe event, operator first reconciles real Stripe/subscription/invoice state, then POSTs review flag; manually resend with Stripe only after checking external side effects. A state transition is NOT a fully automatic or exactly-once financial queue.
7. Run GitHub CI/Quality Gate, `npm run validate`, manual desktop/mobile + admin smoke tests. Then a single coordinated `main` merge/deploy. Preserve the previous production commit as rollback point.

## Still requires external owner settings

- GitHub `main` branch protection + required checks (admin permission).
- Supabase Auth breached-password protection and MFA policy for privileged accounts.
- Vercel access reauthorization for environment/deployment/log inspection, WAF/bot rules, and production verification.
- Actual AV/quarantine provider, periodic event monitoring and Stripe/Oblio end-to-end test mode.

No claim of legal/commercial launch certification is made by this technical checkpoint.

## Entitlement cutover guard

Four currently recorded pilot organizations have explicitly seeded seven business-module entitlements through 30 June 2027, preserving the existing enabled module choices. New self-service organizations get only Overview until platform staff issues a pilot/trial entitlement or a validated subscription; the workspace menu and toggle screen match this rule. A new tenant should receive a clear onboarding message before commercial signup goes live. This is a controlled alpha rollout, not automatic free-trial billing.

## Readiness boundary

The three-migration ordering is mandatory: (1) finance/IP quota, (2) pilot/paid enforcement, (3) server-only RPC cutover AFTER the new web deployment. Do not merge #98 independently of PR #97/#99 while the shared release is being reviewed. Branch protection, Supabase breached-password protection and admin MFA still need privileged account settings; AV scanning remains unimplemented.
