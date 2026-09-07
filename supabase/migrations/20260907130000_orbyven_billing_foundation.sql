-- ORBYVEN billing foundation
-- Commercial identity is organization_id. Existing organization/module tables remain canonical.

create extension if not exists pgcrypto;

create table if not exists public.billing_accounts (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  stripe_customer_id text unique,
  billing_email text,
  legal_name text,
  tax_id text,
  billing_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text,
  plan_id text not null check (plan_id in ('start','business','pro')),
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  commitment_ends_at timestamptz,
  grace_until timestamptz,
  trial_ends_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_entitlements (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_id text not null,
  plan_id text check (plan_id is null or plan_id in ('start','business','pro')),
  source text not null default 'subscription',
  enabled boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (organization_id, module_id)
);

create table if not exists public.billing_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  document_type text not null check (document_type in ('terms','subscription_terms','privacy','dpa')),
  document_version text not null,
  accepted_from text not null default 'workspace_billing',
  accepted_at timestamptz not null default now()
);

create table if not exists public.billing_webhook_events (
  provider_event_id text primary key,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stripe_invoice_id text not null unique,
  stripe_subscription_id text,
  status text not null,
  amount_due bigint,
  amount_paid bigint,
  currency text,
  hosted_invoice_url text,
  invoice_pdf text,
  fiscal_status text not null default 'pending' check (fiscal_status in ('pending','processing','issued','failed','skipped')),
  fiscal_external_id text,
  fiscal_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_organization_idx on public.subscriptions(organization_id, created_at desc);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists entitlements_organization_idx on public.organization_entitlements(organization_id, enabled);
create index if not exists terms_acceptances_org_idx on public.billing_terms_acceptances(organization_id, accepted_at desc);
create index if not exists billing_invoices_org_idx on public.billing_invoices(organization_id, created_at desc);
create index if not exists billing_invoices_fiscal_idx on public.billing_invoices(fiscal_status, created_at);

alter table public.billing_accounts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.organization_entitlements enable row level security;
alter table public.billing_terms_acceptances enable row level security;
alter table public.billing_webhook_events enable row level security;
alter table public.billing_invoices enable row level security;

-- Only the entitlement surface is directly readable by tenant clients.
-- Billing account, subscription, acceptance, webhook and invoice details stay behind server APIs/service role.
drop policy if exists "entitlements_select_member" on public.organization_entitlements;
create policy "entitlements_select_member"
on public.organization_entitlements for select
to authenticated
using (private.is_org_member(organization_id));

create or replace function private.has_module_entitlement(target_org uuid, target_module text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    private.is_org_member(target_org)
    and (
      target_module = 'overview'
      or exists (
        select 1
        from public.organization_entitlements e
        where e.organization_id = target_org
          and e.module_id = target_module
          and e.enabled = true
          and (e.starts_at is null or e.starts_at <= now())
          and (e.ends_at is null or e.ends_at > now())
      )
    );
$$;

revoke all on function private.has_module_entitlement(uuid, text) from public, anon;
grant execute on function private.has_module_entitlement(uuid, text) to authenticated;

-- Reuse the canonical timestamp trigger helper created by the multi-tenant foundation.
drop trigger if exists billing_accounts_set_updated_at on public.billing_accounts;
create trigger billing_accounts_set_updated_at before update on public.billing_accounts
for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists billing_invoices_set_updated_at on public.billing_invoices;
create trigger billing_invoices_set_updated_at before update on public.billing_invoices
for each row execute function public.set_updated_at();
