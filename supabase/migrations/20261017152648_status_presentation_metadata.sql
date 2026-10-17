-- ORBYVEN 1.0 configurable status presentation metadata.
-- Canonical workflow status keys remain owned by their domain tables and constraints.
-- This table may override presentation only; it cannot create, remove or transition workflow statuses.

create table if not exists public.workspace_status_presentations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  status_key text not null,
  display_label text not null check (char_length(trim(display_label)) between 1 and 80),
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_status_presentations_system_key_check check (
    (entity_type = 'crm_leads' and status_key in ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost'))
    or (entity_type = 'ops_tasks' and status_key in ('planned', 'in_progress', 'blocked', 'done', 'cancelled'))
    or (entity_type = 'calendar_events' and status_key in ('scheduled', 'completed', 'cancelled'))
    or (entity_type = 'sales_estimates' and status_key in ('draft', 'sent', 'accepted', 'rejected', 'expired'))
  ),
  unique (organization_id, entity_type, status_key)
);

create index if not exists workspace_status_presentations_org_entity_idx
  on public.workspace_status_presentations (organization_id, entity_type, sort_order, status_key);

drop trigger if exists workspace_status_presentations_set_updated_at
  on public.workspace_status_presentations;
create trigger workspace_status_presentations_set_updated_at
  before update on public.workspace_status_presentations
  for each row execute function public.set_updated_at();

alter table public.workspace_status_presentations enable row level security;

create policy "workspace_status_presentations_select_member"
  on public.workspace_status_presentations
  for select to authenticated
  using (private.is_org_member(organization_id));

create policy "workspace_status_presentations_insert_admin"
  on public.workspace_status_presentations
  for insert to authenticated
  with check (private.is_org_admin(organization_id));

create policy "workspace_status_presentations_update_admin"
  on public.workspace_status_presentations
  for update to authenticated
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "workspace_status_presentations_delete_admin"
  on public.workspace_status_presentations
  for delete to authenticated
  using (private.is_org_admin(organization_id));

revoke all on table public.workspace_status_presentations from anon;

grant select, insert, update, delete
  on table public.workspace_status_presentations
  to authenticated, service_role;
