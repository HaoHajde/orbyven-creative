-- ORBYVEN Alpha 0.8.4 — persistent conversation memory.
-- Server-only transcript storage scoped simultaneously to organization + actor.
-- Action proposal payloads/buttons are not copied into message history.

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  status text not null default 'active'
    check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id, actor_id)
);

create index if not exists ai_conversations_actor_recent_idx
  on public.ai_conversations (organization_id, actor_id, updated_at desc)
  where status = 'active';

alter table public.ai_conversations enable row level security;
revoke all on table public.ai_conversations from public, anon, authenticated;
grant select, insert, update, delete on table public.ai_conversations to service_role;

comment on table public.ai_conversations is
  'Server-only ORBYVEN Intelligence conversation threads scoped to one organization and actor.';

create table if not exists public.ai_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  organization_id uuid not null,
  actor_id uuid not null,
  role text not null check (role in ('user','assistant')),
  specialist text check (
    specialist is null or specialist in ('operations','finance','web_design','documents','general')
  ),
  content text not null check (char_length(trim(content)) between 1 and 6000),
  facts jsonb not null default '[]'::jsonb check (jsonb_typeof(facts) = 'array'),
  created_at timestamptz not null default now(),
  foreign key (conversation_id, organization_id, actor_id)
    references public.ai_conversations(id, organization_id, actor_id)
    on delete cascade
);

create index if not exists ai_conversation_messages_thread_idx
  on public.ai_conversation_messages (conversation_id, created_at, id);

alter table public.ai_conversation_messages enable row level security;
revoke all on table public.ai_conversation_messages from public, anon, authenticated;
grant select, insert, update, delete on table public.ai_conversation_messages to service_role;

comment on table public.ai_conversation_messages is
  'Persisted ORBYVEN Intelligence transcript. Action buttons/proposal payloads are intentionally not stored here.';

alter table public.ai_action_proposals
  add column if not exists conversation_id uuid references public.ai_conversations(id) on delete set null;

create index if not exists ai_action_proposals_conversation_idx
  on public.ai_action_proposals (conversation_id)
  where conversation_id is not null;
