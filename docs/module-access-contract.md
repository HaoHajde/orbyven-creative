# ORBYVEN module access contract

Ownership: Chat 1 defines module availability and consumes enabled workspace state. Chat 3 will provide commercial entitlements. Platform Core remains owned by Chat 2.

## Canonical meanings

- `available`: the module exists in `lib/orbyven-modules.ts`. The registry is the only official catalog.
- `entitled`: the organization has commercial permission to use the module. This value is not implemented by Chat 1; Chat 3 will provide it.
- `enabled`: the module is active in the client workspace. Chat 1 consumes and renders this state through the existing `organization_modules` contract owned by Platform Core.

## Future Chat 3 interface

Chat 1 needs a read-only entitlement contract conceptually equivalent to:

```ts
getOrganizationModuleEntitlement(
  organizationId: string,
  moduleId: OrbyvenModuleId
): Promise<boolean>
```

The implementation, persistence model, billing rules and subscription logic remain outside Chat 1.

When the entitlement provider exists, the workspace module picker should only permit `enabled = true` when both `available === true` and `entitled === true`.

## Leads module tenant contract

Every Leads / Clienți query and mutation receives an explicit `organizationId`. The data layer always adds an `organization_id` filter even though RLS is also enabled. This is deliberate defense in depth and is the portability contract for future modules.
