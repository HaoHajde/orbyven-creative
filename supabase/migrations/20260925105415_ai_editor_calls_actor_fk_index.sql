-- Index the AI editor actor FK for ownership lookups and auth.users maintenance.
-- Additive only; does not change RLS, roles, or AI feature activation.
create index if not exists ai_editor_calls_actor_id_idx
  on public.ai_editor_calls (actor_id);
