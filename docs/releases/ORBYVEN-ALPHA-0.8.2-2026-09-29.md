# ORBYVEN Alpha 0.8.2 — Estimate Draft Agent Action

Date: 2026-09-29
Base: Alpha 0.8.1 — Agent Actions

## Scope

Alpha 0.8.2 extends the confirmed ORBYVEN Agent Actions boundary with controlled estimate/deviz draft creation.

### New confirmed action

- create Estimate / Deviz draft

The existing confirmation lifecycle remains unchanged:

1. user gives an explicit request;
2. deterministic parser creates a bounded proposal;
3. ORBYVEN previews interpreted fields and calculated totals;
4. user confirms or rejects;
5. one atomic claim can execute the proposal;
6. estimate + estimate items are created atomically;
7. successful execution is audited.

## Explicit-input rule

ORBYVEN does not invent estimate prices or line items.

At least one line must be supplied explicitly, for example:

`poziție: Montaj centrală, 1 x 1500 lei`

Supported explicit fields include:

- title;
- exact client name/company;
- exact work title;
- one or more line items;
- discount in RON;
- VAT percentage;
- planned labor;
- other costs;
- validity date;
- notes.

Currency is RON in this release.

## Commercial safety

The AI action always creates:

- `sales_estimates.status = 'draft'`

It cannot automatically:

- send an estimate;
- accept an estimate;
- create a fiscal invoice;
- record a payment;
- write to Finance.

## Data integrity

Estimate creation is performed through server-only RPC:

`public.ai_create_estimate_draft(...)`

The function:

- is SECURITY INVOKER;
- is not executable by `anon` or `authenticated`;
- is executable by `service_role`;
- validates title, currency, values and every line item;
- calculates subtotal, capped discount, VAT and total;
- inserts estimate and items in one PostgreSQL transaction;
- returns the new estimate id.

## Tenant and role boundaries

- action proposal remains tied to one actor + one organization;
- Owner/Admin/Manager/Member mirror existing estimate-create permissions;
- Viewer remains read-only;
- Estimates must be enabled and entitled both at proposal and execution time;
- client lookup is exact and same-tenant;
- work lookup is exact, same-tenant and restricted to `kind='work'`;
- an existing work/client mismatch fails closed.

## Not included yet

- estimate status transitions;
- sending estimates;
- automatic price generation;
- supplier price inference;
- Finance mutations;
- document generation/storage;
- autonomous chains.

## Release acceptance

Before merge:

- changed-file lint;
- full lint;
- TypeScript;
- Agent Actions tests;
- Estimate Action tests;
- billing/security/legal/order regressions;
- performance/data/SEO regressions;
- production Next.js build;
- Architecture Guard;
- Vercel success after merge.
