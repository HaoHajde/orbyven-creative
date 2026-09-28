-- Alpha 0.65: one bounded, versioned schematic per existing work task.
-- All access stays under existing task entitlement and active organization membership.
create table if not exists public.thermal_sketches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null,
  plan jsonb not null default '{}'::jsonb,
  revision integer not null default 0 check (revision >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,task_id),
  constraint thermal_sketches_work_fk foreign key (organization_id,task_id)
    references public.ops_tasks(organization_id,id) on delete cascade,
  constraint thermal_sketches_plan_object_check check (jsonb_typeof(plan)='object'),
  constraint thermal_sketches_plan_size_check check (octet_length(plan::text) <= 250000)
);
create index if not exists thermal_sketches_org_updated_idx on public.thermal_sketches(organization_id,updated_at desc);
drop trigger if exists thermal_sketches_updated_at on public.thermal_sketches;
create trigger thermal_sketches_updated_at before update on public.thermal_sketches
for each row execute function public.set_updated_at();
alter table public.thermal_sketches enable row level security;
drop policy if exists thermal_sketches_select on public.thermal_sketches;
create policy thermal_sketches_select on public.thermal_sketches
for select to authenticated using (private.is_org_member(organization_id));
drop policy if exists thermal_sketches_insert on public.thermal_sketches;
create policy thermal_sketches_insert on public.thermal_sketches
for insert to authenticated with check (
  private.is_org_member(organization_id)
  and exists (select 1 from public.organization_members m
    where m.organization_id=thermal_sketches.organization_id and m.user_id=(select auth.uid())
    and m.access_status='active' and m.role in ('owner','admin','manager','member'))
  and exists (select 1 from public.ops_tasks t where t.organization_id=thermal_sketches.organization_id
    and t.id=thermal_sketches.task_id and t.kind='work')
);
drop policy if exists thermal_sketches_update on public.thermal_sketches;
create policy thermal_sketches_update on public.thermal_sketches
for update to authenticated using (
  private.is_org_member(organization_id)
  and exists (select 1 from public.organization_members m
    where m.organization_id=thermal_sketches.organization_id and m.user_id=(select auth.uid())
    and m.access_status='active' and m.role in ('owner','admin','manager','member'))
) with check (
  private.is_org_member(organization_id)
  and exists (select 1 from public.organization_members m
    where m.organization_id=thermal_sketches.organization_id and m.user_id=(select auth.uid())
    and m.access_status='active' and m.role in ('owner','admin','manager','member'))
  and exists (select 1 from public.ops_tasks t where t.organization_id=thermal_sketches.organization_id
    and t.id=thermal_sketches.task_id and t.kind='work')
);
drop policy if exists thermal_sketches_delete on public.thermal_sketches;
create policy thermal_sketches_delete on public.thermal_sketches
for delete to authenticated using (
  private.is_org_member(organization_id)
  and exists (select 1 from public.organization_members m
    where m.organization_id=thermal_sketches.organization_id and m.user_id=(select auth.uid())
    and m.access_status='active' and m.role in ('owner','admin','manager'))
);
drop policy if exists billing_entitlement_guard on public.thermal_sketches;
create policy billing_entitlement_guard on public.thermal_sketches
as restrictive for all to authenticated
using (private.is_billing_module_allowed(organization_id,'tasks'))
with check (private.is_billing_module_allowed(organization_id,'tasks'));
grant select,insert,update,delete on public.thermal_sketches to authenticated;
revoke all on public.thermal_sketches from anon;
