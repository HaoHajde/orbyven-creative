-- ORBYVEN Alpha 0.9.2 — Customer Portal Core
-- Server-only expiring portal links, explicit document publication, immutable estimate decisions.

alter table public.ops_documents
  add column if not exists portal_visible boolean not null default false;

alter table public.ops_documents
  drop constraint if exists ops_documents_portal_visible_client_check;
alter table public.ops_documents
  add constraint ops_documents_portal_visible_client_check
  check (portal_visible = false or client_id is not null);

create index if not exists ops_documents_portal_client_idx
  on public.ops_documents(organization_id, client_id, created_at desc)
  where portal_visible = true and client_id is not null;

create table if not exists public.client_portal_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  label text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint client_portal_links_client_fk
    foreign key (organization_id, client_id)
    references public.crm_leads(organization_id, id)
    on delete cascade,
  constraint client_portal_links_expiry_check
    check (expires_at > created_at and expires_at <= created_at + interval '90 days')
);

create index if not exists client_portal_links_client_idx
  on public.client_portal_links(organization_id, client_id, created_at desc);
create index if not exists client_portal_links_active_idx
  on public.client_portal_links(organization_id, client_id, expires_at)
  where revoked_at is null;

create table if not exists public.client_portal_estimate_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid not null,
  link_id uuid not null,
  estimate_id uuid not null,
  decision text not null check (decision in ('accepted','rejected')),
  actor_name text not null check (char_length(trim(actor_name)) between 2 and 160),
  offer_snapshot jsonb not null check (jsonb_typeof(offer_snapshot)='object'),
  offer_sha256 text not null check (offer_sha256 ~ '^[0-9a-f]{64}$'),
  ip_sha256 text check (ip_sha256 is null or ip_sha256 ~ '^[0-9a-f]{64}$'),
  user_agent text,
  created_at timestamptz not null default now(),
  unique (organization_id, estimate_id),
  unique (organization_id, id),
  constraint client_portal_decisions_client_fk
    foreign key (organization_id, client_id)
    references public.crm_leads(organization_id, id)
    on delete restrict,
  constraint client_portal_decisions_link_fk
    foreign key (organization_id, link_id)
    references public.client_portal_links(organization_id, id)
    on delete restrict,
  constraint client_portal_decisions_estimate_fk
    foreign key (organization_id, estimate_id)
    references public.sales_estimates(organization_id, id)
    on delete restrict
);

create index if not exists client_portal_decisions_client_idx
  on public.client_portal_estimate_decisions(organization_id, client_id, created_at desc);

create or replace function private.guard_client_portal_decision_immutable()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $fn$
begin
  raise exception 'client_portal_estimate_decision_is_immutable' using errcode='42501';
end
$fn$;

drop trigger if exists client_portal_decision_immutable on public.client_portal_estimate_decisions;
create trigger client_portal_decision_immutable
before update or delete on public.client_portal_estimate_decisions
for each row execute function private.guard_client_portal_decision_immutable();

