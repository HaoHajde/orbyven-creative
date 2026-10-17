-- ORBYVEN 1.0 reusable create-template foundation.
-- Templates are inert tenant-scoped prefills. They do not execute mutations and
-- cannot retain contextual relationships, workflow status or absolute scheduling.

create or replace function private.is_valid_workspace_reusable_template_payload(
  template_entity_type text,
  template_payload jsonb
)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  item jsonb;
begin
  if template_payload is null
     or jsonb_typeof(template_payload) <> 'object'
     or pg_column_size(template_payload) > 32768 then
    return false;
  end if;

  if template_entity_type = 'ops_tasks' then
    if exists (
      select 1
      from jsonb_object_keys(template_payload) as keys(key)
      where key not in ('title', 'kind', 'priority', 'description', 'location', 'estimatedMinutes')
    ) then
      return false;
    end if;

    if not (template_payload ? 'title')
       or jsonb_typeof(template_payload -> 'title') <> 'string'
       or char_length(trim(template_payload ->> 'title')) not between 1 and 160 then
      return false;
    end if;

    if template_payload ? 'kind' and (
      jsonb_typeof(template_payload -> 'kind') <> 'string'
      or (template_payload ->> 'kind') not in ('task', 'work', 'order')
    ) then
      return false;
    end if;

    if template_payload ? 'priority' and (
      jsonb_typeof(template_payload -> 'priority') <> 'string'
      or (template_payload ->> 'priority') not in ('low', 'normal', 'high', 'urgent')
    ) then
      return false;
    end if;

    if template_payload ? 'description' and (
      jsonb_typeof(template_payload -> 'description') <> 'string'
      or char_length(template_payload ->> 'description') > 4000
    ) then
      return false;
    end if;

    if template_payload ? 'location' and (
      jsonb_typeof(template_payload -> 'location') <> 'string'
      or char_length(template_payload ->> 'location') > 240
    ) then
      return false;
    end if;

    if template_payload ? 'estimatedMinutes' and (
      jsonb_typeof(template_payload -> 'estimatedMinutes') <> 'number'
      or (template_payload ->> 'estimatedMinutes')::numeric < 0
      or (template_payload ->> 'estimatedMinutes')::numeric > 100000
      or trunc((template_payload ->> 'estimatedMinutes')::numeric) <> (template_payload ->> 'estimatedMinutes')::numeric
    ) then
      return false;
    end if;

  elsif template_entity_type = 'calendar_events' then
    if exists (
      select 1
      from jsonb_object_keys(template_payload) as keys(key)
      where key not in ('title', 'eventType', 'allDay', 'durationMinutes', 'location', 'notes', 'reminderMinutes')
    ) then
      return false;
    end if;

    if not (template_payload ? 'title')
       or jsonb_typeof(template_payload -> 'title') <> 'string'
       or char_length(trim(template_payload ->> 'title')) not between 1 and 160 then
      return false;
    end if;

    if template_payload ? 'eventType' and (
      jsonb_typeof(template_payload -> 'eventType') <> 'string'
      or (template_payload ->> 'eventType') not in ('appointment', 'work', 'follow_up', 'internal')
    ) then
      return false;
    end if;

    if template_payload ? 'allDay'
       and jsonb_typeof(template_payload -> 'allDay') <> 'boolean' then
      return false;
    end if;

    if not (template_payload ? 'durationMinutes')
       or jsonb_typeof(template_payload -> 'durationMinutes') <> 'number'
       or (template_payload ->> 'durationMinutes')::numeric <= 0
       or (template_payload ->> 'durationMinutes')::numeric > 525600
       or trunc((template_payload ->> 'durationMinutes')::numeric) <> (template_payload ->> 'durationMinutes')::numeric then
      return false;
    end if;

    if template_payload ? 'location' and (
      jsonb_typeof(template_payload -> 'location') <> 'string'
      or char_length(template_payload ->> 'location') > 240
    ) then
      return false;
    end if;

    if template_payload ? 'notes' and (
      jsonb_typeof(template_payload -> 'notes') <> 'string'
      or char_length(template_payload ->> 'notes') > 4000
    ) then
      return false;
    end if;

    if template_payload ? 'reminderMinutes' and (
      jsonb_typeof(template_payload -> 'reminderMinutes') <> 'number'
      or (template_payload ->> 'reminderMinutes')::numeric < 0
      or (template_payload ->> 'reminderMinutes')::numeric > 10080
      or trunc((template_payload ->> 'reminderMinutes')::numeric) <> (template_payload ->> 'reminderMinutes')::numeric
    ) then
      return false;
    end if;

  elsif template_entity_type = 'sales_estimates' then
    if exists (
      select 1
      from jsonb_object_keys(template_payload) as keys(key)
      where key not in ('title', 'currency', 'discountLei', 'taxRate', 'notes', 'plannedLaborLei', 'otherCostLei', 'items')
    ) then
      return false;
    end if;

    if not (template_payload ? 'title')
       or jsonb_typeof(template_payload -> 'title') <> 'string'
       or char_length(trim(template_payload ->> 'title')) not between 1 and 160 then
      return false;
    end if;

    if template_payload ? 'currency' and (
      jsonb_typeof(template_payload -> 'currency') <> 'string'
      or (template_payload ->> 'currency') !~ '^[A-Z]{3,8}$'
    ) then
      return false;
    end if;

    if template_payload ? 'discountLei' and (
      jsonb_typeof(template_payload -> 'discountLei') <> 'number'
      or (template_payload ->> 'discountLei')::numeric < 0
    ) then
      return false;
    end if;

    if template_payload ? 'taxRate' and (
      jsonb_typeof(template_payload -> 'taxRate') not in ('number', 'null')
      or (
        jsonb_typeof(template_payload -> 'taxRate') = 'number'
        and (
          (template_payload ->> 'taxRate')::numeric < 0
          or (template_payload ->> 'taxRate')::numeric > 100
        )
      )
    ) then
      return false;
    end if;

    if template_payload ? 'notes' and (
      jsonb_typeof(template_payload -> 'notes') <> 'string'
      or char_length(template_payload ->> 'notes') > 4000
    ) then
      return false;
    end if;

    if template_payload ? 'plannedLaborLei' and (
      jsonb_typeof(template_payload -> 'plannedLaborLei') <> 'number'
      or (template_payload ->> 'plannedLaborLei')::numeric < 0
    ) then
      return false;
    end if;

    if template_payload ? 'otherCostLei' and (
      jsonb_typeof(template_payload -> 'otherCostLei') <> 'number'
      or (template_payload ->> 'otherCostLei')::numeric < 0
    ) then
      return false;
    end if;

    if not (template_payload ? 'items')
       or jsonb_typeof(template_payload -> 'items') <> 'array'
       or jsonb_array_length(template_payload -> 'items') < 1
       or jsonb_array_length(template_payload -> 'items') > 100 then
      return false;
    end if;

    for item in select value from jsonb_array_elements(template_payload -> 'items') loop
      if jsonb_typeof(item) <> 'object' then
        return false;
      end if;
      if exists (
        select 1
        from jsonb_object_keys(item) as item_keys(key)
        where key not in ('description', 'quantity', 'unitPriceLei')
      ) then
        return false;
      end if;
      if not (item ? 'description')
         or jsonb_typeof(item -> 'description') <> 'string'
         or char_length(trim(item ->> 'description')) not between 1 and 300 then
        return false;
      end if;
      if not (item ? 'quantity')
         or jsonb_typeof(item -> 'quantity') <> 'number'
         or (item ->> 'quantity')::numeric <= 0 then
        return false;
      end if;
      if not (item ? 'unitPriceLei')
         or jsonb_typeof(item -> 'unitPriceLei') <> 'number'
         or (item ->> 'unitPriceLei')::numeric < 0 then
        return false;
      end if;
    end loop;

  else
    return false;
  end if;

  return true;
