-- ORBYVEN Wave 6 — release stale stock reservations when work closes.
-- The trigger is data-owned so every task-status entry point gets identical behavior.

create or replace function private.release_inventory_reservations_on_task_close()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  if new.status in ('done', 'cancelled')
     and old.status is distinct from new.status then
    delete from public.ops_inventory_reservations r
    where r.organization_id = new.organization_id
      and r.task_id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function private.release_inventory_reservations_on_task_close()
  from public, anon, authenticated;

drop trigger if exists ops_tasks_release_inventory_reservations
  on public.ops_tasks;

create trigger ops_tasks_release_inventory_reservations
after update of status on public.ops_tasks
for each row
when (
  new.status in ('done', 'cancelled')
  and old.status is distinct from new.status
)
execute function private.release_inventory_reservations_on_task_close();

comment on function private.release_inventory_reservations_on_task_close() is
  'Deletes operational stock reservations atomically when a task/work/order closes. Physical stock movements remain append-only.';
