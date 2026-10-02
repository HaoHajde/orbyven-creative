# Bootstrap module allowlist sync — 2 October 2026

The workspace onboarding UI uses the shared `ORBYVEN_MODULES` registry and can submit `inventory` and `thermal`. The production `bootstrap_organization` function still had the older eight-module allowlist, so those two selections were silently filtered during first-organization creation.

Migration `20261002072543_bootstrap_module_allowlist_sync.sql` adds `inventory` and `thermal` to the bounded SQL allowlist while preserving the existing security boundary:

- caller must be authenticated through `auth.uid()`;
- one organization per user is enforced during bootstrap;
- concurrent creation is serialized with an advisory transaction lock;
- module arrays remain bounded to 32 inputs and filtered to known IDs;
- `anon` cannot execute the RPC;
- `SECURITY DEFINER` uses an empty `search_path`;
- commercial access is not granted by this selection alone: module entitlements and restrictive RLS remain authoritative.

The Supabase advisor will continue to flag this function because authenticated users intentionally execute a `SECURITY DEFINER` RPC. That warning is accepted for this specific bootstrap primitive and must be revisited if the function begins doing anything beyond first-tenant provisioning.
