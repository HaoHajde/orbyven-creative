# ORBYVEN Ecosystem Foundation — preview-only checkpoint

Status: work-in-progress branch. NOT merged, NOT deployed, NO live database writes or migrations.
User rule (23.09.2026): work in chat/local/CI only; explicit approval required before any merge or Vercel deployment.

## One commercial source of truth

```text
CRM client (crm_leads)
  -> work (ops_tasks.kind=work)
    -> estimate (sales_estimates + sales_estimate_items)
       |-> material recipe (ops_material_recipes + ops_material_recipe_items)
       |     -> material requirements (sales_material_requirements)
       |     -> planned materials cost (finance_budget_entries/source_type=materials)
       |-> customer offer (sales_commercial_documents/document_type=offer)
       |     -> explicit acceptance
       |     -> invoice draft (sales_commercial_documents/document_type=invoice_draft)
       |          -> fiscal profile + VAT per line + buyer identification
       |          -> issued immutable invoice with reserved unique series/number
       |          -> XML UBL EN16931/RO-CIUS -> ANAF submission -> index
       |          -> status poll/download + accepted/sealed XML archived
       |-> cost/expense tracking (finance_expenses + finance_budget_entries)
```

These are dependent records, not duplicate independent forms. Every business record
must carry organization_id, and all references must be constrained to the same
organization with foreign keys and RLS. `billing_invoices` belongs to ORBYVEN's
Stripe subscriptions and MUST NEVER be used as a tenant-issued fiscal invoice.

## Real state found by READ-ONLY Supabase schema inspection

| Table | What exists | What remains |
|---|---|---|
| crm_leads, ops_tasks | Live workspace modules | Use shared client/work context |
| sales_estimates + sales_estimate_items | Live deviz UI | Versioning and atomic item writes |
| ops_material_recipes + ops_material_recipe_items | RLS-protected DB only | Recipe library and UX |
| sales_material_requirements | RLS-protected DB only | Non-destructive generation, ordering and procurement |
| sales_commercial_documents | offer/invoice_draft DB only | Revision snapshots, client approval, immutable issued invoice model |
| finance_budget_entries | RLS-protected DB only | Reconciliation actual vs planned, do not double-count |
| finance_expenses | Live expense UI | Link accepted invoice/requirements and reconcile |
| fiscal profile, issuance, e-Factura | Not provided by the current commercial module | New schema, server APIs and audited flows |

Database constraints observed: commercial docs types `offer`/`invoice_draft` only;
material statuses `planned`, `ordered`, `bought`; one commercial
document per estimate and type by unique constraint; budget source types
`materials`/`invoice`. They are not sufficient for multi-version offers,
partial invoicing, credit notes or actual RO e-Factura state.

## Boundaries / dependencies

- A material recipe is optional when authoring a deviz; generate a list
  only from selected estimate items, never multiply the recipe across all lines.
- Customer offer = snapshot of a revision, NOT live mutable view of the deviz.
- Do not overwrite a sent or accepted offer after the estimate changes; flag
  the previous snapshot as stale and request a deliberate revision.
- `invoice_draft` is a preview, NOT an issued invoice and not ANAF submitted.
- Fiscal invoice identity: issuer, customer, issue date, unique number/series,
  line units, category/rate/exemption treatment, totals and currency must be
  validated under the applicable accounting regime; a single global deviz VAT
  rate is not enough for a general-purpose invoice builder.
- Issuance must create an immutable snapshot and an audit log in one atomic
  database transaction. Repeated requests must use idempotency keys.
- Connection to ANAF requires developer registration and OAuth authorization
  associated with the authorized user/certificate; store tokens encrypted
  server-side and never expose them to a browser or other tenant.
- Never auto-submit on Save, on Accepted status, or as a side-effect of deviz.
  Explicitly authorized issuance and explicit send + auditable status.
- Upload returning an index is NOT equivalent to accepted invoice. Poll
  processing state, retrieve the response and archive the signed/sealed XML.
  Provide failure handling, controlled retry and reconciliation.

## RO e-Factura current legal/technical references (verify before release)

- ANAF notice 30 January / 2 February 2026: from 1 January 2026 the deadline
  is generally five **working** days from invoice issuance, also bounded by the
  legal last issuance deadline: https://static.anaf.ro/static/3/Galati/20260202132103_termen%20transmitere%20factura%20electronica.pdf
- Ministry/ANAF API upload and test vs production:
  https://mfinante.gov.ro/static/10/eFactura/prezentare%20apeluri%20API%20E-factura.pdf
- ANAF upload/state/list/download endpoints:
  https://static.anaf.ro/static/10/Anaf/Informatii_R/Servicii_web/url_eFactura.html
- Developer OAuth:
  https://static.anaf.ro/static/10/Anaf/Informatii_R/API/Oauth_procedura_inregistrare_aplicatii_portal_ANAF.pdf
- ANAF UBL form shows item-level VAT categories, unit, prices, invoice
  issue date and buyer/seller:
  https://www.anaf.ro/CompletareFactura/faces/factura/produse.xhtml

Before any fiscal production feature, validate with an accountant and lawyer.
ORBYVEN does not replace the accountant and must not claim that a PDF draft was
submitted to ANAF.

## Work completed on this offline branch

- `lib/ecosystem/graph.ts`: nodes, ordered prerequisite resolution, missing
  prerequisites and customer-readiness flag.
- `lib/ecosystem/projections.ts`: pure amount/recipe expansion, offer snapshot
  preview, accepted-offer invoice-draft preview, explicit ANAF prerequisites.
- `lib/ecosystem/read-model.ts`: read-only, organization-scoped lineage
  (estimate, items, materials, commercial docs, planned budget) and stale flag.
- Optional downloadable HTML prototype, entirely local, with demo data visibly
  identified as demo; no backend, no real tax invoice or ANAF calls.

## Implementation order before launch

1. Add offline tests for dependency graph, recipe multiplication, invalid
   references and fiscal blockers.
2. Introduce actual Recipe + Materials UI and non-destructive, transaction-safe
   material-generation RPC (add constraints by estimate line and recipe as needed).
3. Design revisions/versioned commercial snapshots and explicit offer acceptance
   with tenant RLS and role checks.
4. Approved organization fiscal profile and invoice line tax schema; signed-off
   accounting specifications, issue sequence and audit log.
5. Authorized server-only ANAF OAuth integration + XML validation and test endpoint.
6. Pilot in TWO separate organizations and multiple roles; confirm no cross-tenant
   access, no duplicate invoices/submissions, status retries and mobile UX.
7. Obtain explicit owner approval for merge/deploy after Vercel restriction lifts.
