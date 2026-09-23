# ORBYVEN — Fiscal Adapter Setup (Oblio / RO e-Factura)

This adapter is implemented but intentionally disabled until the ORBYVEN legal entity and accountant confirm the fiscal configuration.

## Flow
`Stripe invoice.paid → billing_invoices(pending) → secure fiscal worker → Oblio invoice → optional SPV submission`

The Stripe webhook never waits for Oblio or ANAF.

## Oblio API contract used
1. OAuth token: `POST /api/authorize/token`
2. Invoice issue: `POST /api/docs/invoice`
3. Optional SPV submission: `POST /api/docs/einvoice`

The Stripe invoice id is sent as Oblio `idempotencyKey` to avoid duplicate document creation during retries.

## Required validation before enabling
Ask the accountant to confirm:
- ORBYVEN VAT status and correct VAT rate/name in Oblio
- whether displayed subscription prices include VAT or exclude VAT
- invoice issue moment for recurring card payments
- invoice due/collection representation
- invoice series
- whether automatic SPV submission should be enabled
- any wording required on the invoice line/mentions

Only after confirmation set `ORBYVEN_OBLIO_ENABLED=true`.

## PFA → SRL historical issuer protection
- Check that the Oblio CIF matches ORBYVEN_TAX_ID for the current verified merchant.
- Each pending invoice has an issuer snapshot and merchant key captured from original subscription acceptance. The worker selects ONLY invoices belonging to ORBYVEN_COMMERCIAL_ENTITY_KEY; never backfill old invoices using today’s legal identity.
- Keep a separate reconciliation procedure and old Oblio/Stripe evidence for the PFA when switching to SRL. Null merchant keys and mismatched old invoices require manual review, not automatic issuance.
- The additive SQL migration in the repository is NOT automatically applied to the live database by creating a PR. Apply/test the schema before running the revised billing code.

## Worker security
`POST /api/billing/fiscal/process` requires `Authorization: Bearer <CRON_SECRET>`.

No Vercel Cron schedule is added yet. Add it only after the fiscal flow has been tested in a controlled environment.
