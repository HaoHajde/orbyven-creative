import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const ai=read("supabase/migrations/20261002074430_ai_action_authenticated_fallback_rpc.sql");
const bootstrap=read("supabase/migrations/20260930181418_bootstrap_organization_atomicity.sql");

test("AI privileged RPC fallback stays actor and tenant scoped",()=>{
  assert.match(ai,/target_actor = \(select auth\.uid\(\)\)/);
  assert.match(ai,/m\.organization_id = target_org/);
  assert.match(ai,/m\.user_id = target_actor/);
  assert.match(ai,/m\.access_status = 'active'/);
  assert.match(ai,/m\.role = any \(array\['owner'::text, 'admin'::text, 'manager'::text, 'member'::text\]\)/);
  assert.match(ai,/o\.lifecycle_status = 'active'/);
  assert.match(ai,/revoke all on function private\.ai_actor_can_mutate\(uuid, uuid\) from public, anon, authenticated/);
});

test("AI action tables stay server-only while narrow RPCs reject anonymous execution",()=>{
  for(const name of [
    "ai_action_proposals_insert",
    "ai_action_proposals_list",
    "ai_action_proposal_reject",
    "ai_action_proposal_claim",
    "ai_action_proposal_finish",
    "ai_action_proposals_supersede",
    "ai_create_estimate_draft_actor",
    "ai_action_audit_write",
  ]){
    assert.match(ai,new RegExp("revoke all on function public\\."+name+"\\([^;]+\\) from public, anon"));
    assert.match(ai,new RegExp("grant execute on function public\\."+name+"\\([^;]+\\) to authenticated, service_role"));
  }
  assert.match(ai,/revoke select, insert, update, delete on table public\.ai_action_proposals from authenticated/);
});

test("first tenant bootstrap remains intentional and bounded SECURITY DEFINER",()=>{
  assert.match(bootstrap,/security definer/i);
  assert.match(bootstrap,/current_user_id uuid := auth\.uid\(\)/);
  assert.match(bootstrap,/pg_advisory_xact_lock/);
  assert.match(bootstrap,/User already belongs to an ORBYVEN organization/);
  assert.match(bootstrap,/Too many requested modules/);
  assert.match(bootstrap,/revoke all on function public\.bootstrap_organization\(text,text,text\[\]\)\s*from public, anon/);
  assert.match(bootstrap,/grant execute on function public\.bootstrap_organization\(text,text,text\[\]\)\s*to authenticated/);
});
