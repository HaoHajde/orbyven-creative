-- ORBYVEN 1.0 universal custom fields foundation.
-- Definitions are organization configuration (owner/admin only).
-- Values are normal workspace data (all non-viewer members may write).
-- The generic entity_type/entity_id pair keeps the foundation independent from vertical modules.

create table if not exists public.workspace_custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type ~ '^[a-z][a-z0-9_-]{0,63}$'),
  field_key text not null check (field_key ~ '^[a-z][a-z0-9_]{0,62}$'),
  label text not null check (char_length(trim(label)) between 1 and 120),
  field_type text not null check (
    field_type in (
      'text',
      'textarea',
      'number',
      'date',
      'datetime',
      'boolean',
      'select',
      'multi_select',
      'url',
      'email',
      'phone'
    )
  ),
  config jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  required boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, entity_type, field_key),
  unique (organization_id, id, entity_type)
);

create table if not exists public.workspace_custom_field_values (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  definition_id uuid not null,
  entity_type text not null check (entity_type ~ '^[a-z][a-z0-9_-]{0,63}$'),
  entity_id text not null check (char_length(trim(entity_id)) between 1 and 160),
  value jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_custom_field_values_definition_fk
    foreign key (organization_id, definition_id, entity_type)
    references public.workspace_custom_field_definitions (organization_id, id, entity_type)
    on delete cascade,
  unique (organization_id, definition_id, entity_type, entity_id)
);

create index if not exists workspace_custom_field_definitions_org_entity_idx
  on public.workspace_custom_field_definitions (organization_id, entity_type, active, sort_order, id);

create index if not exists workspace_custom_field_values_entity_idx
  on public.workspace_custom_field_values (organization_id, entity_type, entity_id);

create index if not exists workspace_custom_field_values_definition_idx
  on public.workspace_custom_field_values (organization_id, definition_id);

drop trigger if exists workspace_custom_field_definitions_set_updated_at
  on public.workspace_custom_field_definitions;
create trigger workspace_custom_field_definitions_set_updated_at
  before update on public.workspace_custom_field_definitions
  for each row execute function public.set_updated_at();

drop trigger if exists workspace_custom_field_values_set_updated_at
  on public.workspace_custom_field_values;
create trigger workspace_custom_field_values_set_updated_at
  before update on public.workspace_custom_field_values
  for each row execute function public.set_updated_at();

create or replace function private.can_write_custom_fields(target_org uuid)
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
      and m.role in ('owner', 'admin', 'manager', 'member')
  );
$$;

revoke all on function private.can_write_custom_fields(uuid) from public, anon;
grant execute on function private.can_write_custom_fields(uuid) to authenticated;

alter table public.workspace_custom_field_definitions enable row level security;
alter table public.workspace_custom_field_values enable row level security;

create policy "custom_field_definitions_select_member"
  on public.workspace_custom_field_definitions
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy "custom_field_definitions_insert_admin"
  on public.workspace_custom_field_definitions
  for insert
  to authenticated
  with check (private.is_org_admin(organization_id));

create policy "custom_field_definitions_update_admin"
  on public.workspace_custom_field_definitions
  for update
  to authenticated
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "custom_field_definitions_delete_admin"
  on public.workspace_custom_field_definitions
  for delete
  to authenticated
  using (private.is_org_admin(organization_id));

create policy "custom_field_values_select_member"
  on public.workspace_custom_field_values
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy "custom_field_values_insert_writer"
  on public.workspace_custom_field_values
  for insert
  to authenticated
  with check (private.can_write_custom_fields(organization_id));

create policy "custom_field_values_update_writer"
  on public.workspace_custom_field_values
  for update
  to authenticated
  using (private.can_write_custom_fields(organization_id))
  with check (private.can_write_custom_fields(organization_id));

create policy "custom_field_values_delete_writer"
  on public.workspace_custom_field_values
  for delete
  to authenticated
  using (private.can_write_custom_fields(organization_id));

-- Data API grants are explicit because Supabase is removing automatic public-schema exposure.
revoke all on table public.workspace_custom_field_definitions from anon;
revoke all on table public.workspace_custom_field_values from anon;

grant select, insert, update, delete
  on table public.workspace_custom_field_definitions
  to authenticated, service_role;

grant select, insert, update, delete
  on table public.workspace_custom_field_values
  to authenticated, service_role;
