# ORBYVEN Security Hardening II — release gate (25.09.2026)

**Current state:** code + migrations staged on `security/alpha-05-hardening-ii`, rebased/advanced to Alpha 0.6 `77ef2b8` before changes. **No production SQL and no Vercel deployment** from this security branch until the coordinated release with code + legal chats. The branch name is historical; its actual base is Alpha 0.6.

## Implemented in this branch

- Finance read/write on `finance_expenses` and `finance_budget_entries`: owner/admin/manager only via restrictive RLS, composed with existing active-tenant and paid-entitlement checks. Neither `member` nor `viewer` can retrieve company-wide financial rows even by direct Supabase API calls.
- Overview does not query/show company expenses to member/viewer; Expenses module shows a compact permission message, keeping the Alpha 0.6 UI/layout unchanged.
- Public project requests: server-side 12 attempts/IP/hour distributed Postgres quota; HMAC-SHA256 IP fingerprint, no raw address in new table; 48-hour cleanup, RLS, service-role-only claim function. Missing secret/service-role/IP/database migration fails closed (submission unavailable) rather than quietly removing protection.
- Existing direct `submit_project_request` anonymous RPC remains exposed on purpose for compatibility and continues to enforce email throttling; this path does NOT inherit Next.js IP limits. Enable Vercel Firewall and consider a direct-RPC abuse boundary or migration to a server-only gateway for public launch.
- Operator-only webhook health/recovery endpoint, `/api/admin/billing/webhook-recovery`: GET for platform owner/admin, POST only platform owner. Requires explicit provider-state review, aged pending record, audit log and conditional transition to retryable. Never automatically triggers fiscal issuance or a Stripe replay.
- Browser-side leading-byte validation for common PDF/image/Office signatures in addition to existing Storage MIME and size policy. **Not malware scanning**: add trusted server-side AV/quarantine before allowing untrusted customer attachments to be shared or downloaded commercially.
- Offline regression tests including file signatures and static security boundaries, plus a read-only two-tenant test script for staging after migration.

## Required release sequence

1. Synchronize this branch with the latest `main` and confirm none of the legal/UI/workspace changes were overwritten. Keep Vercel branch auto-deploy disabled.
2. Set encrypted `ORBYVEN_REQUEST_RATE_LIMIT_SECRET` (32+ random characters) and `SUPABASE_SERVICE_ROLE_KEY` on all target Vercel environments BEFORE exposing the new route. Do not commit actual values.
3. Apply `20260925152000_security_hardening_ii_finance_ip_quota.sql` to a separate Supabase staging project, run the read-only tenant test and negative finance-member tests, then apply the exact migration to production before the coordinated app deployment. No invented migration-history entries.
4. Confirm `/api/project-requests` accepts valid JSON, returns 429 after quota, 503/500 on missing config, and email limits still work through the public RPC. Vercel overwrites `x-forwarded-for` on its normal ingress; verify trusted proxy setup if one is introduced.
5. Test owner/admin/manager finance access, member/viewer denial, suspension, entitlement downgrade, signed URL and cross-tenant access with two authenticated test accounts. Existing demo owners alone do not prove member denial.
6. For a stale Stripe event, operator first reconciles real Stripe/subscription/invoice state, then POSTs review flag; manually resend with Stripe only after checking external side effects. A state transition is NOT a fully automatic or exactly-once financial queue.
7. Run GitHub CI/Quality Gate, `npm run validate`, manual desktop/mobile + admin smoke tests. Then a single coordinated `main` merge/deploy. Preserve the previous production commit as rollback point.

## Still requires external owner settings

- GitHub `main` branch protection + required checks (admin permission).
- Supabase Auth breached-password protection and MFA policy for privileged accounts.
- Vercel access reauthorization for environment/deployment/log inspection, WAF/bot rules, and production verification.
- Actual AV/quarantine provider, periodic event monitoring and Stripe/Oblio end-to-end test mode.

No claim of legal/commercial launch certification is made by this technical checkpoint.
