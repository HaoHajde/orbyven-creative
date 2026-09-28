-- ORBYVEN Chat 1 ownership: Calendar module only.
-- Consumes canonical organizations/membership plus optional CRM and Tasks relations.
-- Does not modify Auth, organizations, onboarding, Control Center, billing, entitlements or legal.

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null default 'appointment'
    check (event_type in ('appointment', 'work', 'follow_up', 'internal')),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  title text not null check (char_length(trim(title)) > 0),
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  client_id uuid,
  task_id uuid,
  assignee text,
  location text,
  notes text,
  reminder_minutes integer check (reminder_minutes is null or reminder_minutes >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint calendar_events_time_check check (end_at > start_at),
  constraint calendar_events_client_fk
    foreign key (organization_id, client_id)
    references public.crm_leads(organization_id, id)
    on delete restrict,
  constraint calendar_events_task_fk
    foreign key (organization_id, task_id)
    references public.ops_tasks(organization_id, id)
    on delete restrict
);

create index if not exists calendar_events_org_start_idx
  on public.calendar_events(organization_id, start_at);
create index if not exists calendar_events_org_status_start_idx
  on public.calendar_events(organization_id, status, start_at);
create index if not exists calendar_events_org_client_idx
  on public.calendar_events(organization_id, client_id)
  where client_id is not null;
create index if not exists calendar_events_org_task_idx
  on public.calendar_events(organization_id, task_id)
  where task_id is not null;
create index if not exists calendar_events_created_by_idx
  on public.calendar_events(created_by);

drop trigger if exists calendar_events_set_updated_at on public.calendar_events;
create trigger calendar_events_set_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();

alter table public.calendar_events enable row level security;

create policy "calendar_events_select_member"
on public.calendar_events
for select to authenticated
using (private.is_org_member(organization_id));

create policy "calendar_events_insert_operator"
on public.calendar_events
for insert to authenticated
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = calendar_events.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
);

create policy "calendar_events_update_operator"
on public.calendar_events
for update to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = calendar_events.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
)
with check (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = calendar_events.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager', 'member')
  )
);

create policy "calendar_events_delete_operator"
on public.calendar_events
for delete to authenticated
using (
  private.is_org_member(organization_id)
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = calendar_events.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager')
  )
);

grant select, insert, update, delete on public.calendar_events to authenticated;
revoke all on public.calendar_events from anon;
