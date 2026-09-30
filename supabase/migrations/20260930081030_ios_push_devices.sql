-- ORBYVEN iOS Alpha 0.6 — tenant-scoped device registrations for remote push delivery.

create table public.user_push_devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null check (char_length(expo_push_token) between 16 and 512),
  platform text not null check (platform in ('ios','android')),
  app_version text,
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, expo_push_token)
);

create index user_push_devices_org_enabled_idx
  on public.user_push_devices (organization_id, enabled, last_seen_at desc);

create index user_push_devices_user_idx
  on public.user_push_devices (user_id, last_seen_at desc);

drop trigger if exists user_push_devices_set_updated_at on public.user_push_devices;
create trigger user_push_devices_set_updated_at
before update on public.user_push_devices
for each row execute function public.set_updated_at();

alter table public.user_push_devices enable row level security;

create policy user_push_devices_select_own
on public.user_push_devices for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = user_push_devices.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
  )
);

create policy user_push_devices_insert_own
on public.user_push_devices for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = user_push_devices.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
  )
);

create policy user_push_devices_update_own
on public.user_push_devices for update to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = user_push_devices.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = user_push_devices.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
  )
);

create policy user_push_devices_delete_own
on public.user_push_devices for delete to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = user_push_devices.organization_id
      and m.user_id = (select auth.uid())
      and m.access_status = 'active'
  )
);

grant select, insert, update, delete on public.user_push_devices to authenticated;
revoke all on public.user_push_devices from anon;

comment on table public.user_push_devices
is 'Authenticated ORBYVEN device registrations for remote push delivery. Tokens are user-owned and tenant-scoped; server-side senders may use service-role access.';
