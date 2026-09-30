# ORBYVEN onboarding security hardening — 30 September 2026

The public `bootstrap_organization` RPC remains `SECURITY DEFINER` intentionally because a new authenticated user has no tenant membership yet and therefore cannot create the first organization/member rows through ordinary tenant RLS.

This checkpoint adds two abuse/integrity boundaries without changing the onboarding contract:

- a transaction-scoped advisory lock keyed by `auth.uid()`, so concurrent bootstrap requests from the same user cannot both pass the no-membership check and create duplicate organizations;
- a hard upper bound of 32 requested module identifiers before the caller-controlled array is unnested.

The function continues to validate organization name/slug, filters modules through the fixed allow-list, requires authentication, refuses users who already belong to an organization, and exposes EXECUTE only to `authenticated` (not `anon` or `public`).

The Supabase advisor may still report the authenticated `SECURITY DEFINER` RPC. That finding is expected for this bootstrap architecture; removing definer semantics without redesigning the first-tenant provisioning model would make onboarding fail under tenant RLS. Treat the warning as intentional and review this function whenever its body or grants change.
