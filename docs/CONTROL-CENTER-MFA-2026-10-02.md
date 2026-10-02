# Control Center MFA enforcement — 2 October 2026

ORBYVEN Control Center now requires an AAL2 Supabase Auth session for every authorized internal request.

## Server boundary

`authorizeControlCenter()` first validates the bearer token and confirms that the user is either enabled in `platform_staff` or explicitly present in the temporary server-side allowlist. Only after that authorization succeeds does the server require `getAuthenticatorAssuranceLevel(token).currentLevel === "aal2"`.

This protects every Control Center route that already uses `authorizeControlCenter()`, including privileged billing recovery endpoints.

## Login flow

The internal login page handles the `mfa_required` response without signing the authorized user out:

- if a verified TOTP factor already exists, the user is challenged for its current code;
- if no verified factor exists, the user is enrolled in a new TOTP factor and receives the secret for an authenticator app;
- `challengeAndVerify` promotes the current Supabase session to AAL2;
- the Control Center API is called again with the refreshed access token before navigation is allowed.

Normal client workspaces are not affected by this policy.

## Operational note

There are currently no enabled rows in `platform_staff`; this is the safest point to enforce MFA before the first permanent internal staff account is activated. The temporary environment allowlist is also subject to the same AAL2 requirement.

Leaked-password protection remains a separate Supabase Auth project setting and must still be enabled in the Supabase Dashboard/Management API when administrative access is available.


## Database defense-in-depth

Migration `20261002075203_platform_staff_mfa_guard.sql` adds a fail-closed trigger on `public.platform_staff`. An internal staff row cannot be enabled unless the target user already owns at least one `auth.mfa_factors` record with `status = 'verified'`.

The trigger is implemented by a private `SECURITY DEFINER` function with an empty `search_path`, and direct execution is revoked from `public`, `anon`, and `authenticated`.

Live verification after migration: trigger present, guard function present, 0 active staff, 0 enabled staff without verified MFA.
