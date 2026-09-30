# ORBYVEN anonymous surface hardening — 30 September 2026

A production privilege audit found that the only intentional anonymous RLS policy in the public schema is the legacy `leads` INSERT policy used by the public intake form. Several internal billing, organization and platform tables still inherited broad SQL grants for the `anon` role, but had no anonymous RLS policies, so RLS already denied row access.

This checkpoint removes those unnecessary table grants as defense-in-depth while leaving `public.leads` untouched.

It also hardens the generic `public.set_updated_at()` trigger helper by using an empty `search_path`, qualifying `pg_catalog.now()`, revoking the default PUBLIC/anon EXECUTE path, and keeping explicit execution for authenticated/service roles.

This change does not alter authenticated tenant policies, service-role access, public project-request routing, or the intentional legacy lead submission policy.
