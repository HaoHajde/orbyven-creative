import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  TENANT_EXPORT_TABLES,requireExportableCase,buildTenantArchive,TenantExportError,
} from "../lib/compliance/exit-export.ts";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const migration=read("supabase/migrations/20260930210500_organization_offboarding_release.sql");
const ownerAPI=read("app/api/workspace/data-export/route.ts");
const staffAPI=read("app/api/control-center/compliance/route.ts");
const page=read("app/workspace/data-export/page.tsx");
const staffUI=read("app/control-center/legal/page.tsx");
const org="123e4567-e89b-42d3-a456-426614174000";
const caseId="223e4567-e89b-42d3-a456-426614174001";

test("authorization is case/tenant-specific and limited to approved/export-generated states",()=>{
  assert.doesNotThrow(()=>requireExportableCase({organization_id:org,status:"authorized"},org));
  assert.doesNotThrow(()=>requireExportableCase({organization_id:org,status:"package_generated"},org));
  for(const status of ["requested","retention_review","closed"]){
    assert.throws(()=>requireExportableCase({organization_id:org,status},org),TenantExportError);
  }
  assert.throws(()=>requireExportableCase({organization_id:"different",status:"authorized"},org),TenantExportError);
});

test("export allowlist excludes cross-tenant/Auth/platform and raw payment data",()=>{
  assert.ok(TENANT_EXPORT_TABLES.includes("crm_leads"));
  assert.ok(TENANT_EXPORT_TABLES.includes("billing_order_evidence"));
  assert.ok(TENANT_EXPORT_TABLES.includes("billing_merchant_customers"));
  assert.ok(TENANT_EXPORT_TABLES.includes("finance_income_entries"));
  assert.ok(TENANT_EXPORT_TABLES.includes("ops_inventory_movements"));
  assert.ok(TENANT_EXPORT_TABLES.includes("ops_purchase_orders"));
  assert.ok(TENANT_EXPORT_TABLES.includes("ops_resources"));
  assert.ok(TENANT_EXPORT_TABLES.includes("thermal_sketches"));
  assert.ok(TENANT_EXPORT_TABLES.includes("ai_conversations"));
  assert.ok(TENANT_EXPORT_TABLES.includes("ai_action_proposals"));
  for(const name of ["auth.users","platform_staff","platform_audit_log",
    "billing_webhook_events","privacy_request_cases","ai_language_calls","ai_editor_calls","user_push_devices","storage.objects"]){
    assert.ok(!TENANT_EXPORT_TABLES.includes(name),name);
  }
});

test("org-scoped archive keeps only tenant records, records explicit exclusions, and has checksum",async()=>{
  const calls=[];
  const admin={from:(table)=>({
    select:()=>({eq:(column,value)=>{
      calls.push({table,column,value});
      if(table==="organizations")return {maybeSingle:async()=>({
        data:{id:value,name:"Client Pilot"},error:null
      })};
      return {range:async()=>({
        data:[{id:table+"-record",organization_id:value}],error:null
      })};
    }}),
  })};
  const archive=await buildTenantArchive(admin,org,caseId,"2026-09-27T13:00:00.000Z");
  const parsed=JSON.parse(archive.payload);
  assert.equal(parsed.organization_id,org);
  assert.equal(parsed.case_id,caseId);
  assert.equal(Object.keys(parsed.datasets).length,TENANT_EXPORT_TABLES.length);
  assert.match(parsed.exclusions.join(" "),/Storage document/);
  assert.match(archive.sha256,/^[0-9a-f]{64}$/);
  assert.ok(calls.every(c=>c.value===org));
});

test("an oversized dataset is rejected, never emitted as partial export",async()=>{
  const admin={from:(table)=>({
    select:()=>({eq:()=>table==="organizations"
      ? {maybeSingle:async()=>({data:{id:org},error:null})}
      : {range:async()=>({data:Array.from({length:2001},()=>({})),error:null})}
    }),
  })};
  await assert.rejects(buildTenantArchive(admin,org,caseId,"2026-09-27T13:00:00.000Z"),/limit reached/);
});

test("no anon/authenticated grants, no automatic deletion, and append-only audit",()=>{
  assert.match(migration,/organization_exit_cases enable row level security/);
  assert.match(migration,/organization_exit_events enable row level security/);
  assert.match(migration,/revoke all privileges on public.organization_exit_cases, public.organization_exit_events/);
  assert.match(migration,/organization_exit_one_active_case_idx/);
  assert.match(migration,/exit_event_immutable/);
  assert.doesNotMatch(ownerAPI,/\.delete\(|auth\.admin\.deleteUser|storage\.remove\(/);
  assert.doesNotMatch(staffAPI,/auth\.admin\.deleteUser|storage\.remove\(/);
});

test("owner-only download, staff-only authorization, and clear distinction from delivered files",()=>{
  assert.match(ownerAPI,/actor\.role!=="owner"/);
  assert.match(ownerAPI,/\.eq\("organization_id",actor\.organizationId\)/);
  assert.match(ownerAPI,/requireExportableCase\(item,actor\.organizationId\)/);
  assert.match(ownerAPI,/package_sha256:archive\.sha256/);
  assert.match(ownerAPI,/Content-Disposition/);
  assert.match(staffAPI,/requireStaffRole\(staffRole,\["platform_owner","platform_admin"\]\)/);
  assert.match(staffAPI,/advance_exit_case/);
  assert.match(page,/Sol icită exportul datelor|Solicită exportul datelor/);
  assert.match(staffUI,/Predarea și închiderea datelor clientului/);
});
