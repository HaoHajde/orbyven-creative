# ORBYVEN anonymous surface hardening — 30 September 2026

A production privilege audit found that the only intentional anonymous RLS policy in the public schema is the legacy `leads` INSERT policy used by the public intake form. Several internal billing, organization and platform tables still inherited broad SQL grants for the `anon` role, but had no anonymous RLS policies, so RLS already denied row access.

This checkpoint removes `anon` grants from internal tables and also removes `authenticated` grants from server-only billing/platform/subscription tables that have no user RLS policies. Tenant organization tables keep authenticated access under their existing RLS. `public.leads` remains untouched.

It also hardens the generic `public.set_updated_at()` trigger helper by using an empty `search_path`, qualifying `pg_catalog.now()`, revoking the default PUBLIC/anon EXECUTE path, and keeping explicit execution for authenticated/service roles.

This change does not alter authenticated tenant policies, service-role access, public project-request routing, or the intentional legacy lead submission policy.
