-- ORBYVEN Legal & Trust: immutable B2B checkout offer and verified Stripe outcome.
-- No payment activation, no B2C consent exemption, no fiscal invoice creation.
-- Depends on the Legal & Trust migration and existing billing/merchant snapshots.
create table if not exists public.billing_order_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  terms_acceptance_id uuid not null references public.billing_terms_acceptances(id) on delete restrict,
  subscription_acceptance_id uuid not null references public.billing_terms_acceptances(id) on delete restrict,
  plan_id text not null check (plan_id in ('start','business','pro')),
  stripe_price_id text not null,
  offer_snapshot jsonb not null check (jsonb_typeof(offer_snapshot) = 'object'),
  offer_sha256 text not null check (offer_sha256 ~ '^[0-9a-f]{64}$'),
  accepted_at timestamptz not null default now(),
  status text not null default 'accepted' check
    (status in ('accepted','checkout_created','checkout_failed','checkout_completed')),
  stripe_checkout_session_id text unique,
  checkout_completed_at timestamptz,
  checkout_final_amount_minor bigint check (checkout_final_amount_minor is null or checkout_final_amount_minor >= 0),
  checkout_tax_amount_minor bigint check (checkout_tax_amount_minor is null or checkout_tax_amount_minor >= 0),
  checkout_discount_amount_minor bigint check (checkout_discount_amount_minor is null or checkout_discount_amount_minor >= 0),
  checkout_currency text check (checkout_currency is null or checkout_currency ~ '^[a-z]{3}$'),
  checkout_payment_status text,
  checkout_stripe_customer_id text,
  checkout_buyer_name text,
  checkout_buyer_email text,
  checkout_buyer_tax_id text,
  checkout_billing_address jsonb check (checkout_billing_address is null or jsonb_typeof(checkout_billing_address) = 'object'),
  stripe_event_id text,
  updated_at timestamptz not null default now(),
  constraint order_acceptances_distinct check (terms_acceptance_id <> subscription_acceptance_id),
  constraint order_completed_has_verified_fields check (
    status <> 'checkout_completed'
    or (
      stripe_checkout_session_id is not null
      and checkout_completed_at is not null
      and checkout_final_amount_minor is not null
      and checkout_currency is not null
      and stripe_event_id is not null
    )
  )
);
create index if not exists billing_order_evidence_org_accepted_idx
  on public.billing_order_evidence (organization_id,accepted_at desc);
create index if not exists billing_order_evidence_state_idx
  on public.billing_order_evidence (status,accepted_at);

alter table public.billing_order_evidence enable row level security;
revoke all privileges on public.billing_order_evidence from public,anon,authenticated;
grant select,insert,update on public.billing_order_evidence to service_role;

create or replace function private.guard_billing_order_evidence()
returns trigger language plpgsql security invoker set search_path = ''
as $fn$
begin
  if new.id is distinct from old.id
    or new.organization_id is distinct from old.organization_id
    or new.actor_user_id is distinct from old.actor_user_id
    or new.terms_acceptance_id is distinct from old.terms_acceptance_id
    or new.subscription_acceptance_id is distinct from old.subscription_acceptance_id
    or new.plan_id is distinct from old.plan_id
    or new.stripe_price_id is distinct from old.stripe_price_id
    or new.offer_snapshot is distinct from old.offer_snapshot
    or new.offer_sha256 is distinct from old.offer_sha256
    or new.accepted_at is distinct from old.accepted_at then
    raise exception 'Checkout accepted offer is immutable' using errcode = '42501';
  end if;

  if old.stripe_checkout_session_id is not null
    and new.stripe_checkout_session_id is distinct from old.stripe_checkout_session_id then
    raise exception 'Stripe checkout session identity is immutable' using errcode = '42501';
  end if;

  if old.status = 'checkout_completed' then
    if to_jsonb(new) - 'updated_at' is distinct from to_jsonb(old) - 'updated_at' then
      raise exception 'Completed checkout evidence is immutable' using errcode = '42501';
    end if;
    return old;
  end if;

  if new.status is distinct from old.status and not (
    (old.status = 'accepted' and new.status in ('checkout_created','checkout_failed','checkout_completed'))
    or (old.status = 'checkout_created' and new.status in ('checkout_failed','checkout_completed'))
    or (old.status = 'checkout_failed' and new.status = 'checkout_completed')
  ) then
    raise exception 'Invalid checkout state transition' using errcode = '23514';
  end if;

  if new.status = 'checkout_created' and new.stripe_checkout_session_id is null then
    raise exception 'Checkout created requires Stripe session ID' using errcode = '23514';
  end if;
  if new.status = 'checkout_completed' and new.stripe_checkout_session_id is null then
    raise exception 'Checkout completion requires verified Stripe session' using errcode = '23514';
  end if;
  new.updated_at := pg_catalog.now();
  return new;
end;
$fn$;
revoke all on function private.guard_billing_order_evidence() from public,anon,authenticated;
drop trigger if exists billing_order_evidence_guard on public.billing_order_evidence;
create trigger billing_order_evidence_guard
  before update on public.billing_order_evidence
  for each row execute function private.guard_billing_order_evidence();

-- Prevent a manual join of unrelated organizations' acceptances.
create or replace function private.guard_billing_order_acceptances()
returns trigger language plpgsql security invoker set search_path = ''
as $fn$
begin
  if not exists (
    select 1 from public.billing_terms_acceptances t
    join public.billing_terms_acceptances s on s.id = new.subscription_acceptance_id
    where t.id = new.terms_acceptance_id
      and t.organization_id = new.organization_id
      and s.organization_id = new.organization_id
      and t.document_type = 'terms'
      and s.document_type = 'subscription_terms'
      and t.user_id is not distinct from new.actor_user_id
      and s.user_id is not distinct from new.actor_user_id
  ) then
    raise exception 'Checkout acceptances do not belong to the same actor and organization'
      using errcode = '23514';
  end if;
  return new;
end;
$fn$;
revoke all on function private.guard_billing_order_acceptances() from public,anon,authenticated;
drop trigger if exists billing_order_acceptances_guard on public.billing_order_evidence;
create trigger billing_order_acceptances_guard
  before insert on public.billing_order_evidence
  for each row execute function private.guard_billing_order_acceptances();

comment on table public.billing_order_evidence is
  'Pre-payment B2B offer and user acceptance snapshot; final Stripe amount reflects signed webhook outcome, not a fiscal invoice or verified full legal-document hash. Historical records are never synthesized.';
