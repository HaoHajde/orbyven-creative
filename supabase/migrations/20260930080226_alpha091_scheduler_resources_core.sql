-- ORBYVEN Alpha 0.9.1 — Scheduler & Resources Core
-- Universal schedulable resources over the existing Calendar + Team modules.

create table if not exists public.ops_resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  resource_type text not null
    check (resource_type in ('person','crew','vehicle','equipment','space')),
  name text not null check (char_length(trim(name)) between 1 and 180),
  code text,
  team_member_id uuid,
  capacity integer not null default 1 check (capacity between 1 and 100),
  active boolean not null default true,
  location text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint ops_resources_team_member_fk
    foreign key (organization_id, team_member_id)
    references public.people_team_members(organization_id, id)
    on delete set null
);

create unique index if not exists ops_resources_team_member_unique
  on public.ops_resources(organization_id, team_member_id)
  where team_member_id is not null;
create index if not exists ops_resources_org_active_idx
  on public.ops_resources(organization_id, active, resource_type, name);
create index if not exists ops_resources_created_by_idx
  on public.ops_resources(created_by)
  where created_by is not null;

drop trigger if exists ops_resources_updated_at on public.ops_resources;
create trigger ops_resources_updated_at
before update on public.ops_resources
for each row execute function public.set_updated_at();

create table if not exists public.calendar_event_resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null,
  resource_id uuid not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, event_id, resource_id),
  constraint calendar_event_resources_event_fk
    foreign key (organization_id, event_id)
    references public.calendar_events(organization_id, id)
    on delete cascade,
  constraint calendar_event_resources_resource_fk
    foreign key (organization_id, resource_id)
    references public.ops_resources(organization_id, id)
    on delete restrict
);

create index if not exists calendar_event_resources_event_idx
  on public.calendar_event_resources(organization_id, event_id);
create index if not exists calendar_event_resources_resource_idx
  on public.calendar_event_resources(organization_id, resource_id, event_id);
create index if not exists calendar_event_resources_created_by_idx
  on public.calendar_event_resources(created_by)
  where created_by is not null;

create table if not exists public.ops_resource_unavailability (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  resource_id uuid not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint ops_resource_unavailability_resource_fk
    foreign key (organization_id, resource_id)
    references public.ops_resources(organization_id, id)
    on delete cascade,
  constraint ops_resource_unavailability_time_check
    check (end_at > start_at)
);

create index if not exists ops_resource_unavailability_resource_time_idx
  on public.ops_resource_unavailability(organization_id, resource_id, start_at, end_at);
create index if not exists ops_resource_unavailability_created_by_idx
  on public.ops_resource_unavailability(created_by)
  where created_by is not null;

drop trigger if exists ops_resource_unavailability_updated_at on public.ops_resource_unavailability;
create trigger ops_resource_unavailability_updated_at
before update on public.ops_resource_unavailability
for each row execute function public.set_updated_at();

create or replace function private.resource_state_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if old.active = true and new.active = false and exists (
    select 1
    from public.calendar_event_resources cer
    join public.calendar_events e
      on e.organization_id = cer.organization_id
     and e.id = cer.event_id
    where cer.organization_id = new.organization_id
      and cer.resource_id = new.id
      and e.status = 'scheduled'
      and e.end_at > pg_catalog.now()
  ) then
    raise exception 'resource_has_future_bookings';
  end if;
  return new;
end
$function$;

drop trigger if exists ops_resources_state_guard on public.ops_resources;
create trigger ops_resources_state_guard
before update of active on public.ops_resources
for each row execute function private.resource_state_guard();

create or replace function private.sync_team_member_resource()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'DELETE' then
    update public.ops_resources
    set active = false,
        team_member_id = null,
        updated_at = pg_catalog.now()
    where organization_id = old.organization_id
      and team_member_id = old.id;
    return old;
  end if;

  insert into public.ops_resources(
    organization_id,
    resource_type,
    name,
    team_member_id,
    capacity,
    active,
    created_by
  )
  values (
    new.organization_id,
    'person',
    new.display_name,
    new.id,
    1,
    new.status = 'active',
    new.created_by
  )
  on conflict (organization_id, team_member_id)
    where team_member_id is not null
  do update set
    name = excluded.name,
    active = excluded.active,
    updated_at = pg_catalog.now();

  return new;
end
$function$;

drop trigger if exists people_team_members_resource_sync on public.people_team_members;
create trigger people_team_members_resource_sync
after insert or update of display_name, status on public.people_team_members
for each row execute function private.sync_team_member_resource();

