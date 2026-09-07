# ORBYVEN Platform Core v2 — Auth, Provisioning & Operations

## Coordination

This work belongs to Chat 2: Platform Core + Auth + Supabase + Onboarding + Control Center.

It was re-synced onto the latest `main` after Chat 1 Tasks, Chat 3 Billing/Entitlements and Chat 4 public/template work landed. It does not merge or recreate those domains.

It does **not** implement:

- module business logic owned by Chat 1;
- billing, Stripe, subscription rules or legal/GDPR flows owned by Chat 3;
- public website/templates owned by Chat 4.

## Why this change exists

ORBYVEN needs a production-like client lifecycle where a customer can either register themselves or be provisioned by ORBYVEN without manual database work.

Target client experience:

```text
self-service
register -> confirm email -> onboarding -> workspace

ORBYVEN provisioned
Control Center -> invite email -> set password -> workspace

returning user
workspace/login -> persistent Supabase session -> correct tenant route
```

## New client auth routes

- `/workspace/register`
- `/workspace/forgot-password`
- `/workspace/reset-password`
- `/workspace/invite`
- `/workspace/auth/callback`
- `/workspace/access`

`/workspace/login` is updated to expose registration and password recovery while preserving the existing Supabase authentication contract.

Supabase JS keeps browser sessions persisted by default, so a returning authenticated user can be routed directly to the correct workspace state.

## Workspace entry state

Migration `20260907133000_platform_core_auth_provisioning_v2.sql` adds `public.workspace_entry_state()`.

Possible states:

- `login`
- `onboarding`
- `workspace`
- `member_suspended`
- `organization_provisioning`
- `organization_suspended`
- `organization_archived`

`lib/orbyven-workspace.ts` maps those states to `/workspace/login`, `/workspace/onboarding`, `/workspace`, or `/workspace/access`.

A backward-compatible fallback remains in the client helper during sequential rollout if the RPC has not reached the database yet.

## Canonical schema changes

The canonical tenant model remains exactly:

- `organizations`
- `organization_members`
- `organization_profiles`
- `organization_modules`

No duplicate tenant registry is introduced.

Platform Core extends the canonical tables with technical lifecycle fields:

### `organizations.lifecycle_status`

- `provisioning`
- `active`
- `suspended`
- `archived`

This is a **technical platform state**, not a billing/subscription state.

### `organization_members.access_status`

- `active`
- `suspended`

`organization_members.updated_at` is also added for operational visibility.

## RLS compatibility

`private.is_org_member()` and `private.is_org_admin()` are hardened so they return true only when:

- the membership is active; and
- the organization lifecycle is active.

Because Chat 1 module RLS policies already consume these canonical helpers, tenant suspension propagates automatically without duplicating access checks in Leads, Tasks or future modules.

The direct authenticated organization-insert policy is removed. Self-service organization creation must use the existing secure `bootstrap_organization()` RPC; Control Center continues through the server-only service role.

## Control Center Platform Operations

New internal route:

- `/control-center/platform`

Capabilities:

- invite a new client by email;
- attach an existing Auth user without creating duplicates;
- set the initial organization role;
- send a secure password/access email;
- suspend/reactivate an individual membership;
- set organization technical lifecycle;
- inspect expanded tenant health;
- inspect platform audit history;
- manage internal ORBYVEN staff roles when authorized.

The original `/control-center` remains intact and links to the new Platform Core operations surface.

## Last-owner protection

Platform Core rejects attempts to:

- remove the last active owner;
- suspend the last active owner;
- demote the last active owner.

This protects tenants from accidental lockout.

## Internal ORBYVEN staff

New internal table: `platform_staff`.

Roles:

- `platform_owner`
- `platform_admin`
- `support`

These roles are separate from client `organization_members` roles.

Authorization behavior:

- `platform_owner`: full Platform Core access + staff management;
- `platform_admin`: tenant/user/module/lifecycle administration;
- `support`: read access plus sending client access/recovery emails;
- existing environment allowlist remains a temporary bootstrap/fallback and resolves as `platform_owner`.

`platform_staff` is service-role-only; no authenticated RLS policy is created.

## Audit log

New internal table: `platform_audit_log`.

Control Center records operations including:

- organization creation/update/lifecycle;
- member assignment/removal/access changes;
- invitations/access emails;
- module assignment changes;
- platform staff changes.

Audit rows contain actor, role, organization, action, target, metadata and timestamp.

Audit writing is currently best-effort after the platform operation. A future database-RPC transaction layer can make mutation + audit fully atomic if required.

## Chat 3 integration

Chat 3 is now present in `main`. Platform Core consumes the canonical Chat 3 adapter from:

`lib/billing/control-center.ts`

The Control Center API asks that provider for `subscription_status`, `plan` and `entitlements`. Platform Core does not query or reproduce billing rules directly. If the billing schema is not yet available, Chat 3's own adapter fails soft to `chat3-pending`.

## Chat 1 boundary

No `crm_leads`, `crm_lead_activities`, Tasks business tables or module UI logic is changed.

Platform Core only changes canonical access helpers consumed by module RLS. `lib/orbyven-modules.ts` remains Chat 1's module registry.

## Migration and rollout

Repository migration:

`supabase/migrations/20260907133000_platform_core_auth_provisioning_v2.sql`

Recommended sequential rollout:

1. merge this PR only when it is this chat's turn in the agreed release sequence;
2. apply the migration;
3. deploy the matching `main` commit;
4. verify register -> email confirm -> onboarding -> workspace;
5. verify Control Center invite -> set password -> workspace;
6. verify suspended member/organization cannot read tenant data;
7. verify Chat 1 Leads/Tasks still see the tenant only while access is active;
8. verify Chat 3 billing summary remains read through its provider.

Do not deploy the v2 UI/server code against a production database that has not received the v2 migration.

## Regression test

`supabase/tests/20260907_platform_core_v2_rls.sql`

The test runs inside a transaction and rolls back. It validates:

- active owner can see its temporary tenant;
- suspended membership loses tenant visibility;
- suspended organization loses tenant visibility;
- `workspace_entry_state()` reports the expected access state.

## Environment

Existing Control Center requirements remain:

- `SUPABASE_SERVICE_ROLE_KEY` — server only;
- `ORBYVEN_CONTROL_CENTER_ADMIN_EMAILS` and/or `ORBYVEN_CONTROL_CENTER_ADMIN_USER_IDS` as bootstrap/fallback.

After at least one `platform_owner` is configured and verified, the environment allowlist can later be reduced or removed in a dedicated hardening pass.
