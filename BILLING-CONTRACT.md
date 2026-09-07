# ORBYVEN — Billing & Entitlements Contract

## Canonical identity
Billing belongs to `organization_id`, never directly to a user.

Existing tenant tables remain canonical and are not duplicated:
- `organizations`
- `organization_members`
- `organization_profiles`
- `organization_modules`

Billing adds:
- `billing_accounts`
- `subscriptions`
- `organization_entitlements`
- `billing_terms_acceptances`
- `billing_webhook_events`
- `billing_invoices`

## Enabled vs entitled
`organization_modules.enabled` means the client chose to display/use a module in the workspace.

`organization_entitlements.enabled` means the organization has a current commercial right to the module.

Chat 1 may consume `isModuleEntitled(organizationId, moduleId)` from `lib/billing/entitlements.ts`.

Enforcement is OFF by default. It becomes active only when:
`NEXT_PUBLIC_BILLING_ENTITLEMENTS_ENFORCED=true`.

This prevents the billing foundation from breaking existing pilots before commercial launch.

## Current provisional plan map
- START: overview, leads
- BUSINESS: overview, leads, tasks, calendar, estimates
- PRO: all registry modules

This map is a product assumption and must be validated before entitlement enforcement is enabled.

## Stripe safety gates
Commercial billing cannot start unless all of the following are configured:
- legal operator data
- explicit VAT label
- `ORBYVEN_BILLING_ENABLED=true`
- Stripe secret + webhook secret
- stable Stripe Price IDs for START/BUSINESS/PRO
- `SUPABASE_SERVICE_ROLE_KEY`
- a dedicated Stripe Customer Portal configuration

The dedicated Portal configuration must not allow cancellation or plan changes that bypass the initial 12-month commitment. In v1 the portal is intended for payment-method and invoice access.

## Checkout contract
Only organization `owner` or `admin` can start Checkout.

Before redirecting to Stripe, the server records acceptance of the current general Terms and Subscription Terms version.

Checkout metadata includes:
- `organization_id`
- `plan_id`

The webhook is the source of truth for Stripe customer/subscription state.

## Webhook events
Handled idempotently through `billing_webhook_events`:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Duplicate Stripe events are ignored safely.

## Grace period
`invoice.payment_failed` creates a 7-day grace window. Entitlements stay valid until `grace_until`; after that, entitlement checks naturally fail even before another database update.

## Fiscal handoff: Oblio / RO e-Factura
Paid Stripe invoices are recorded in `billing_invoices` with `fiscal_status='pending'`.

The fiscal worker is intentionally separate from the Stripe webhook. It claims pending records, issues the Romanian invoice through the Oblio API using the Stripe invoice id as Oblio `idempotencyKey`, records the Oblio series/number/link and can optionally submit the emitted invoice to SPV.

The adapter stays OFF until `ORBYVEN_OBLIO_ENABLED=true` and every fiscal configuration value is present. There is no Cron schedule committed yet; the secure endpoint `/api/billing/fiscal/process` can later be attached to Vercel Cron using `CRON_SECRET` after the accountant validates invoice timing and VAT treatment.

Required fiscal configuration before activation:
- Oblio account email and API secret
- issuer CIF
- invoice series
- VAT name and percentage exactly as configured in Oblio
- whether VAT is included in the price
- whether ORBYVEN should submit to SPV automatically
- `CRON_SECRET`

Do not emit a Romanian fiscal invoice directly from portable modules or from the Stripe webhook. Always use `billing_invoices` as the queue/state so retries remain idempotent and auditable.

## Chat 2 / Control Center contract
Control Center may read commercial state through a server-side billing summary and later expose:
- plan
- subscription status
- commitment end
- grace status
- entitlements
- fiscal invoice status

Control Center must not mutate Stripe/Oblio tables directly. Commercial changes go through Billing APIs.

## Chat 4 / public pricing contract
Public pricing may render plan names/prices, but tax wording and checkout behavior must come from the shared billing configuration. Do not create another checkout implementation.
