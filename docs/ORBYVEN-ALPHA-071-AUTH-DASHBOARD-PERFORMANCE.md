# ORBYVEN Alpha 0.7.1 — client entry-to-dashboard performance

## Permanent QA scope

Every future code/performance release must include the authenticated customer journey, not just the marketing routes:

1. Public pages: /, /templates and representative pilot pages.
2. Customer entry: /workspace/login, /workspace/register, /workspace/forgot-password, /workspace/reset-password, /workspace/auth/callback, /workspace/invite and /workspace/access.
3. Customer first-use: /workspace/onboarding, module enablement and navigation.
4. Authenticated dashboard: /workspace, Overview, global search, all enabled modules, mobile menu, light/dark theme and recoverable failure states.
5. Separate internal entry paths: /admin/login and /control-center/login; staff-only features must not be exposed in public QA artifacts.

## Changes in this PR

- Customer login and password recovery recover the form state if a network call **rejects**; login prevents a duplicate submission and preserves existing server-authoritative entry-path decisions. Invalid credentials do not reveal whether an account exists.
- The access-state page fails closed with a Retry action when backend verification errors instead of remaining stuck on a spinner. It never bypasses membership or organization state checks.
- The normal successful dashboard load no longer calls Supabase `auth.getUser()` twice; `getCurrentWorkspace()` already checks it. For a null workspace result, the client still rechecks auth to distinguish logged-out from signed-in/no-membership.
- The existing Lighthouse workflow now includes customer login/register/recovery and both internal login pages at mobile/desktop presets.
- A **separate, manual-only** authenticated browser smoke uses ephemeral Chrome sessions and a dedicated QA organization. It checks login-to-dashboard latency, one responsive search, mobile navigation, horizontal overflow and page script exceptions. No screenshot, trace, raw HTTP log, test data, password, token or user email is uploaded.

## How to enable authenticated QA safely

Create a dedicated, non-privileged test identity belonging to an organization with **synthetic data only**; never use a real customer or platform-admin account. In GitHub repo Settings → Secrets and variables → Actions set `ORBYVEN_QA_EMAIL` and `ORBYVEN_QA_PASSWORD`. Run Actions → **ORBYVEN Authenticated Workspace QA** → Run workflow on `main` after release. CI never runs this against untrusted pull-request code. The workflow fails with a setup message if secrets are missing and does not claim that authenticated QA ran.

This is a *smoke test*, not a substitute for the security team's separate multi-tenant/RLS checks. Login, billing and role restrictions remain governed by their existing controls.

## What is and is not measured

Lighthouse tests on the local production build cover **unauthenticated public/entry pages**, not the genuine signed-in dashboard, callback exchange, onboarding or password reset links. Login pages can be measured without submitting a password, but functional auth and authorized dashboard performance require the dedicated QA account. Browser QA reports click-to-dashboard wall time for a synthetic account, not a real-user Web Vitals percentile or exact speedup. Compare consistent devices and network settings across releases.

## Integration protocol

At the time of this branch, main was Alpha 0.7 `a7b99551c360ed2a22a5cfd6c208aeac8c25f53a`. Security PR #98 also touches `components/ClientWorkspace.tsx` and `lib/orbyven-workspace.ts` for module entitlements. Reconcile its entitlement gate with the one-request dashboard optimization here; do not merge an old `ClientWorkspace` over either set of changes. Legal PR #97 and billing PR #102 retain ownership of their own flows. No database migration or policy change is included here.
