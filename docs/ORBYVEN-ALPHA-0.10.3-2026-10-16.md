# ORBYVEN Alpha 0.10.3 — 2026-10-16

Assessed product head: `3ad2fe488b84507757704795df6dc931baf0080c`
Previous assessed product head: `6ac9800e9a553a8bf261066ede4362a76560d498`
Previous release: **Alpha 0.10.2**

## Release classification

**Patch release.** Main is 7 commits ahead of the previous assessed product head. The material changes are security/integrity hardening and incremental public-navigation UX fixes. No major product capability, architecture milestone, module expansion or AI milestone landed, so the version advances only from **0.10.2 to 0.10.3**.

## Confirmed on main
- private SECURITY DEFINER trigger execution boundaries hardened via Supabase migration;
- browser response headers strengthened in `next.config.ts`;
- security regression coverage added for private trigger boundaries and web headers;
- floating chapter/header navigation behavior synchronized while scrolling;
- active chapter moved into the header slot while scrolling;
- WarpMenu quality-gate lint regression fixed.

## Unchanged product areas
No material main-branch capability change was identified in this delta for Core/Modules, AI/Intelligence, Legal/Billing, SEO content/metadata, or Windows/Desktop. Public UX changed incrementally but does not constitute a new product milestone.

## Deployment / QA evidence
- GitHub commit status for assessed head `3ad2fe48...`: Vercel **SUCCESS**.
- ORBYVEN Integration Train for assessed head: **SUCCESS**.
- ORBYVEN Quality Gate for assessed head: **SUCCESS**.
- Exact production-domain alias mapping cannot be independently asserted because the connected Vercel context currently exposes no teams/projects.

## Readiness
- Core / Modules: 97%
- AI / Intelligence: 95%
- Security: 99%
- Legal / Billing: 91%
- SEO / Public: 96%
- Windows: 99%
- QA / Release confidence: 99%

These percentages are release-readiness estimates, not automated test-coverage figures.

## Boundary
Only changes merged to `main` are counted. Open PRs, draft branches and local-only work are not treated as released.

## Risks / backlog
- independently verify production alias/domain mapping;
- authenticated regression evidence across production-critical flows;
- Windows/iOS real-device smoke evidence;
- main branch is currently unprotected and has no required status checks enforced;
- maintain green CI/Quality Gate/Integration Train/application release workflows;
- integrate Architecture/Dashboard AI work only after it is ready and merged.

## Immediate roadmap

`0.10.3 → production alias verification → authenticated regression → Windows/iOS device smoke → enable appropriate branch protection/required checks → maintain green release gates → reconcile only ready Architecture/Dashboard AI work → stabilize 0.10.x`
