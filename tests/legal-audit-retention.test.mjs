import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const migration=read("supabase/migrations/20261002080702_legal_audit_actor_decoupling.sql");
const legal=read("supabase/migrations/20260928165933_legal_trust_foundation_alpha071.sql");
const order=read("supabase/migrations/20260928165937_billing_order_evidence_alpha071.sql");

test("immutable legal evidence no longer couples Auth deletion to ON DELETE SET NULL",()=>{
  assert.match(legal,/legal_contract_records_immutable/);
  assert.match(legal,/privacy_request_events_immutable/);
  assert.match(order,/billing_order_evidence_guard/);
  for(const constraint of [
    "legal_contract_records_recorded_by_fkey",
    "privacy_request_events_actor_user_id_fkey",
    "billing_order_evidence_actor_user_id_fkey",
  ]) assert.match(migration,new RegExp("drop constraint if exists "+constraint));
});

test("decoupling is narrow and preserves pseudonymous audit UUIDs",()=>{
  assert.doesNotMatch(migration,/billing_terms_acceptances_user_id_fkey/);
  assert.doesNotMatch(migration,/privacy_request_cases_updated_by_fkey/);
  assert.doesNotMatch(migration,/delete from|truncate|drop table/i);
  assert.match(migration,/Pseudonymous actor UUID retained/);
  assert.match(migration,/Pseudonymous checkout actor UUID retained/);
});