exception
  when others then
    return false;
end;
$$;

revoke all on function private.is_valid_workspace_reusable_template_payload(text, jsonb) from public, anon;
grant execute on function private.is_valid_workspace_reusable_template_payload(text, jsonb)
  to authenticated, service_role;

create table if not exists public.workspace_reusable_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_key text not null check (template_key ~ '^[a-z][a-z0-9_]{0,62}$'),
  entity_type text not null check (entity_type in ('ops_tasks', 'calendar_events', 'sales_estimates')),
  name text not null check (char_length(trim(name)) between 1 and 100),
  description text check (description is null or char_length(description) <= 500),
  payload jsonb not null,
  schema_version smallint not null default 1 check (schema_version = 1),
  active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_reusable_templates_payload_check
    check (private.is_valid_workspace_reusable_template_payload(entity_type, payload)),
  unique (organization_id, template_key)
);

create index if not exists workspace_reusable_templates_org_entity_idx
  on public.workspace_reusable_templates (organization_id, entity_type, active, sort_order, id);

drop trigger if exists workspace_reusable_templates_set_updated_at
  on public.workspace_reusable_templates;
create trigger workspace_reusable_templates_set_updated_at
  before update on public.workspace_reusable_templates
  for each row execute function public.set_updated_at();

create or replace function private.can_manage_workspace_reusable_templates(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.access_status = 'active'
      and m.role in ('owner', 'admin', 'manager', 'member')
  );
$$;

revoke all on function private.can_manage_workspace_reusable_templates(uuid) from public, anon;
grant execute on function private.can_manage_workspace_reusable_templates(uuid)
  to authenticated, service_role;

alter table public.workspace_reusable_templates enable row level security;

create policy "workspace_reusable_templates_select_member"
  on public.workspace_reusable_templates
  for select to authenticated
  using (private.is_org_member(organization_id));

create policy "workspace_reusable_templates_insert_writer"
  on public.workspace_reusable_templates
  for insert to authenticated
  with check (private.can_manage_workspace_reusable_templates(organization_id));

create policy "workspace_reusable_templates_update_writer"
  on public.workspace_reusable_templates
  for update to authenticated
  using (private.can_manage_workspace_reusable_templates(organization_id))
  with check (private.can_manage_workspace_reusable_templates(organization_id));

create policy "workspace_reusable_templates_delete_writer"
  on public.workspace_reusable_templates
  for delete to authenticated
  using (private.can_manage_workspace_reusable_templates(organization_id));

revoke all on table public.workspace_reusable_templates from anon;

grant select, insert, update, delete
  on table public.workspace_reusable_templates
  to authenticated, service_role;
