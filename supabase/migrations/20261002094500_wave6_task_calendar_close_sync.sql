-- ORBYVEN Wave 6 — keep task close state and calendar deterministic.
-- cancelled work cancels internal scheduled work events; completed work keeps
-- future events visible for explicit human review.

create or replace function private.sync_task_calendar_on_close()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  if new.status in ('done', 'cancelled')
     and old.status is distinct from new.status then
    -- scheduled_at is the next active work slot, not immutable history.
    new.scheduled_at := null;
  end if;

  if new.status = 'cancelled'
     and old.status is distinct from new.status then
    update public.calendar_events e
    set status = 'cancelled'
    where e.organization_id = new.organization_id
      and e.task_id = new.id
      and e.event_type = 'work'
      and e.status = 'scheduled';
  end if;

  return new;
end;
$$;

revoke all on function private.sync_task_calendar_on_close()
  from public, anon, authenticated;

drop trigger if exists ops_tasks_calendar_close_sync
  on public.ops_tasks;

create trigger ops_tasks_calendar_close_sync
before update of status on public.ops_tasks
for each row
when (
  new.status in ('done', 'cancelled')
  and old.status is distinct from new.status
)
execute function private.sync_task_calendar_on_close();

comment on function private.sync_task_calendar_on_close() is
  'Clears next scheduling metadata for closed work and cancels internal scheduled work events only when the task is explicitly cancelled.';
