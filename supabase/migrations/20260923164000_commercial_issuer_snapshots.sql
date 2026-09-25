-- PFA -> SRL readiness: persist the contracting/fiscal merchant as a historical
-- snapshot. BRAND and customer organization_id are unchanged by a seller change.
-- Additive and nullable for legacy/test records: never backfill from today's env.
-- Server-side writes only. Existing RLS/no-client-policies remain in force.

alter table public.billing_terms_acceptances
  add column if not exists merchant_key text,
  add column if not exists merchant_type text,
  add column if not exists merchant_legal_name text,
  add column if not exists merchant_tax_id text;

alter table public.subscriptions
  add column if not exists merchant_key text,
  add column if not exists merchant_type text,
  add column if not exists merchant_legal_name text,
  add column if not exists merchant_tax_id text;

alter table public.billing_invoices
  add column if not exists merchant_key text,
  add column if not exists merchant_type text,
  add column if not exists merchant_legal_name text,
  add column if not exists merchant_tax_id text;

create index if not exists billing_invoices_merchant_fiscal_idx
  on public.billing_invoices (merchant_key, fiscal_status, created_at);

comment on column public.billing_invoices.merchant_key is
  'Immutable logical identity of the merchant responsible for this invoice; never assign historical rows based on current environment.';
comment on column public.subscriptions.merchant_key is
  'Contracting merchant identity captured on subscription creation; not the customer organization.';
comment on column public.billing_terms_acceptances.merchant_key is
  'Merchant identity displayed when these terms were accepted. Legacy rows remain NULL until verified manually.';
