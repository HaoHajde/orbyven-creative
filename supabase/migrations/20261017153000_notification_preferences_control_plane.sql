-- ORBYVEN notification preferences control plane.
-- Minimal scope: remote push delivery only. Activity/Attention generation stays independent.

create table if not exists public.user_notification_preferences (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('push')),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id, channel)
);

alter table public.user_notification_preferences enable row level security;

drop trigger if exists user_notification_preferences_set_updated_at
  on public.user_notification_preferences;
create trigger user_notification_preferences_set_updated_at
before update on public.user_notification_preferences
for each row execute function public.set_updated_at();

drop policy if exists "notification_preferences_select_own"
  on public.user_notification_preferences;
create policy "notification_preferences_select_own"
on public.user_notification_preferences
for select
to authenticated
using (
  user_id = (select auth.uid())
  and private.is_org_member(organization_id)
);

drop policy if exists "notification_preferences_insert_own"
  on public.user_notification_preferences;
create policy "notification_preferences_insert_own"
on public.user_notification_preferences
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and private.is_org_member(organization_id)
);

drop policy if exists "notification_preferences_update_own"
  on public.user_notification_preferences;
create policy "notification_preferences_update_own"
on public.user_notification_preferences
for update
to authenticated
using (
  user_id = (select auth.uid())
  and private.is_org_member(organization_id)
)
with check (
  user_id = (select auth.uid())
  and private.is_org_member(organization_id)
);

revoke all on table public.user_notification_preferences from anon;
grant select, insert, update on table public.user_notification_preferences to authenticated;
revoke delete on table public.user_notification_preferences from authenticated;

-- Preserve the existing immutable platform audit stream without exposing its writer.
-- Only bounded preference metadata is recorded; provider/device payloads never enter audit.
create or replace function private.audit_notification_preference_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and old.enabled is not distinct from new.enabled then
    return new;
  end if;

  insert into public.platform_audit_log (
    actor_user_id,
    actor_role,
    organization_id,
    action,
    target_type,
    target_id,
    metadata
  ) values (
    auth.uid(),
    'organization_member',
    new.organization_id,
    'notification.preference.updated',
    'user_notification_preference',
    new.user_id::text || ':' || new.channel,
    jsonb_build_object(
      'channel', new.channel,
      'enabled', new.enabled
    )
  );

  return new;
end;
$$;

revoke all on function private.audit_notification_preference_change()
  from public, anon, authenticated;

drop trigger if exists user_notification_preferences_audit
  on public.user_notification_preferences;
create trigger user_notification_preferences_audit
after insert or update of enabled on public.user_notification_preferences
for each row execute function private.audit_notification_preference_change();
