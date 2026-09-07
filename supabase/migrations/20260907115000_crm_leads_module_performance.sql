-- Chat 1 / Leads module follow-up only.
-- Optimizes module-owned policies and foreign keys without changing Platform Core.

create index if not exists crm_leads_created_by_idx
  on public.crm_leads(created_by);

create index if not exists crm_lead_activities_created_by_idx
  on public.crm_lead_activities(created_by);

drop policy if exists "crm_leads_insert_operator" on public.crm_leads;
create policy "crm_leads_insert_operator"
on public.crm_leads
for insert to authenticated
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_leads.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
);

drop policy if exists "crm_leads_update_operator" on public.crm_leads;
create policy "crm_leads_update_operator"
on public.crm_leads
for update to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_leads.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
)
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_leads.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
);

drop policy if exists "crm_leads_delete_operator" on public.crm_leads;
create policy "crm_leads_delete_operator"
on public.crm_leads
for delete to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_leads.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager')
  )
);

drop policy if exists "crm_lead_activities_insert_operator" on public.crm_lead_activities;
create policy "crm_lead_activities_insert_operator"
on public.crm_lead_activities
for insert to authenticated
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_lead_activities.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
);

drop policy if exists "crm_lead_activities_update_operator" on public.crm_lead_activities;
create policy "crm_lead_activities_update_operator"
on public.crm_lead_activities
for update to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_lead_activities.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
)
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_lead_activities.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
);

drop policy if exists "crm_lead_activities_delete_operator" on public.crm_lead_activities;
create policy "crm_lead_activities_delete_operator"
on public.crm_lead_activities
for delete to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_lead_activities.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager')
  )
);
