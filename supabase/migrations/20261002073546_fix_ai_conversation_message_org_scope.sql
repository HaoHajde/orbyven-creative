-- Tighten authenticated ORBYVEN Intelligence conversation-message fallback.
-- The organization comparison must explicitly bind the conversation row to
-- the message row; otherwise PostgreSQL can resolve both unqualified names
-- to the inner conversation alias.

drop policy if exists ai_conversation_messages_insert_own
on public.ai_conversation_messages;

create policy ai_conversation_messages_insert_own
on public.ai_conversation_messages
for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and private.is_org_member(organization_id)
  and exists (
    select 1
    from public.ai_conversations c
    where c.id = ai_conversation_messages.conversation_id
      and c.organization_id = ai_conversation_messages.organization_id
      and c.actor_id = (select auth.uid())
      and c.status = 'active'
  )
);
