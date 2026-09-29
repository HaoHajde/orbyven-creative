-- ORBYVEN Alpha 0.8.4 — covering indexes for conversation-memory foreign keys.

create index if not exists ai_conversations_actor_id_idx
  on public.ai_conversations (actor_id);

create index if not exists ai_conversation_messages_scope_fk_idx
  on public.ai_conversation_messages (conversation_id, organization_id, actor_id);
