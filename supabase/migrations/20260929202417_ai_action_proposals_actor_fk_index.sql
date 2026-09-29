-- Alpha 0.8.6 AI subsystem hardening: cover proposal actor FK.
create index if not exists ai_action_proposals_actor_id_idx
  on public.ai_action_proposals (actor_id);
