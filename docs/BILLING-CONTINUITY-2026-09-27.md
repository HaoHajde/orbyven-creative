# ORBYVEN — PFA → SRL billing continuity (staged)

Scope: prepare the existing ORBYVEN code for TWO legally distinct Stripe merchants. **No merchant has been formed or authorized by this code, no checkout or fiscal service has been activated, and no subscription is transferred automatically.** Brand/customer `organization_id` is not the invoice issuer.

## Source of truth and isolation

- `billing_merchant_customers`: organization + immutable merchant key → Stripe Customer ID, billing contact/address. Never reuse PFA `cus_` on SRL API key.
- `subscriptions.merchant_key` and `billing_invoices.merchant_key`: original legal merchant. Stripe Checkout/Subscription metadata must match the account whose webhook signature verified.
- `billing_accounts` is a legacy per-organization record, NOT the source of truth during the PFA/SRL transition.
- A second archived PFA webhook signing secret can accept late events signed by the old Stripe account. It must never route old events into SRL bookkeeping.
- A separate archived PFA API key + portal configuration allow authenticated owners/admins to view the prior payment method and invoices **only when configured**. No API key is sent to the browser. The archived account never creates new customer subscriptions through ORBYVEN.
- Tenant module access is not downgraded by a stale PFA webhook if the current SRL merchant already has an active subscription.

## Webhook failure and crash behavior

- Persist original Stripe event; dedupe by event ID; retain verified merchant key.
- A 15-minute lease plus random processing token fences an abandoned event: Stripe redelivery can reclaim it only after the lease expires. Successful/failed writes must match the active token. This reduces stuck pending events but does not replace an operations alert when Stripe stops retrying.
- Stripe uses redelivery/backoff policies; a permanently pending event needs an operator-initiated redelivery after diagnosis.
- Every Stripe handler must be idempotent; duplicate Invoice events cannot reset `issued`, `processing`, or `failed` status to `pending`.
- **Important:** A prior worker can finish after its lease was stolen, so don't run manual concurrent redelivery while a long-running job remains active. The 15-minute lease is a recovery threshold, not a transactional distributed lock for all side effects.

## Oblio / SPV separation

- Worker queries only invoices whose `merchant_key` matches verified current issuer and whose name/CIF/type match.
- Recipient billing information is merchant-scoped. If the old PFA invoice is still pending after SRL cutover, process it ONLY with the old merchant's correctly configured fiscal worker.
- Oblio issue → persist issued series/number/document immediately → optionally attempt SPV. SPV failure records separate SPV status and does not reissue the Oblio document.
- If Oblio issuance may have succeeded but local persistence failed: invoice becomes failed and MUST be reconciled against Oblio by Stripe invoice id/series/document, with accountant approval, before any explicit retry. The idempotencyKey is additional defense, not proof of exactly-once delivery.
- Automated sending to e-Factura remains disabled by default pending fiscal validation.

## Deployment ordering

1. Verify database snapshot/backup, check migration history, test migration on staging.
2. Apply additive `20260927182000_billing_merchant_routing_and_webhook_recovery.sql` before deploying routes. Never assume applying GitHub code applies SQL automatically.
3. Run `npm run validate`, SQL RLS tests, mocked Stripe events (PFA current, SRL current, PFA archived, bad signature, stalled/failed duplicate) and mocked Oblio/SPV failure.
4. Connect verified Stripe account(s) after professional review, keep `ORBYVEN_COMMERCIAL_CHECKOUT_PAUSED=true` until business launch approval. Do not toggle LIVE from a PR.
5. Reconcile all PFA fiscal records and contracts before any transfer; preserve historical client right to old invoices and update DPA/privacy.

## Remains gated, not implemented automatically

- Client-by-client contract transfer/novation/re-consent and Stripe subscription remapping with actual old/new merchant accounts; existing active PFA subscription prevents a second subscription checkout to protect against double charging.
- Old Stripe event delivery depends on maintaining the old endpoint and old webhook secret during the archive period.
- Recovering a Stripe event after Stripe's delivery window requires a restricted operator workflow; do not expose a public replay endpoint.
- Official ANPC SAL pictogram must be downloaded and verified as the official 250×50 art; the text link alone is insufficient. Unlicensed third-party images in florărie demo still require replacement with originals/licensed imagery, avoiding silent design regressions.

Status: repo-only, no production merchant change, no Stripe/Oblio credential changes.
