-- ORBYVEN Client Growth Loop
-- Persistent state for feedback -> review -> referral -> upsell.
-- Reuses the Leads entitlement and the canonical tenant/RLS contract.

create table if not exists public.crm_client_growth (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null,
  feedback_task_id uuid,
  feedback_status text not null default 'idle'
    check (feedback_status in ('idle','requested','received')),
  feedback_score smallint
    check (feedback_score is null or feedback_score between 1 and 5),
  feedback_note text,
  feedback_requested_at timestamptz,
  feedback_received_at timestamptz,
  review_status text not null default 'idle'
    check (review_status in ('idle','requested','completed','declined')),
  review_requested_at timestamptz,
  review_completed_at timestamptz,
  referral_status text not null default 'idle'
    check (referral_status in ('idle','requested','received','declined')),
  referral_requested_at timestamptz,
  referral_received_at timestamptz,
  upsell_status text not null default 'idle'
    check (upsell_status in ('idle','scheduled','offered','dismissed')),
  upsell_next_at timestamptz,
  upsell_hint text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, client_id),
  constraint crm_client_growth_client_fk
    foreign key (organization_id, client_id)
    references public.crm_leads(organization_id, id)
    on delete cascade,
  constraint crm_client_growth_feedback_task_fk
    foreign key (organization_id, feedback_task_id)
    references public.ops_tasks(organization_id, id)
    on delete set null (feedback_task_id)
);

create index if not exists crm_client_growth_org_feedback_idx
  on public.crm_client_growth(organization_id, feedback_status, feedback_received_at desc);
create index if not exists crm_client_growth_org_review_idx
  on public.crm_client_growth(organization_id, review_status, review_completed_at desc);
create index if not exists crm_client_growth_org_referral_idx
  on public.crm_client_growth(organization_id, referral_status, referral_received_at desc);
create index if not exists crm_client_growth_org_upsell_idx
  on public.crm_client_growth(organization_id, upsell_next_at)
  where upsell_next_at is not null;

drop trigger if exists crm_client_growth_set_updated_at on public.crm_client_growth;
create trigger crm_client_growth_set_updated_at
before update on public.crm_client_growth
for each row execute function public.set_updated_at();

alter table public.crm_client_growth enable row level security;

drop policy if exists crm_client_growth_select_member on public.crm_client_growth;
create policy crm_client_growth_select_member
on public.crm_client_growth
for select to authenticated
using (private.is_org_member(organization_id));

drop policy if exists crm_client_growth_insert_operator on public.crm_client_growth;
create policy crm_client_growth_insert_operator
on public.crm_client_growth
for insert to authenticated
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_client_growth.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin','manager','member')
      and m.access_status = 'active'
  )
);

drop policy if exists crm_client_growth_update_operator on public.crm_client_growth;
create policy crm_client_growth_update_operator
on public.crm_client_growth
for update to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_client_growth.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin','manager','member')
      and m.access_status = 'active'
  )
)
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_client_growth.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin','manager','member')
      and m.access_status = 'active'
  )
);

drop policy if exists crm_client_growth_delete_operator on public.crm_client_growth;
create policy crm_client_growth_delete_operator
on public.crm_client_growth
for delete to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_client_growth.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin','manager')
      and m.access_status = 'active'
  )
);

drop policy if exists billing_entitlement_guard on public.crm_client_growth;
create policy billing_entitlement_guard
on public.crm_client_growth
as restrictive for all to authenticated
using (private.is_billing_module_allowed(organization_id, 'leads'))
with check (private.is_billing_module_allowed(organization_id, 'leads'));

grant select, insert, update, delete on public.crm_client_growth to authenticated;
revoke all on public.crm_client_growth from anon;
