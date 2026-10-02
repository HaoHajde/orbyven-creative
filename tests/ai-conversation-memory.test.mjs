import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("Conversation memory is server-only and scoped by organization plus actor", () => {
  const migration = read("supabase/migrations/20260929195804_ai_conversation_memory.sql");
  assert.match(migration, /unique \(id, organization_id, actor_id\)/);
  assert.match(migration, /foreign key \(conversation_id, organization_id, actor_id\)/);
  assert.match(migration, /alter table public\.ai_conversations enable row level security/);
  assert.match(migration, /alter table public\.ai_conversation_messages enable row level security/);
  assert.match(migration, /revoke all on table public\.ai_conversations from public, anon, authenticated/);
  assert.match(migration, /revoke all on table public\.ai_conversation_messages from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.ai_conversations to service_role/);
  assert.match(migration, /grant select, insert, update, delete on table public\.ai_conversation_messages to service_role/);
});


test("Conversation fallback is actor-scoped while Agent Action proposals stay server-only", () => {
  const fallback = read("supabase/migrations/20261002072800_ai_conversation_authenticated_fallback.sql");
  const billing = read("lib/billing/supabase-server.ts");
  assert.match(fallback, /grant select, insert, update on table public\.ai_conversations to authenticated/);
  assert.match(fallback, /grant select, insert on table public\.ai_conversation_messages to authenticated/);
  assert.match(fallback, /actor_id = \(select auth\.uid\(\)\)/);
  assert.match(fallback, /private\.is_org_member\(organization_id\)/);
  assert.doesNotMatch(fallback, /ai_action_proposals/);
  assert.match(billing, /if \(serviceRoleKey\)/);
  assert.match(billing, /actor\?\.accessToken/);
  assert.match(billing, /Authorization: `Bearer \$\{accessToken\}`/);
});

test("Conversation memory foreign keys have covering indexes", () => {
  const indexes = read("supabase/migrations/20260929200335_ai_conversation_memory_fk_indexes.sql");
  assert.match(indexes, /ai_conversations_actor_id_idx/);
  assert.match(indexes, /ai_conversation_messages_scope_fk_idx/);
  assert.match(indexes, /conversation_id, organization_id, actor_id/);
});

test("Conversation messages persist transcript only, never reusable Agent Action buttons", () => {
  const migration = read("supabase/migrations/20260929195804_ai_conversation_memory.sql");
  const server = read("lib/ai/conversation-server.ts");
  assert.match(migration, /Action buttons\/proposal payloads are intentionally not stored here/);
  assert.match(server, /content: response\.answer/);
  assert.match(server, /facts: response\.facts/);
  assert.doesNotMatch(server, /response\.actions/);
});

test("Intelligence request persists user and assistant around one authenticated actor", () => {
  const route = read("app/api/ai/intelligence/route.ts");
  assert.match(route, /authenticateBillingActor\(request, organizationId, false\)/);
  assert.match(route, /ensureConversation\(actor, conversationId, prompt\)/);
  assert.match(route, /appendUserConversationMessage\(actor, conversation\.id, prompt\)/);
  assert.match(route, /loadRecentConversationContext\(actor, conversation\.id\)/);
  assert.match(route, /resolveConversationFollowUp\(prompt, previousMessages\)/);
  assert.match(route, /context\.effectivePrompt/);
  assert.match(route, /maybePolishIntelligenceResponse/);
  assert.match(route, /persistAssistantResponse\(actor, conversation\.id, finalResult\)/);
  assert.match(route, /conversationId: conversation\.id/);
});

test("Conversation API lists and loads only the authenticated actor history", () => {
  const route = read("app/api/ai/conversations/route.ts");
  const server = read("lib/ai/conversation-server.ts");
  assert.match(route, /authenticateBillingActor\(request, organizationId, false\)/);
  assert.match(server, /\.eq\("organization_id", actor\.organizationId\)/);
  assert.match(server, /\.eq\("actor_id", actor\.userId\)/);
  assert.match(server, /\.eq\("status", "active"\)/);
  assert.match(server, /\.limit\(100\)/);
});

test("Agent Action proposals keep conversation identity and history cannot overturn execution", () => {
  const source = read("lib/ai/action-server.ts");
  assert.match(source, /conversation_id: conversationId/);
  assert.match(source, /conversation_id/);
  assert.match(source, /appendAssistantConversationMessage/);
  assert.match(source, /conversation outcome persistence failed/);
  assert.match(source, /status: "executed"/);
});

test("Workspace history restores transcript without restoring old confirm actions", () => {
  const ui = read("components/WorkspaceIntelligence.tsx");
  assert.match(ui, /\/api\/ai\/conversations/);
  assert.match(ui, /conversationId,/);
  assert.match(ui, /\+ Nou/);
  assert.match(ui, /Istoric/);
  assert.match(ui, /actions: \[\]/);
  assert.match(ui, /nu va reapărea ca acțiune în istoricul salvat/i);
});
