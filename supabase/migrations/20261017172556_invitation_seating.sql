-- ORBYVEN AI Invitations · seating/table assignment foundation.
-- Seating remains private, tenant-owned operational data exposed only through authenticated
-- Next.js server routes using the existing service-role gateway.

create table if not exists public.invitation_tables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.invitation_projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  capacity smallint not null default 10 check (capacity between 1 and 30),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
);

create index if not exists invitation_tables_project_created_idx
  on public.invitation_tables(project_id, created_at asc);
create index if not exists invitation_tables_created_by_idx
  on public.invitation_tables(created_by);
create index if not exists invitation_tables_updated_by_idx
  on public.invitation_tables(updated_by);

alter table public.invitation_tables enable row level security;
revoke all on public.invitation_tables from public, anon, authenticated;
grant select, insert, update, delete on public.invitation_tables to service_role;

drop trigger if exists invitation_tables_set_updated_at on public.invitation_tables;
create trigger invitation_tables_set_updated_at
before update on public.invitation_tables
for each row execute function public.set_updated_at();

alter table public.invitation_rsvps
  add column if not exists table_id uuid references public.invitation_tables(id) on delete set null;

create index if not exists invitation_rsvps_table_id_idx
  on public.invitation_rsvps(table_id);

comment on table public.invitation_tables is
  'Private tenant-owned seating tables for a published invitation project.';
comment on column public.invitation_rsvps.table_id is
  'Optional seating table assignment; server routes verify the table belongs to the same invitation project.';
