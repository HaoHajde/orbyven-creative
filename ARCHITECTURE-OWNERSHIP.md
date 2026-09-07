# ORBYVEN — Architecture Ownership

`main` is the single source of truth. Every major task starts from the latest `main`.

## Chat 1 — Modules / Client Experience
Owns portable module UI and business logic: Leads, Tasks, Calendar, Estimates, Documents, Expenses, Team.

Canonical module registry: `lib/orbyven-modules.ts`.

Does not own Auth, tenant infrastructure, billing, legal or public templates.

## Chat 2 — Platform Core / Backend / Integration
Owns Supabase, Auth, onboarding, tenant resolution, roles, RLS, organization context and ORBYVEN Control Center.

Canonical tenant model:
- `organizations`
- `organization_members`
- `organization_profiles`
- `organization_modules`

No parallel `/platform`, `organization_memberships` or duplicate module registry.

## Chat 3 — Legal / Billing / Commercial Access
Owns Stripe, subscription lifecycle, commercial entitlements, invoicing integration and legal/compliance surfaces.

Commercial identity is `organization_id`, never a single user account.

Billing must not be implemented inside portable modules.

## Chat 4 — Public Website / Templates / Marketing
Owns public website, templates, public demos, marketing UX, SEO and visual presentation.

Public demos use fictional/demo data and never access live tenant data.

## Integration rule
If a task requires functionality owned by another area, consume its documented contract. Do not create a second implementation.

Every PR should report:
`branch → files changed → schema/API changes → contracts consumed/exposed → tests/build status`.
