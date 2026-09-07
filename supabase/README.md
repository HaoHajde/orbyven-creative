# ORBYVEN Supabase

This directory contains the database foundation for the shared ORBYVEN platform.

## Multi-tenant rule

Every client-facing data table added by a module must contain an `organization_id` column and must use Row Level Security (RLS) so authenticated users can only access rows belonging to organizations where they are members.

Module code must never hardcode a client name, organization UUID, or user UUID.

The workspace resolves the current organization through `organization_members`, then loads the organization's enabled modules and profile.

## Core tables

- `organizations`
- `organization_members`
- `organization_modules`
- `organization_profiles`

## Module contract

When adding a module-specific table:

1. add `organization_id uuid not null references public.organizations(id) on delete cascade`;
2. enable RLS;
3. reuse the private organization membership helpers from the core tenancy migration;
4. scope every client-side query by the active organization where practical, even though RLS is the final security boundary;
5. never expose service-role credentials to the browser.

`overview` is an ORBYVEN Core surface and is not stored as a purchasable module row.
