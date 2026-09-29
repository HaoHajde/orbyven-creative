import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  languageOutputPreservesExecutionClaims,
  languageOutputPreservesNumbers,
  shouldUseLanguageLayer,
} from "../lib/ai/language-policy.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

const response = (specialist = "general", actions = []) => ({ specialist, actions });

test("Selective Language is not used for mutation commands or confirmation proposals", () => {
  assert.equal(
    shouldUseLanguageLayer("Creează lead Ana", response("general")),
    false
  );
  assert.equal(
    shouldUseLanguageLayer(
      "Explică-mi ce urmează",
      response("operations", [{ kind: "confirm_proposal" }])
    ),
    false
  );
});

test("Selective Language is used only for general or explicit reasoning-style read requests", () => {
  assert.equal(shouldUseLanguageLayer("Salut ORBYVEN", response("general")), true);
  assert.equal(
    shouldUseLanguageLayer("Explică-mi ce ar trebui să prioritizez", response("operations")),
    true
  );
  assert.equal(
    shouldUseLanguageLayer("Ce am de făcut azi?", response("operations")),
    false
  );
  assert.equal(
    shouldUseLanguageLayer("Vreau site black & gold", response("web_design")),
    false
  );
});

test("Language guard rejects numbers that are absent from the canonical input", () => {
  assert.equal(
    languageOutputPreservesNumbers(
      "Ai 3 lucrări și 2 follow-up-uri.",
      "Ai 3 lucrări. Follow-up-uri: 2."
    ),
    true
  );
  assert.equal(
    languageOutputPreservesNumbers(
      "Ai 4 lucrări.",
      "Ai 3 lucrări."
    ),
    false
  );
  assert.equal(
    languageOutputPreservesNumbers(
      "Ai de încasat 1500 lei.",
      "De încasat: 1.500 RON."
    ),
    true
  );
});

test("Language guard rejects invented execution claims", () => {
  assert.equal(
    languageOutputPreservesExecutionClaims(
      "Am creat clientul.",
      "Clientul poate fi deschis din CRM."
    ),
    false
  );
  assert.equal(
    languageOutputPreservesExecutionClaims(
      "Factura a fost plătită.",
      "Factura a fost plătită."
    ),
    true
  );
});

test("Language telemetry and quota remain server-only", () => {
  const migration = read("supabase/migrations/20260929201932_ai_selective_language_layer.sql");
  assert.match(migration, /alter table public\.ai_language_calls enable row level security/);
  assert.match(migration, /revoke all on table public\.ai_language_calls from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.ai_language_calls to service_role/);
  assert.match(migration, /ai_language_claim/);
  assert.match(migration, /for update/);
  assert.match(migration, /v_daily_limit/);
  assert.match(migration, /v_minute_limit/);
});

test("AI subsystem covers the Agent Action actor foreign key", () => {
  const migration = read("supabase/migrations/20260929202417_ai_action_proposals_actor_fk_index.sql");
  assert.match(migration, /ai_action_proposals_actor_id_idx/);
  assert.match(migration, /ai_action_proposals \(actor_id\)/);
});

test("Language provider is explicit opt-in and cannot activate from a legacy OpenAI key alone", () => {
  const server = read("lib/ai/language-server.ts");
  const env = read(".env.example");
  assert.match(server, /ORBYVEN_LANGUAGE_LAYER_ENABLED/);
  assert.match(server, /ORBYVEN_LANGUAGE_PROVIDER/);
  assert.match(server, /ORBYVEN_LANGUAGE_OPENAI_API_KEY/);
  assert.match(server, /ORBYVEN_LANGUAGE_MODEL/);
  assert.doesNotMatch(server, /process\.env\.OPENAI_API_KEY/);
  assert.match(env, /ORBYVEN_LANGUAGE_LAYER_ENABLED=false/);
});

test("OpenAI Responses call is stateless, bounded and fail-open to canonical response", () => {
  const server = read("lib/ai/language-server.ts");
  assert.match(server, /https:\/\/api\.openai\.com\/v1\/responses/);
  assert.match(server, /store:\s*false/);
  assert.match(server, /max_output_tokens:\s*300/);
  assert.match(server, /setTimeout\(\(\) => controller\.abort\(\), 12000\)/);
  assert.match(server, /return response;/);
  assert.match(server, /answer: polished/);
  assert.match(server, /\.\.\.response/);
});

test("Language layer sits after deterministic/context resolution and before persisted assistant answer", () => {
  const route = read("app/api/ai/intelligence/route.ts");
  const canonical = route.indexOf("const contextualResult");
  const language = route.indexOf("const finalResult = await maybePolishIntelligenceResponse");
  const persisted = route.indexOf("await persistAssistantResponse(actor, conversation.id, finalResult)");
  assert.ok(canonical > 0);
  assert.ok(language > canonical);
  assert.ok(persisted > language);
  assert.match(route, /persistAssistantResponse\(actor, conversation\.id, finalResult\)/);
});
