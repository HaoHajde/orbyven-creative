# ORBYVEN Alpha 0.10.0 — Daily Release Report

Date: 2026-10-04
Product baseline on main: `4aeb03ad5e93f58f75b7f0726ce4afff2bf2477f`
Previous persisted checkpoint baseline: `131eb407d461e98b6812079f6e9d9a86ab57bc43`
Version decision: minor bump `0.9.3 → 0.10.0`

## Decision

Main is 149 product commits ahead of the persisted 0.9.3 baseline and 0 behind. The accumulated changes constitute a genuine multi-area milestone: Web Design AI, inventory/procurement, lifecycle/aftercare, security/auth hardening, legal/offboarding, bilingual public/SEO surfaces, Desktop 0.8 and iOS 0.16. This is not a patch-only sync.

## Verified on main

### Modules / operations
- inventory reservations and reservation guards;
- procurement/finance bridge and work-readiness expansion;
- client lifecycle, retention and post-service growth;
- richer connected module flows across CRM, Tasks, Calendar, Documents, Expenses and Inventory.

### AI
- Web Design AI generative core and persistent draft/generation routes;
- verified Smart Interview fact/evidence-driven section planning;
- expanded generation context and quality/readiness layers.
- Dashboard AI 0.8.25 remains in open PRs and is not counted as released.

### Security
- workspace fan-out reads bound to validated Supabase JWT;
- official Supabase accessToken binding adopted;
- platform staff MFA and privileged AI RPC boundary hardening;
- bootstrap/authenticated-boundary hardening and password-policy coverage.

### Legal / billing
- organization data-export/offboarding foundations and immutable legal-audit retention are present on main;
- public checkout/billing flow received code changes.
Commercial/legal activation remains a separate external gate and is not inferred from code.

### SEO / public
- RO/EN public layer and English routes;
- language switcher, English SEO foundation, sitemap/robots/structured-data expansion;
- homepage seamless galaxy/luxury presentation refinements.

### Windows / iOS
- Windows Desktop package is **0.8.0**;
- iOS package is **0.16.0**, including editing-safe refresh/navigation and safe runtime update behavior.

## QA / deploy evidence

For product SHA `4aeb03ad5e93f58f75b7f0726ce4afff2bf2477f`:
- GitHub combined status: **Vercel success**;
- GitHub connector returned no workflow runs directly attached to this SHA;
- direct Vercel team/project enumeration still returns no accessible team, so the production alias cannot be independently proven through the Vercel API.

Boundary:
- main: confirmed;
- Vercel deployment status for SHA: success;
- exact production alias: not independently verified;
- open/draft PRs and local-only work: not released.

## Progress snapshot

Roadmap/readiness estimates, not automated test coverage:
- Core / Modules: **97%**
- AI / Intelligence: **95%**
- Security: **97%**
- Legal / Billing: **91%**
- SEO / Public: **95%**
- Windows: **97%**
- QA / Release confidence: **96%**

## Risks / backlog

- Dashboard AI 0.8.25 current-main integration remains open.
- Video AI remains open.
- Architecture Guard v7 remains open; current main does contain an architecture guard, but the v7 PR itself is not released.
- Design DNA orchestration remains open.
- Several older superseded/reconciliation PRs remain open and should be cleaned up.
- Direct Vercel production-alias verification remains unavailable through the connected scope.
- Real-device smoke tests remain important for Windows 0.8 and iOS 0.16.

## Immediate roadmap

`0.10.0 → verify production alias → full current-head regression evidence → Windows 0.8 / iOS 0.16 device smoke → reconcile Architecture Guard → review Dashboard AI 0.8.25 → stabilize 0.10.x`

Do not count any open PR as released until it lands on main.
