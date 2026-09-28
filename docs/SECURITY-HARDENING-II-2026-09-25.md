# ORBYVEN Security Hardening II — release gate (25.09.2026)

**Current state:** code + migrations staged on `security/alpha-05-hardening-ii`, reconciled with Alpha 0.7.1 `8f9a6b3` (plus the subsequent homepage lint fix). No live SQL or release until coordinated cutover. **No production SQL and no Vercel deployment** from this security branch until the coordinated release with code + legal chats. The branch name is historical; its actual base is Alpha 0.6.

## Implemented in this branch

- Finance read/write on `finance_expenses` and `finance_budget_entries`: owner/admin/manager only via restrictive RLS, composed with existing active-tenant and paid-entitlement checks. Neither `member` nor `viewer` can retrieve company-wide financial rows even by direct Supabase API calls.
- Overview does not query/show company expenses to member/viewer; Expenses module shows a compact permission message, keeping the Alpha 0.6 UI/layout unchanged.
- Public project requests: server-side 12 attempts/IP/hour distributed Postgres quota; HMAC-SHA256 IP fingerprint, no raw address in new table; 48-hour cleanup, RLS, service-role-only claim function. Missing service-role/IP/database migration fails closed (submission unavailable) rather than quietly removing protection. A dedicated HMAC secret is recommended; if unset, the existing server-only service-role key provides domain-separated HMAC signing.
- The direct `submit_project_request` RPC becomes service-role only in the FINAL post-deployment cutover migration `20260928165200_*`. Until that migration is applied, the anon RPC remains reachable and can bypass IP quotas; keep the cutover interval brief and monitor requests. Legacy `public.leads` anon INSERT remains an open contact-form abuse surface, but has a separate 3/email/hour SQL trigger; rotating email identities can still evade it, so WAF/CAPTCHA remains a later requirement.
- Operator-only webhook health/recovery endpoint, `/api/admin/billing/webhook-recovery`: GET for platform owner/admin, POST only platform owner. Requires explicit provider-state review, aged pending record, audit log and conditional transition to retryable. Never automatically triggers fiscal issuance or a Stripe replay.
- Browser-side leading-byte validation for common PDF/image/Office signatures in addition to existing Storage MIME and size policy. **Not malware scanning**: add trusted server-side AV/quarantine before allowing untrusted customer attachments to be shared or downloaded commercially.
- Offline regression tests including file signatures and static security boundaries, plus a read-only two-tenant test script for staging after migration.

## Required release sequence

1. Synchronize this branch with the latest `main` and confirm none of the legal/UI/workspace changes were overwritten. Keep Vercel branch auto-deploy disabled.
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` in the target Vercel environments. Set a dedicated encrypted `ORBYVEN_REQUEST_RATE_LIMIT_SECRET` (32+ random characters) if possible, otherwise the service key is used for domain-separated HMAC. Do not commit actual values.
3. On staging, apply `20260928140018_*` (finance/IP) and `20260928140022_*` (seven time-limited entitlements for each of the four existing pilot orgs). Test finance-member denial, a fresh organization without a subscription, pilot access and expired entitlement. Apply these first two to production BEFORE app deployment. Do not apply the server-only RPC cutover yet.
4. Deploy combined validated application commit ONCE. Confirm `/api/project-requests` accepts valid JSON, returns 429 after quota, 500 on missing service config, and email limits still work. Vercel overwrites `x-forwarded-for` on its normal ingress; verify trusted proxy setup if one is introduced. THEN apply `20260928165200_*` to revoke anonymous RPC. Verify anon/authenticated RPC returns permission denied while the application form still works.
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

Four currently recorded pilot organizations have explicitly seeded seven business-module entitlements through 30 June 2027, preserving the existing enabled module choices. Direct Storage document access is additionally restricted by the same entitlement condition. New self-service organizations get only Overview until platform staff issues a pilot/trial entitlement or a validated subscription; the workspace menu and toggle screen match this rule. A new tenant should receive a clear onboarding message before commercial signup goes live. This is a controlled alpha rollout, not automatic free-trial billing.

## Readiness boundary

The three-migration ordering is mandatory: (1) finance/IP quota, (2) pilot/paid enforcement, (3) server-only RPC cutover AFTER the new web deployment. Do not merge #98 independently of PR #97/#102/#104 while the shared release is being reviewed. Branch protection, Supabase breached-password protection and admin MFA still need privileged account settings; AV scanning remains unimplemented.

## Alpha 0.7.1 reconciliation

The original Security Hardening II included an older Overview fetch implementation. This integrated branch deliberately retains Alpha 0.7's exact SQL counts, paginated trends/current-month expense totals, one responsive search control and full performance test suite. Only the Expenses access guard, module-entitlement UI and server-side security changes are reapplied. Reconcile any future PR #104 authenticated QA changes before final release.

## Migration numbering

These additive SQL files use timestamps after the already applied 20260927152501 Alpha 0.6 material-catalog migration, avoiding a hidden old-timestamp migration in a post-Alpha 0.7 release. Historical production drift still requires a staging restore/verification; no invented records or reset.

## Cross-chat review — 27 September 2026

- PR #97 (Legal & Trust) and PR #102 (billing continuity) both modify billing checkout/webhooks, Stripe adapters, environment examples and npm scripts. Review their combined diff, invoice/merchant snapshot boundaries, migrations, and test-mode retries before a shared merge; neither is silently pulled into this security PR.
- PR #104 login-to-dashboard optimization has already entered main as Alpha 0.7.1. Preserve its auth page and search performance tests; the security branch adds only the module entitlement state and expense permission surface to the dashboard.
- The actual public homepage layout and carousel hydration fix are preserved from latest main, not copied from any old security tree.
- Preview-only and staging-only scope: a green GitHub build does not prove customer authentication, Stripe payment correctness, or runtime Vercel configuration.

## 28 September reconciliation

Security Hardening II is rebased conceptually on the current main that already contains SEO V3, Windows desktop UI parity, homepage preview fixes and the live Alpha 0.65 thermal planner. Those surfaces are inherited from main and are not replaced by security copies. The security SQL files are renumbered after the already-applied thermal migration to keep the release sequence explicit.

## Production pre-deploy migration result

On 28 September 2026 the first two pre-deploy migrations were applied successfully to ORBYVEN production and recorded by Supabase as versions 20260928140018 and 20260928140022. Post-checks found 28 active entitlement rows across the four expected pilot organizations, the finance restrictive guard, document Storage entitlement guard, legacy lead email throttle and service-role-only IP quota RPC. The final anonymous project-request RPC cutover was applied after the successful Vercel deployment and recorded by Supabase as version 20260928141201. `anon` and `authenticated` no longer have EXECUTE; `service_role` remains the only caller.

## Cutover signature hotfix

The first cutover attempt was rejected transactionally because only the COMMENT statement referenced a non-existent overload with ten text arguments instead of the real nine-text + two-boolean RPC signature. No privilege change persisted from the failed transaction. The corrected migration was then applied successfully as 20260928141201, and the static security suite now asserts all three function signatures use the exact RPC arity.