drop trigger if exists people_team_members_resource_delete_sync on public.people_team_members;
create trigger people_team_members_resource_delete_sync
before delete on public.people_team_members
for each row execute function private.sync_team_member_resource();

insert into public.ops_resources(
  organization_id,
  resource_type,
  name,
  team_member_id,
  capacity,
  active,
  created_by
)
select
  m.organization_id,
  'person',
  m.display_name,
  m.id,
  1,
  m.status = 'active',
  m.created_by
from public.people_team_members m
on conflict (organization_id, team_member_id)
  where team_member_id is not null
do update set
  name = excluded.name,
  active = excluded.active,
  updated_at = pg_catalog.now();

create or replace function private.calendar_resource_assignment_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_event record;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.organization_id::text || ':resource:' || new.resource_id::text, 0)
  );

  if not exists (
    select 1
    from public.ops_resources r
    where r.organization_id = new.organization_id
      and r.id = new.resource_id
      and r.active = true
  ) then
    raise exception 'resource_not_available';
  end if;

  select e.id, e.start_at, e.end_at, e.status
    into current_event
  from public.calendar_events e
  where e.organization_id = new.organization_id
    and e.id = new.event_id;

  if not found then
    raise exception 'calendar_event_not_available';
  end if;

  if current_event.status = 'scheduled' then
    if exists (
      select 1
      from public.calendar_event_resources existing
      join public.calendar_events e
        on e.organization_id = existing.organization_id
       and e.id = existing.event_id
      where existing.organization_id = new.organization_id
        and existing.resource_id = new.resource_id
        and existing.event_id <> new.event_id
        and e.status = 'scheduled'
        and e.start_at < current_event.end_at
        and e.end_at > current_event.start_at
    ) then
      raise exception 'resource_schedule_conflict';
    end if;

    if exists (
      select 1
      from public.ops_resource_unavailability u
      where u.organization_id = new.organization_id
        and u.resource_id = new.resource_id
        and u.start_at < current_event.end_at
        and u.end_at > current_event.start_at
    ) then
      raise exception 'resource_unavailable';
    end if;
  end if;

  new.created_by := coalesce(new.created_by, (select auth.uid()));
  return new;
end
$function$;

drop trigger if exists calendar_event_resources_guard on public.calendar_event_resources;
create trigger calendar_event_resources_guard
before insert on public.calendar_event_resources
for each row execute function private.calendar_resource_assignment_guard();

create or replace function private.calendar_event_resource_time_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  resource_row record;
begin
  if new.status <> 'scheduled' then
    return new;
  end if;

  for resource_row in
    select cer.resource_id
    from public.calendar_event_resources cer
    where cer.organization_id = new.organization_id
      and cer.event_id = new.id
    order by cer.resource_id
  loop
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(new.organization_id::text || ':resource:' || resource_row.resource_id::text, 0)
    );

    if not exists (
      select 1 from public.ops_resources r
      where r.organization_id = new.organization_id
        and r.id = resource_row.resource_id
        and r.active = true
    ) then
      raise exception 'resource_not_available';
    end if;

    if exists (
      select 1
      from public.calendar_event_resources other
      join public.calendar_events e
        on e.organization_id = other.organization_id
       and e.id = other.event_id
      where other.organization_id = new.organization_id
        and other.resource_id = resource_row.resource_id
        and other.event_id <> new.id
        and e.status = 'scheduled'
        and e.start_at < new.end_at
        and e.end_at > new.start_at
    ) then
      raise exception 'resource_schedule_conflict';
    end if;

    if exists (
      select 1
      from public.ops_resource_unavailability u
      where u.organization_id = new.organization_id
        and u.resource_id = resource_row.resource_id
        and u.start_at < new.end_at
        and u.end_at > new.start_at
    ) then
      raise exception 'resource_unavailable';
    end if;
  end loop;

  return new;
end
$function$;

drop trigger if exists calendar_events_resource_time_guard on public.calendar_events;
create trigger calendar_events_resource_time_guard
before update of start_at, end_at, status on public.calendar_events
for each row execute function private.calendar_event_resource_time_guard();

