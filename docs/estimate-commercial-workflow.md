# ORBYVEN — Estimate → Materials → Offer → Invoice → Budget contract

## Source of truth

`sales_estimates` and `sales_estimate_items` are the canonical commercial source for a job. Client, work item, pricing, discount, VAT/tax, notes and totals are entered once in the estimate and reused downstream.

The workflow is tenant-scoped by `organization_id`. Portable modules must never hardcode a client organization, user, domain or provider credential.

## Materials

`ops_material_recipes` + `ops_material_recipe_items` are reusable, organization-owned BOM/recipe templates.

`sales_material_requirements` is the per-estimate operational material list. A requirement may be linked to a recipe and/or a specific estimate item. Its lifecycle is `planned → ordered → bought`.

Material requirements are internal costs. They are not invoice line items and must not be treated as amounts charged to the customer.

## Commercial documents

`sales_commercial_documents` stores generated snapshots for:

- `offer`
- `invoice_draft`

The snapshot is regenerated from the canonical estimate so users do not re-enter customer/job/line/tax/total data. An invoice draft may only be prepared after the estimate is accepted.

These records are **workflow documents, not fiscal truth**. Fiscal issuance, numbering mandated by a provider, e-Factura transmission and provider-specific lifecycle belong to the Billing / Commercial Access integration boundary. Provider secrets must never be stored in portable module code or browser state.

A future provider adapter (for example Oblio, SmartBill or another configured provider) should consume the invoice draft and return the provider document ID/reference/status.

## Budget

`finance_budget_entries` is derived planning data:

- materials → expense → planned/committed
- invoice → income → planned/committed/actual

`finance_expenses` remains the canonical registry of actual outgoing payments. It may now link directly to an `estimate_id`, in addition to client/task/document, so project profitability can compare planned materials with real spend.

The UI may calculate project/company views from both sources, but should not duplicate actual expenses into `finance_budget_entries`.

## Roles and RLS

All workflow tables use tenant RLS:

- active organization members may read;
- owner/admin/manager/member may create or update;
- owner/admin/manager may delete;
- anonymous access is revoked.

The portable module consumes the existing organization context and role contract. It does not introduce a second tenant, auth, billing or module registry.

## User flow

1. Create the estimate once.
2. Build a material requirement manually or apply a reusable recipe.
3. Save useful requirements as new reusable recipes.
4. Generate/update the customer offer from the estimate.
5. Mark the estimate accepted.
6. Prepare/update the invoice draft from the same data.
7. Mark the invoice issued/paid in the internal workflow until a fiscal provider adapter is connected.
8. Budget views update from planned material cost, invoice value and actual linked expenses.
