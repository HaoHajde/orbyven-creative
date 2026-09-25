import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {
  ComplianceValidationError, oneMonthDeadline,
  parseContractRecord,parsePrivacyCase,parsePrivacyTransition,parseRoleAssessment,
} from "../lib/compliance/validation.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const migration=read("supabase/migrations/20260925144000_legal_trust_foundation.sql");
const api=read("app/api/control-center/compliance/route.ts");
const page=read("app/control-center/legal/page.tsx");
const UUID="123e4567-e89b-42d3-a456-426614174000";
const hash="a".repeat(64);
const contract={organizationId:UUID,documentType:"contract",title:"Contract ORBYVEN",documentVersion:"v1",sha256:hash,evidenceReference:UUID+"/contracts/v1.pdf"};
test("contract registry only accepts scoped, sha256-anchored document references",()=>{
  assert.equal(parseContractRecord(contract).organization_id,UUID);
  for(const changed of [{organizationId:"bad"},{sha256:"abcd"},{evidenceReference:"https://example.com/a"},{evidenceReference:"../secret"}]){
    assert.throws(()=>parseContractRecord({...contract,...changed}),ComplianceValidationError);
  }
});
test("privacy case requires pseudonymous reference and explicit role",()=>{
  const input={organizationId:null,subjectReference:"case-2026-001",requestType:"access",processingRole:"undetermined",channel:"email"};
  assert.equal(parsePrivacyCase(input).organization_id,null);
  assert.throws(()=>parsePrivacyCase({...input,subjectReference:"name@example.com"}),/pseudonymous/);
  assert.throws(()=>parsePrivacyCase({...input,processingRole:"superadmin"}),/Unknown/);
});
test("status transitions forbid silent closure and require action notes",()=>{
  assert.deepEqual(parsePrivacyTransition({id:UUID,status:"triage",actionNote:"Identitate verificată"}, "identity_check").status,"triage");
  assert.throws(()=>parsePrivacyTransition({id:UUID,status:"closed",actionNote:"Closed now"},"received"),/transition/);
  assert.throws(()=>parsePrivacyTransition({id:UUID,status:"responded",actionNote:"ok"},"in_progress"),/length/);
  assert.throws(()=>parsePrivacyTransition({id:UUID,status:"received",actionNote:"Same"},"received"),/transition/);
});
test("GDPR role can be assessed only with a documented action",()=>{
  const role=parseRoleAssessment({id:UUID,processingRole:"processor",actionNote:"Client is controller"});
  assert.equal(role.processing_role,"processor");
  assert.throws(()=>parseRoleAssessment({id:UUID,processingRole:"undetermined",actionNote:"Not sure yet"}),/Determine/);
});
test("one calendar month clamps last-day February rather than adding 30 days",()=>{
  assert.equal(oneMonthDeadline(new Date("2026-01-31T10:00:00Z")),"2026-02-28T10:00:00.000Z");
  assert.equal(oneMonthDeadline(new Date("2026-09-25T10:00:00Z")),"2026-10-25T10:00:00.000Z");
});
test("RLS, grants, immutable evidence, audit and DB state guard are part of migration",()=>{
  for(const tab of ["legal_contract_records","privacy_request_cases","privacy_request_events"])
    assert.match(migration,new RegExp("alter table public\\."+tab+" enable row level security"));
  assert.match(migration,/revoke all privileges on public\.legal_contract_records/);
  assert.match(migration,/from public, anon, authenticated/);
  assert.match(migration,/legal_contract_records_immutable/);
  assert.match(migration,/privacy_request_events_immutable/);
  assert.match(migration,/privacy_case_guard/);
  assert.match(migration,/privacy_case_audit_insert/);
  assert.match(migration,/privacy_case_audit_update/);
  assert.match(migration,/prior_processing_role text/);
  assert.match(migration,/new\.processing_role = 'undetermined'/);
  assert.match(migration,/billing_terms_acceptances remains canonical/);
});
test("API authorizes platform staff and never exports/deletes client data",()=>{
  assert.match(api,/authorizeControlCenter\(request\)/);
  assert.match(api,/requireStaffRole\(staffRole,\["platform_owner","platform_admin"\]\)/);
  assert.match(api,/Cache-Control":"private, no-store"/);
  assert.match(api,/billing_terms_acceptances/);
  assert.match(api,/assess_case_role/);
  assert.doesNotMatch(api,/auth\.admin\.deleteUser|storage\.remove\(/);
  assert.match(page,/Înregistrat intern · neverificat/);
});