create or replace function private.resource_unavailability_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.organization_id::text || ':resource:' || new.resource_id::text, 0)
  );

  if not exists (
    select 1
    from public.ops_resources r
    where r.organization_id = new.organization_id
      and r.id = new.resource_id
      and r.active = true
  ) then
    raise exception 'resource_not_available';
  end if;

  if exists (
    select 1
    from public.calendar_event_resources cer
    join public.calendar_events e
      on e.organization_id = cer.organization_id
     and e.id = cer.event_id
    where cer.organization_id = new.organization_id
      and cer.resource_id = new.resource_id
      and e.status = 'scheduled'
      and e.start_at < new.end_at
      and e.end_at > new.start_at
  ) then
    raise exception 'resource_schedule_conflict';
  end if;

  if exists (
    select 1
    from public.ops_resource_unavailability u
    where u.organization_id = new.organization_id
      and u.resource_id = new.resource_id
      and u.id <> new.id
      and u.start_at < new.end_at
      and u.end_at > new.start_at
  ) then
    raise exception 'resource_unavailable';
  end if;

  new.created_by := coalesce(new.created_by, (select auth.uid()));
  return new;
end
$function$;

drop trigger if exists ops_resource_unavailability_guard on public.ops_resource_unavailability;
create trigger ops_resource_unavailability_guard
before insert or update of resource_id, start_at, end_at
on public.ops_resource_unavailability
for each row execute function private.resource_unavailability_guard();

create or replace function public.calendar_create_event_with_resources(
  p_organization_id uuid,
  p_title text,
  p_event_type text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_all_day boolean default false,
  p_client_id uuid default null,
  p_task_id uuid default null,
  p_assignee text default null,
  p_location text default null,
  p_notes text default null,
  p_reminder_minutes integer default null,
  p_resource_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  new_event_id uuid;
  effective_client_id uuid := p_client_id;
  task_client_id uuid;
begin
  if pg_catalog.coalesce(pg_catalog.cardinality(p_resource_ids), 0) > 20 then
    raise exception 'too_many_resources';
  end if;

  if p_task_id is not null then
    select t.client_id into task_client_id
    from public.ops_tasks t
    where t.organization_id = p_organization_id
      and t.id = p_task_id
      and t.status <> 'cancelled';

    if not found then
      raise exception 'task_not_available';
    end if;

    if p_client_id is not null and task_client_id is not null and p_client_id <> task_client_id then
      raise exception 'task_client_mismatch';
    end if;
    effective_client_id := pg_catalog.coalesce(task_client_id, p_client_id);
  end if;

  if effective_client_id is not null and not exists (
    select 1 from public.crm_leads c
    where c.organization_id = p_organization_id
      and c.id = effective_client_id
  ) then
    raise exception 'client_not_available';
  end if;

  if exists (
    select 1
    from pg_catalog.unnest(pg_catalog.coalesce(p_resource_ids, '{}'::uuid[])) resource_id
    left join public.ops_resources r
      on r.organization_id = p_organization_id
     and r.id = resource_id
     and r.active = true
    where r.id is null
  ) then
    raise exception 'resource_not_available';
  end if;

  insert into public.calendar_events(
    organization_id,
    event_type,
    title,
    start_at,
    end_at,
    all_day,
    client_id,
    task_id,
    assignee,
    location,
    notes,
    reminder_minutes,
    created_by
  )
  values (
    p_organization_id,
    p_event_type,
    p_title,
    p_start_at,
    p_end_at,
    pg_catalog.coalesce(p_all_day, false),
    effective_client_id,
    p_task_id,
    nullif(pg_catalog.trim(p_assignee), ''),
    nullif(pg_catalog.trim(p_location), ''),
    nullif(pg_catalog.trim(p_notes), ''),
    p_reminder_minutes,
    (select auth.uid())
  )
  returning id into new_event_id;

  insert into public.calendar_event_resources(
    organization_id,
    event_id,
    resource_id,
    created_by
  )
  select
    p_organization_id,
    new_event_id,
    ids.resource_id,
    (select auth.uid())
  from (
    select distinct resource_id
    from pg_catalog.unnest(pg_catalog.coalesce(p_resource_ids, '{}'::uuid[])) resource_id
  ) ids;

  return new_event_id;
end
$function$;

create or replace function public.calendar_set_event_resources(
  p_organization_id uuid,
  p_event_id uuid,
  p_resource_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if pg_catalog.coalesce(pg_catalog.cardinality(p_resource_ids), 0) > 20 then
    raise exception 'too_many_resources';
  end if;

  if not exists (
    select 1
    from public.calendar_events e
    where e.organization_id = p_organization_id
      and e.id = p_event_id
      and e.status <> 'cancelled'
  ) then
    raise exception 'calendar_event_not_available';
  end if;

  if exists (
    select 1
    from pg_catalog.unnest(pg_catalog.coalesce(p_resource_ids, '{}'::uuid[])) resource_id
    left join public.ops_resources r
      on r.organization_id = p_organization_id
     and r.id = resource_id
     and r.active = true
    where r.id is null
  ) then
    raise exception 'resource_not_available';
  end if;

  delete from public.calendar_event_resources
  where organization_id = p_organization_id
    and event_id = p_event_id;

  insert into public.calendar_event_resources(
    organization_id,
    event_id,
    resource_id,
    created_by
  )
  select
    p_organization_id,
    p_event_id,
    ids.resource_id,
    (select auth.uid())
  from (
    select distinct resource_id
    from pg_catalog.unnest(pg_catalog.coalesce(p_resource_ids, '{}'::uuid[])) resource_id
  ) ids;
end
$function$;

alter table public.ops_resources enable row level security;
alter table public.calendar_event_resources enable row level security;
alter table public.ops_resource_unavailability enable row level security;

drop policy if exists ops_resources_select_member on public.ops_resources;
create policy ops_resources_select_member on public.ops_resources
for select to authenticated
using (
  private.is_org_member(organization_id)
  and (
    private.is_billing_module_allowed(organization_id, 'calendar')
    or private.is_billing_module_allowed(organization_id, 'team')
  )
);

drop policy if exists ops_resources_insert_operator on public.ops_resources;
create policy ops_resources_insert_operator on public.ops_resources
for insert to authenticated
with check (
  team_member_id is null
  and private.is_billing_module_allowed(organization_id, 'team')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_resources.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
  )
);

drop policy if exists ops_resources_update_operator on public.ops_resources;
create policy ops_resources_update_operator on public.ops_resources
for update to authenticated
using (
  team_member_id is null
  and private.is_billing_module_allowed(organization_id, 'team')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_resources.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
  )
)
with check (
  team_member_id is null
  and private.is_billing_module_allowed(organization_id, 'team')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_resources.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
  )
);

