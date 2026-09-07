# ORBYVEN — Platform Core / Workspace Backend

## Source of truth

`main` is the only source of truth. New Platform Core work must start from the latest `main` and must not revive old tenant models or stale workspace branches.

## Ownership

Platform Core owns authentication, Supabase tenancy, onboarding and internal platform administration.

The client workspace UI and business modules consume these contracts; they do not redefine them.

## Canonical tenant schema

The only tenant tables are:

- `public.organizations`
- `public.organization_members`
- `public.organization_profiles`
- `public.organization_modules`

Do not create `organization_memberships`, another organization table family, another `/platform` tenant shell or a second module persistence model.

### `organizations`

Company identity.

Relevant fields:

- `id`
- `name`
- `slug`
- `legal_name`
- `created_by`
- `created_at`
- `updated_at`

### `organization_members`

Maps Supabase Auth users to organizations.

Supported roles:

- `owner`
- `admin`
- `manager`
- `member`
- `viewer`

Primary key: `(organization_id, user_id)`.

### `organization_profiles`

Workspace presentation/configuration data:

- `display_name`
- `greeting_name`
- `logo_url`
- `timezone`
- `locale`
- `settings`

### `organization_modules`

Organization-specific module activation/configuration:

- `organization_id`
- `module_id`
- `enabled`
- `settings`
- `created_at`
- `updated_at`

Primary key: `(organization_id, module_id)`.

Module IDs must remain aligned with `lib/orbyven-modules.ts`, which is consumed from the Client Workspace domain.

`overview` is ORBYVEN Core and is not persisted as a purchasable/optional module row.

## RLS boundary

Row Level Security (RLS) is enabled on the canonical tenant tables.

Canonical helpers live in the `private` schema:

- `private.is_org_member(uuid)`
- `private.is_org_admin(uuid)`

Client-facing module tables must contain `organization_id`, use RLS and never rely only on UI filtering for tenant isolation.

## Workspace entry contract

`lib/orbyven-workspace.ts` exports `getWorkspaceEntryPath()`.

It resolves one of:

- `/workspace/login` — no authenticated user;
- `/workspace/onboarding` — authenticated user without an organization membership;
- `/workspace` — authenticated user already assigned to an organization.

Normal flow:

```text
/workspace/login
      ↓
Supabase Auth
      ↓
getWorkspaceEntryPath()
      ↓
no membership → /workspace/onboarding
      ↓
bootstrap_organization(...)
      ↓
organization + owner membership + profile + optional modules
      ↓
/workspace
```

## Onboarding RPC

`public.bootstrap_organization(p_name, p_slug, p_module_ids)` is the only self-onboarding write path introduced by Platform Core.

Security properties:

- requires an authenticated Supabase user (`auth.uid()`);
- refuses onboarding when that user already belongs to an ORBYVEN organization;
- validates company name and slug;
- accepts only module IDs from the current registry contract;
- creates the organization, owner membership and profile atomically;
- persists only optional module rows; `overview` remains implicit ORBYVEN Core;
- `EXECUTE` is revoked from `public` and `anon` and granted only to `authenticated`.

Repository migration:

`supabase/migrations/20260907102500_workspace_onboarding.sql`

## Cross-chat integration rules

### Chat 1 — Modules + Client Workspace Experience

Consumes:

- `organization_id` from current workspace context;
- current membership role;
- module enablement from `organization_modules`;
- the canonical tenant/RLS contract.

Chat 1 owns module business logic and must not create a new tenant model.

### Chat 3 — Legal + Billing + Entitlements

Will provide subscription/entitlement state. Platform Core must consume that through an explicit contract rather than implementing billing itself.

Reserved contract fields:

- `subscription_status`
- `plan`
- `entitlements`

No billing tables or Stripe logic are defined by this document.

### Chat 4 — Public Website + Templates + Marketing

Does not mutate the private tenant schema. It consumes only public product information where needed.

## Infrastructure change rule

Any Platform Core schema/API change must document:

1. why it is required;
2. affected tables/functions/routes;
3. compatibility impact for Chat 1 and Chat 3;
4. migration and rollback considerations;
5. test/build status.
