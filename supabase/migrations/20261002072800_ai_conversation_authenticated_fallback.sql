-- ORBYVEN Intelligence — authenticated, RLS-scoped fallback for conversation memory.
-- Service role remains preferred when configured. This fallback exists so the
-- Intelligence endpoint can stay available when the server secret is absent.
-- Access is limited to the signed-in actor and an organization they belong to.

alter table public.ai_conversations enable row level security;
revoke all on table public.ai_conversations from authenticated;
grant select, insert, update on table public.ai_conversations to authenticated;

drop policy if exists ai_conversations_select_own on public.ai_conversations;
create policy ai_conversations_select_own
on public.ai_conversations
for select
to authenticated
using (
  actor_id = (select auth.uid())
  and private.is_org_member(organization_id)
);

drop policy if exists ai_conversations_insert_own on public.ai_conversations;
create policy ai_conversations_insert_own
on public.ai_conversations
for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and private.is_org_member(organization_id)
);

drop policy if exists ai_conversations_update_own on public.ai_conversations;
create policy ai_conversations_update_own
on public.ai_conversations
for update
to authenticated
using (
  actor_id = (select auth.uid())
  and private.is_org_member(organization_id)
)
with check (
  actor_id = (select auth.uid())
  and private.is_org_member(organization_id)
);

alter table public.ai_conversation_messages enable row level security;
revoke all on table public.ai_conversation_messages from authenticated;
grant select, insert on table public.ai_conversation_messages to authenticated;

drop policy if exists ai_conversation_messages_select_own on public.ai_conversation_messages;
create policy ai_conversation_messages_select_own
on public.ai_conversation_messages
for select
to authenticated
using (
  actor_id = (select auth.uid())
  and private.is_org_member(organization_id)
);

drop policy if exists ai_conversation_messages_insert_own on public.ai_conversation_messages;
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
    where c.id = conversation_id
      and c.organization_id = organization_id
      and c.actor_id = (select auth.uid())
      and c.status = 'active'
  )
);

comment on table public.ai_conversations is
  'ORBYVEN Intelligence conversation threads. Service-role access is preferred; authenticated fallback is actor + organization scoped by RLS.';

comment on table public.ai_conversation_messages is
  'ORBYVEN Intelligence transcript. Authenticated fallback permits only the signed-in actor to read/append messages in their own organization-scoped thread.';
