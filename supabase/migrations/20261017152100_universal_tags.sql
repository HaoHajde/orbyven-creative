-- ORBYVEN 1.0 universal tags foundation.
-- Tag taxonomy is organization configuration; assignments are normal workspace metadata.

create table if not exists public.workspace_tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tag_key text not null check (tag_key ~ '^[a-z][a-z0-9_]{0,62}$'),
  name text not null check (char_length(trim(name)) between 1 and 80),
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, tag_key),
  unique (organization_id, id)
);

create table if not exists public.workspace_tag_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tag_id uuid not null,
  entity_type text not null check (entity_type ~ '^[a-z][a-z0-9_-]{0,63}$'),
  entity_id text not null check (char_length(trim(entity_id)) between 1 and 160),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint workspace_tag_assignments_tag_fk
    foreign key (organization_id, tag_id)
    references public.workspace_tags (organization_id, id)
    on delete cascade,
  unique (organization_id, tag_id, entity_type, entity_id)
);

create index if not exists workspace_tags_org_active_idx
  on public.workspace_tags (organization_id, active, sort_order, id);

create index if not exists workspace_tag_assignments_entity_idx
  on public.workspace_tag_assignments (organization_id, entity_type, entity_id);

create index if not exists workspace_tag_assignments_tag_idx
  on public.workspace_tag_assignments (organization_id, tag_id);

drop trigger if exists workspace_tags_set_updated_at on public.workspace_tags;
create trigger workspace_tags_set_updated_at
  before update on public.workspace_tags
  for each row execute function public.set_updated_at();

create or replace function private.can_assign_workspace_tags(target_org uuid)
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

revoke all on function private.can_assign_workspace_tags(uuid) from public, anon;
grant execute on function private.can_assign_workspace_tags(uuid) to authenticated;

alter table public.workspace_tags enable row level security;
alter table public.workspace_tag_assignments enable row level security;

create policy "workspace_tags_select_member"
  on public.workspace_tags
  for select to authenticated
  using (private.is_org_member(organization_id));

create policy "workspace_tags_insert_admin"
  on public.workspace_tags
  for insert to authenticated
  with check (private.is_org_admin(organization_id));

create policy "workspace_tags_update_admin"
  on public.workspace_tags
  for update to authenticated
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "workspace_tags_delete_admin"
  on public.workspace_tags
  for delete to authenticated
  using (private.is_org_admin(organization_id));

create policy "workspace_tag_assignments_select_member"
  on public.workspace_tag_assignments
  for select to authenticated
  using (private.is_org_member(organization_id));

create policy "workspace_tag_assignments_insert_writer"
  on public.workspace_tag_assignments
  for insert to authenticated
  with check (private.can_assign_workspace_tags(organization_id));

create policy "workspace_tag_assignments_delete_writer"
  on public.workspace_tag_assignments
  for delete to authenticated
  using (private.can_assign_workspace_tags(organization_id));

revoke all on table public.workspace_tags from anon;
revoke all on table public.workspace_tag_assignments from anon;

grant select, insert, update, delete
  on table public.workspace_tags
  to authenticated, service_role;

grant select, insert, delete
  on table public.workspace_tag_assignments
  to authenticated, service_role;
