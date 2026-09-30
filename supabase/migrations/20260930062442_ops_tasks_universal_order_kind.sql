-- ORBYVEN Alpha 0.8.8 — Universal Operations Core.
-- Applied to production Supabase first; this file mirrors the production migration.

alter table public.ops_tasks
  drop constraint if exists ops_tasks_kind_check;

alter table public.ops_tasks
  add constraint ops_tasks_kind_check
  check (kind in ('task', 'work', 'order'))
  not valid;

alter table public.ops_tasks
  validate constraint ops_tasks_kind_check;

comment on column public.ops_tasks.kind
is 'Universal operational record: task, field/service work, or customer order.';
