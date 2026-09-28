-- Additive, server-only merchant isolation for eventual PFA -> SRL transition.
-- Run BEFORE deploying code that reads these columns. No existing billing records
-- are rewritten or attributed to a newly configured merchant.
create table if not exists public.billing_merchant_customers (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  merchant_key text not null check (merchant_key ~ '^[a-z0-9][a-z0-9_-]{2,63}$'),
  stripe_customer_id text not null unique,
  billing_email text,
  legal_name text,
  tax_id text,
  billing_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, merchant_key)
);
alter table public.billing_merchant_customers enable row level security;
revoke all on public.billing_merchant_customers from anon, authenticated;
grant all on public.billing_merchant_customers to service_role;
comment on table public.billing_merchant_customers is 'Server-only Stripe customer identifiers scoped to the customer organization AND immutable legal seller; historic PFA identifiers must never be sent to the SRL Stripe account.';

alter table public.billing_webhook_events
  add column if not exists merchant_key text,
  add column if not exists processing_started_at timestamptz not null default now(),
  add column if not exists processing_token uuid not null default gen_random_uuid(),
  add column if not exists attempt_count integer not null default 1;
create index if not exists billing_webhook_recovery_idx
  on public.billing_webhook_events (processing_started_at)
  where processed_at is null;
comment on column public.billing_webhook_events.processing_token is 'Compare-and-swap fence for retry ownership; a superseded delivery cannot mark an event processed.';

-- Existing rows are never guessed to be PFA or SRL by this migration.