create or replace function public.client_portal_record_estimate_decision(
  p_token_hash text,
  p_estimate_id uuid,
  p_decision text,
  p_actor_name text,
  p_ip_sha256 text default null,
  p_user_agent text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $fn$
declare
  portal_link record;
  target_estimate record;
  snapshot jsonb;
  snapshot_hash text;
  evidence_id uuid;
begin
  if p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_portal_token';
  end if;
  if p_decision not in ('accepted','rejected') then
    raise exception 'invalid_estimate_decision';
  end if;
  if char_length(trim(coalesce(p_actor_name,''))) < 2
     or char_length(trim(coalesce(p_actor_name,''))) > 160 then
    raise exception 'invalid_actor_name';
  end if;
  if p_ip_sha256 is not null and p_ip_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_ip_digest';
  end if;

  select l.id,l.organization_id,l.client_id,l.expires_at,l.revoked_at
  into portal_link
  from public.client_portal_links l
  where l.token_hash = p_token_hash
    and l.revoked_at is null
    and l.expires_at > pg_catalog.now()
  for update;

  if not found then
    raise exception 'portal_link_not_available';
  end if;

  select
    e.id,e.organization_id,e.client_id,e.reference,e.title,e.status,e.currency,
    e.subtotal_cents,e.discount_cents,e.tax_rate,e.total_cents,e.valid_until,
    e.sent_at,e.accepted_at
  into target_estimate
  from public.sales_estimates e
  where e.organization_id = portal_link.organization_id
    and e.id = p_estimate_id
    and e.client_id = portal_link.client_id
  for update;

  if not found then
    raise exception 'estimate_not_available';
  end if;
  if target_estimate.status <> 'sent' then
    raise exception 'estimate_not_actionable';
  end if;
  if target_estimate.valid_until is not null
     and target_estimate.valid_until < pg_catalog.current_date then
    raise exception 'estimate_expired';
  end if;

  select pg_catalog.jsonb_build_object(
    'estimate', pg_catalog.jsonb_build_object(
      'id', target_estimate.id,
      'reference', target_estimate.reference,
      'title', target_estimate.title,
      'currency', target_estimate.currency,
      'subtotal_cents', target_estimate.subtotal_cents,
      'discount_cents', target_estimate.discount_cents,
      'tax_rate', target_estimate.tax_rate,
      'total_cents', target_estimate.total_cents,
      'valid_until', target_estimate.valid_until,
      'sent_at', target_estimate.sent_at
    ),
    'items', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'description', i.description,
          'quantity', i.quantity,
          'unit_price_cents', i.unit_price_cents,
          'position', i.position
        )
        order by i.position,i.created_at,i.id
      )
      from public.sales_estimate_items i
      where i.organization_id = portal_link.organization_id
        and i.estimate_id = target_estimate.id
    ), '[]'::jsonb)
  )
  into snapshot;

  snapshot_hash := pg_catalog.encode(public.digest(snapshot::text,'sha256'),'hex');

  insert into public.client_portal_estimate_decisions(
    organization_id,client_id,link_id,estimate_id,decision,actor_name,
    offer_snapshot,offer_sha256,ip_sha256,user_agent
  )
  values(
    portal_link.organization_id,
    portal_link.client_id,
    portal_link.id,
    target_estimate.id,
    p_decision,
    pg_catalog.trim(p_actor_name),
    snapshot,
    snapshot_hash,
    p_ip_sha256,
    pg_catalog.left(nullif(p_user_agent,''),1000)
  )
  returning id into evidence_id;

  update public.sales_estimates
  set status = p_decision,
      accepted_at = case when p_decision='accepted' then pg_catalog.now() else accepted_at end,
      updated_at = pg_catalog.now()
  where organization_id = portal_link.organization_id
    and id = target_estimate.id;

  insert into public.crm_lead_activities(
    organization_id, lead_id, kind, body, occurred_at, created_by
  )
  values(
    portal_link.organization_id,
    portal_link.client_id,
    'status',
    'Portal client: oferta ' || target_estimate.reference || ' a fost ' ||
      case when p_decision='accepted' then 'acceptată' else 'refuzată' end ||
      ' de ' || pg_catalog.trim(p_actor_name) || '.',
    pg_catalog.now(),
    null
  );

  return evidence_id;
end
$fn$;

alter table public.client_portal_links enable row level security;
alter table public.client_portal_estimate_decisions enable row level security;

revoke all on public.client_portal_links from public,anon,authenticated;
revoke all on public.client_portal_estimate_decisions from public,anon,authenticated;
grant select,insert,update on public.client_portal_links to service_role;
grant select,insert on public.client_portal_estimate_decisions to service_role;

revoke all on function public.client_portal_record_estimate_decision(
  text,uuid,text,text,text,text
) from public,anon,authenticated;
grant execute on function public.client_portal_record_estimate_decision(
  text,uuid,text,text,text,text
) to service_role;

comment on table public.client_portal_links is
  'Server-only expiring customer portal access links. Raw portal tokens are never stored.';
comment on table public.client_portal_estimate_decisions is
  'Immutable evidence for customer decisions on published estimates via expiring portal links.';
