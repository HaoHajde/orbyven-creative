-- ORBYVEN Chat 1 ownership: Tasks / Work module only.
-- Consumes canonical organizations, membership helpers and the optional CRM client relation.
-- Does not modify Auth, organizations, onboarding, Control Center, billing or entitlements.

create table if not exists public.ops_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null default 'task' check (kind in ('task', 'work')),
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  title text not null check (char_length(trim(title)) > 0),
  description text,
  client_id uuid,
  assignee text,
  location text,
  scheduled_at timestamptz,
  due_at timestamptz,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes >= 0),
  progress smallint not null default 0 check (progress between 0 and 100),
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint ops_tasks_client_fk
    foreign key (organization_id, client_id)
    references public.crm_leads(organization_id, id)
    on delete restrict
);

create table if not exists public.ops_task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  task_id uuid not null,
  title text not null check (char_length(trim(title)) > 0),
  done boolean not null default false,
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ops_task_checklist_task_fk
    foreign key (organization_id, task_id)
    references public.ops_tasks(organization_id, id)
    on delete cascade
);

create index if not exists ops_tasks_org_status_idx
  on public.ops_tasks(organization_id, status, updated_at desc);
create index if not exists ops_tasks_org_due_idx
  on public.ops_tasks(organization_id, due_at)
  where due_at is not null;
create index if not exists ops_tasks_org_client_idx
  on public.ops_tasks(organization_id, client_id)
  where client_id is not null;
create index if not exists ops_tasks_created_by_idx
  on public.ops_tasks(created_by);
create index if not exists ops_task_checklist_org_task_idx
  on public.ops_task_checklist_items(organization_id, task_id, position, created_at);
create index if not exists ops_task_checklist_created_by_idx
  on public.ops_task_checklist_items(created_by);

drop trigger if exists ops_tasks_set_updated_at on public.ops_tasks;
create trigger ops_tasks_set_updated_at
before update on public.ops_tasks
for each row execute function public.set_updated_at();

drop trigger if exists ops_task_checklist_set_updated_at on public.ops_task_checklist_items;
create trigger ops_task_checklist_set_updated_at
before update on public.ops_task_checklist_items
for each row execute function public.set_updated_at();

alter table public.ops_tasks enable row level security;
alter table public.ops_task_checklist_items enable row level security;

create policy "ops_tasks_select_member"
on public.ops_tasks
for select to authenticated
using (private.is_org_member(organization_id));

create policy "ops_task_checklist_select_member"
on public.ops_task_checklist_items
for select to authenticated
using (private.is_org_member(organization_id));

-- Viewer is read-only. Owner/admin/manager/member can operate work items.
create policy "ops_tasks_insert_operator"
on public.ops_tasks
for insert to authenticated
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_tasks.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
);

create policy "ops_tasks_update_operator"
on public.ops_tasks
for update to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_tasks.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
)
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_tasks.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
);

create policy "ops_tasks_delete_operator"
on public.ops_tasks
for delete to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_tasks.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager')
  )
);

create policy "ops_task_checklist_insert_operator"
on public.ops_task_checklist_items
for insert to authenticated
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_task_checklist_items.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
);

create policy "ops_task_checklist_update_operator"
on public.ops_task_checklist_items
for update to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_task_checklist_items.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
)
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_task_checklist_items.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
);

create policy "ops_task_checklist_delete_operator"
on public.ops_task_checklist_items
for delete to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_task_checklist_items.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager')
  )
);

grant select, insert, update, delete on public.ops_tasks to authenticated;
grant select, insert, update, delete on public.ops_task_checklist_items to authenticated;
revoke all on public.ops_tasks from anon;
revoke all on public.ops_task_checklist_items from anon;
