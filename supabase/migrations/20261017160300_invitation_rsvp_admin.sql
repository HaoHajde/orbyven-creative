-- ORBYVEN AI Invitations · authenticated RSVP administration.
-- Public RSVP creation remains server-only; this migration only enables authenticated
-- admin mutation through the existing service-role gateway.

alter table public.invitation_rsvps
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

create index if not exists invitation_rsvps_updated_by_idx
  on public.invitation_rsvps(updated_by);

create index if not exists invitation_rsvps_project_attending_created_idx
  on public.invitation_rsvps(project_id, attending, created_at desc);

drop trigger if exists invitation_rsvps_set_updated_at on public.invitation_rsvps;
create trigger invitation_rsvps_set_updated_at
before update on public.invitation_rsvps
for each row execute function public.set_updated_at();

revoke all on public.invitation_rsvps from public, anon, authenticated;
grant select, insert, update, delete on public.invitation_rsvps to service_role;

comment on column public.invitation_rsvps.updated_by is
  'Authenticated ORBYVEN actor that last changed this RSVP through the admin server gateway.';
