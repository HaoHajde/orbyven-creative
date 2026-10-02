import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

const bootstrap = read("supabase/migrations/20261002083742_harden_bootstrap_verified_authenticated_boundary.sql");
const relock = read("supabase/migrations/20261002083824_ai_action_rpc_server_only_relock.sql");
const intelligenceRoute = read("app/api/ai/intelligence/route.ts");
const proposalServer = read("lib/ai/proposal-server.ts");
const auditRelock = read("supabase/migrations/20261002081223_ai_audit_service_role_only.sql");

test("organization bootstrap remains intentional but requires a verified non-anonymous identity", () => {
  assert.match(bootstrap, /security definer/i);
  assert.match(bootstrap, /not coalesce\(u\.is_anonymous, false\)/);
  assert.match(bootstrap, /email_confirmed_at is not null or u\.phone_confirmed_at is not null/);
  assert.match(bootstrap, /User already belongs to an ORBYVEN organization/);
  assert.match(bootstrap, /pg_advisory_xact_lock/);
  assert.match(bootstrap, /revoke all on function public\.bootstrap_organization\(text,text,text\[\]\) from public/);
  assert.match(bootstrap, /revoke all on function public\.bootstrap_organization\(text,text,text\[\]\) from anon/);
  assert.match(bootstrap, /grant execute on function public\.bootstrap_organization\(text,text,text\[\]\) to authenticated/);
});

test("Agent Action privileged RPCs are service-role only", () => {
  for (const name of [
    "ai_action_proposal_claim",
    "ai_action_proposal_finish",
    "ai_action_proposal_reject",
    "ai_action_proposals_insert",
    "ai_action_proposals_list",
    "ai_action_proposals_supersede",
    "ai_create_estimate_draft_actor",
  ]) {
    assert.match(relock, new RegExp("revoke all on function public\\." + name));
  }
  assert.doesNotMatch(relock, /grant execute[^\n]+to authenticated/i);
  assert.match(relock, /grant execute[^\n]+to service_role/i);
  assert.doesNotMatch(proposalServer, /createBillingServiceClient\(actor\)/);
  assert.match(proposalServer, /createBillingServiceClient\(\)/);
  assert.match(auditRelock, /ai_action_audit_write/);
  assert.doesNotMatch(auditRelock, /to authenticated/i);
});

test("Intelligence fails safe when privileged action mode is unavailable", () => {
  assert.match(intelligenceRoute, /PRIVILEGED_ACTION_MODE_UNAVAILABLE/);
  assert.match(intelligenceRoute, /Nicio modificare executată/);
  assert.match(intelligenceRoute, /status: 200/);
});
