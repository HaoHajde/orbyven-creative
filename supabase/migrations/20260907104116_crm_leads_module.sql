-- ORBYVEN Chat 1 ownership: Leads / Client Workspace module only.
-- Consumes the canonical organization/auth contract from Platform Core.
-- Does not modify organizations, auth, onboarding, billing or entitlements.

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null default 'lead' check (kind in ('lead', 'client')),
  stage text not null default 'new' check (stage in ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  name text not null check (char_length(trim(name)) > 0),
  company text,
  email text,
  phone text,
  source text,
  note text,
  estimated_value numeric(12, 2) check (estimated_value is null or estimated_value >= 0),
  currency text not null default 'RON' check (char_length(currency) between 3 and 8),
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  converted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

create table if not exists public.crm_lead_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  lead_id uuid not null,
  kind text not null default 'note' check (kind in ('note', 'call', 'email', 'meeting', 'status')),
  body text not null check (char_length(trim(body)) > 0),
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint crm_lead_activities_lead_fk
    foreign key (organization_id, lead_id)
    references public.crm_leads(organization_id, id)
    on delete cascade
);

create index if not exists crm_leads_org_created_idx
  on public.crm_leads(organization_id, created_at desc);
create index if not exists crm_leads_org_stage_idx
  on public.crm_leads(organization_id, stage);
create index if not exists crm_leads_org_kind_idx
  on public.crm_leads(organization_id, kind);
create index if not exists crm_leads_org_follow_up_idx
  on public.crm_leads(organization_id, next_follow_up_at)
  where next_follow_up_at is not null;
create index if not exists crm_lead_activities_org_lead_idx
  on public.crm_lead_activities(organization_id, lead_id, occurred_at desc);

drop trigger if exists crm_leads_set_updated_at on public.crm_leads;
create trigger crm_leads_set_updated_at
before update on public.crm_leads
for each row execute function public.set_updated_at();

alter table public.crm_leads enable row level security;
alter table public.crm_lead_activities enable row level security;

-- Read access follows Platform Core membership.
create policy "crm_leads_select_member"
on public.crm_leads
for select to authenticated
using (private.is_org_member(organization_id));

create policy "crm_lead_activities_select_member"
on public.crm_lead_activities
for select to authenticated
using (private.is_org_member(organization_id));

-- Viewer is intentionally read-only. Other organization roles can operate the module.
create policy "crm_leads_insert_operator"
on public.crm_leads
for insert to authenticated
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_leads.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
);

create policy "crm_leads_update_operator"
on public.crm_leads
for update to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_leads.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
)
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_leads.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
);

create policy "crm_leads_delete_operator"
on public.crm_leads
for delete to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_leads.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'manager')
  )
);

create policy "crm_lead_activities_insert_operator"
on public.crm_lead_activities
for insert to authenticated
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_lead_activities.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
);

create policy "crm_lead_activities_update_operator"
on public.crm_lead_activities
for update to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_lead_activities.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
)
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_lead_activities.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
);

create policy "crm_lead_activities_delete_operator"
on public.crm_lead_activities
for delete to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_lead_activities.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'manager')
  )
);

grant select, insert, update, delete on public.crm_leads to authenticated;
grant select, insert, update, delete on public.crm_lead_activities to authenticated;
revoke all on public.crm_leads from anon;
revoke all on public.crm_lead_activities from anon;