drop policy if exists calendar_event_resources_select_member on public.calendar_event_resources;
create policy calendar_event_resources_select_member on public.calendar_event_resources
for select to authenticated
using (
  private.is_billing_module_allowed(organization_id, 'calendar')
  and private.is_org_member(organization_id)
);

drop policy if exists calendar_event_resources_insert_operator on public.calendar_event_resources;
create policy calendar_event_resources_insert_operator on public.calendar_event_resources
for insert to authenticated
with check (
  private.is_billing_module_allowed(organization_id, 'calendar')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = calendar_event_resources.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
  )
);

drop policy if exists calendar_event_resources_delete_operator on public.calendar_event_resources;
create policy calendar_event_resources_delete_operator on public.calendar_event_resources
for delete to authenticated
using (
  private.is_billing_module_allowed(organization_id, 'calendar')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = calendar_event_resources.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
  )
);

drop policy if exists ops_resource_unavailability_select_member on public.ops_resource_unavailability;
create policy ops_resource_unavailability_select_member on public.ops_resource_unavailability
for select to authenticated
using (
  private.is_org_member(organization_id)
  and (
    private.is_billing_module_allowed(organization_id, 'calendar')
    or private.is_billing_module_allowed(organization_id, 'team')
  )
);

drop policy if exists ops_resource_unavailability_manage_manager on public.ops_resource_unavailability;
create policy ops_resource_unavailability_manage_manager on public.ops_resource_unavailability
for all to authenticated
using (
  private.is_billing_module_allowed(organization_id, 'team')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_resource_unavailability.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
)
with check (
  private.is_billing_module_allowed(organization_id, 'team')
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = ops_resource_unavailability.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
  )
);

grant select, insert, update on public.ops_resources to authenticated;
grant select, insert, delete on public.calendar_event_resources to authenticated;
grant select, insert, update, delete on public.ops_resource_unavailability to authenticated;

revoke all on public.ops_resources from anon;
revoke all on public.calendar_event_resources from anon;
revoke all on public.ops_resource_unavailability from anon;

revoke all on function public.calendar_create_event_with_resources(
  uuid,text,text,timestamptz,timestamptz,boolean,uuid,uuid,text,text,text,integer,uuid[]
) from public, anon;
grant execute on function public.calendar_create_event_with_resources(
  uuid,text,text,timestamptz,timestamptz,boolean,uuid,uuid,text,text,text,integer,uuid[]
) to authenticated;

revoke all on function public.calendar_set_event_resources(uuid,uuid,uuid[])
  from public, anon;
grant execute on function public.calendar_set_event_resources(uuid,uuid,uuid[])
  to authenticated;

comment on table public.ops_resources is
  'Universal schedulable resources: people, crews, vehicles, equipment and spaces.';
comment on table public.calendar_event_resources is
  'Many-to-many resource assignments for calendar events with database conflict protection.';
