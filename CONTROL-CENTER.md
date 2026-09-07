# ORBYVEN — Control Center

## Purpose

Control Center is the **internal ORBYVEN platform administration surface**.

It is not the client workspace and it does not replace the existing `/admin` lead-management dashboard.

Audit result before choosing the route:

- `/admin` already manages public-site leads and uses its own existing flow;
- Control Center therefore lives at `/control-center`;
- internal login lives at `/control-center/login`;
- internal privileged API lives at `/api/control-center`.

## Ownership

Owned by **Chat 2 — Platform Core + Auth + Supabase + Onboarding + Control Center**.

Control Center may administer Platform Core data but must not implement business logic that belongs to Chat 1 or billing/legal logic that belongs to Chat 3.

## Canonical schema consumed

No new tenant model is introduced.

Control Center uses only:

- `organizations`
- `organization_members`
- `organization_profiles`
- `organization_modules`
- Supabase Auth users

Roles remain:

- `owner`
- `admin`
- `manager`
- `member`
- `viewer`

The module catalog is **consumed** from `lib/orbyven-modules.ts` (Chat 1 contract). Control Center does not own or redefine that registry.

## Internal authorization model

Control Center is intentionally stronger than normal tenant RLS access.

The browser authenticates with normal Supabase Auth. Every `/api/control-center` request sends the current access token. The server verifies the token and then checks an explicit ORBYVEN internal-admin allowlist.

Required server variables:

```text
SUPABASE_SERVICE_ROLE_KEY=...
ORBYVEN_CONTROL_CENTER_ADMIN_EMAILS=admin1@...,admin2@...
```

Alternative stable IDs may be used:

```text
ORBYVEN_CONTROL_CENTER_ADMIN_USER_IDS=<uuid>,<uuid>
```

Existing public variables remain required by the normal Supabase browser client:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

### Security rule

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It must never use a `NEXT_PUBLIC_` prefix, be returned by the API, or be imported into a client component.

If the service role or internal allowlist is missing, the Control Center API fails closed with HTTP 503.

## API contract

`GET /api/control-center`

Returns:

- organizations;
- organization profiles;
- members enriched with Auth email where available;
- module assignments/configuration;
- computed technical health;
- available Supabase Auth users for assignment;
- a placeholder entitlement snapshot owned by Chat 3.

`POST /api/control-center` uses an `action` field.

Current actions:

- `create_organization`
- `update_organization`
- `assign_member`
- `update_member_role`
- `remove_member`
- `set_modules`

These operations use the service-role client only after the requesting user passes the internal-admin allowlist.

## Control Center v1 capabilities

- list organizations;
- create organization + profile + initial module assignments;
- edit organization identity/profile;
- list Supabase Auth users;
- assign users to organizations;
- edit owner/admin/manager/member/viewer roles;
- remove organization membership;
- activate/deactivate portable modules;
- edit `organization_modules.settings` JSON;
- show tenant technical health;
- expose a reserved surface for subscription/plan/entitlements.

## Entitlements / Chat 3 boundary

`lib/orbyven-control-center-contracts.ts` defines:

```ts
{
  subscription_status: string | null;
  plan: string | null;
  entitlements: Record<string, boolean | string | number | null> | null;
}
```

Control Center currently returns `null` values with source `chat3-pending`.

Chat 3 should later provide these values through a provider/API compatible with this contract. Control Center must consume that provider instead of implementing Stripe or billing logic itself.

No Stripe integration, billing table, subscription mutation or payment logic is added by Control Center v1.

## Chat 1 boundary

Control Center can activate/configure module assignments, but it does **not** implement Leads, Tasks, Calendar, Estimates, Documents, Expenses or Team business logic.

Chat 1 consumes:

- current `organization_id`;
- role/membership;
- enabled module IDs;
- `organization_modules.settings` when a module needs configuration;
- the same RLS tenant contract.

## Technical health v1

Current health checks are deliberately Platform Core-only:

- organization profile exists;
- at least one membership exists;
- at least one owner exists;
- module assignment count;
- last configuration update;
- canonical RLS/workspace contract is expected.

Module-specific operational health belongs to Chat 1 and should be integrated later through explicit status providers rather than recreated in Control Center.

## Required acceptance flow

```text
ORBYVEN internal admin
  → create organization
  → assign existing Supabase Auth user
  → assign optional modules
  → user logs in at /workspace/login
  → workspace resolves organization through organization_members
  → user sees only data allowed by tenant RLS and only enabled modules
```

For a new client account, assign it to exactly one organization until a deliberate multi-organization workspace switcher is introduced.

## Infrastructure-change reporting

Every Platform Core task must report:

- branch;
- files modified;
- schema/API changes;
- contracts consumed by other chats;
- areas explicitly not modified;
- test/build status;
- PR.
