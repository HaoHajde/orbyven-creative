import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  TENANT_EXPORT_TABLES,TENANT_EXPORT_COLUMNS,requireExportableCase,buildTenantArchive,TenantExportError,
} from "../lib/compliance/exit-export.ts";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const migration=read("supabase/migrations/20261002080659_organization_offboarding_release.sql");
const ownerAPI=read("app/api/workspace/data-export/route.ts");
const staffAPI=read("app/api/control-center/compliance/route.ts");
const page=read("app/workspace/data-export/page.tsx");
const staffUI=read("app/control-center/legal/advanced/page.tsx");
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

test("archive rejects unknown or unexpected tables",async()=>{
  assert.ok(TENANT_EXPORT_TABLES.length>0);
  const admin={from:()=>{throw new Error("unexpected database read")}};
  await assert.rejects(buildTenantArchive(admin,"bad-org",caseId,"2026-09-27T13:00:00.000Z"),/organization id/i);
});

test("archive uses a bounded allowlist rather than exporting the whole database",()=>{
  assert.ok(TENANT_EXPORT_TABLES.includes("organizations"));
  assert.ok(TENANT_EXPORT_TABLES.includes("organization_members"));
  assert.ok(TENANT_EXPORT_TABLES.includes("legal_contract_records"));
  assert.ok(!TENANT_EXPORT_TABLES.includes("auth.users"));
  assert.ok(!TENANT_EXPORT_TABLES.includes("platform_staff"));
});

test("archive column allowlist excludes secrets and sensitive platform data",()=>{
  const serialized=JSON.stringify(TENANT_EXPORT_COLUMNS);
  assert.doesNotMatch(serialized,/password|secret|token_hash|stripe_customer_id|stripe_subscription_id/i);
  assert.match(TENANT_EXPORT_COLUMNS.organizations??"",/id/);
  assert.match(TENANT_EXPORT_COLUMNS.organization_members??"",/user_id/);
});

test("archive snapshots exact row counts and rejects datasets over the bound",async()=>{
  const orgId="123e4567-e89b-42d3-a456-426614174000";
  const admin={from:(table)=>({select:(columns,options)=>({eq:(column,value)=>{
    if(table==="organizations")return {maybeSingle:async()=>({data:{updated_at:"2026-09-27T12:00:00Z",id:value,name:"Pilot",slug:"pilot",legal_name:null,lifecycle_status:"active",created_at:"2026-01-01T00:00:00Z"},error:null})};
    if(options?.head)return Promise.resolve({count:10001,error:null,data:null});
    return {range:async()=>({data:[],error:null})};
  }})})};
  await assert.rejects(buildTenantArchive(admin,orgId,caseId,"2026-09-27T13:00:00.000Z"),/exceeds/);
});

test("page/count mismatch fails closed instead of returning a partial archive",async()=>{
  const makeAdmin=()=>({from:(table)=>({select:(columns,options)=>({eq:(column,value)=>{
    if(table==="organizations")return {maybeSingle:async()=>({
      data:{updated_at:"2026-09-30T00:00:00Z",id:value,name:"Pilot",slug:"pilot",legal_name:null,lifecycle_status:"active",created_at:"2026-01-01T00:00:00Z"},error:null
    })};
    if(options?.head)return Promise.resolve({count:2,error:null,data:null});
    return {range:async()=>({data:[{organization_id:value,id:"only-row"}],error:null})};
  }})})});
  await assert.rejects(buildTenantArchive(makeAdmin(),org,caseId,"2026-09-30T12:00:00.000Z"),/changed while reading/);
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


test("archive checksum is stable when Supabase returns rows in a different order",async()=>{
  const makeAdmin=(reverse)=>({from:(table)=>({
    select:(columns,options)=>({eq:(column,value)=>{
      if(table==="organizations")return {maybeSingle:async()=>({
        data:{updated_at:"2026-09-30T00:00:00Z",id:value,name:"Client Pilot",slug:"pilot",legal_name:null,lifecycle_status:"active",created_at:"2026-01-01T00:00:00Z"},error:null
      })};
      if(options?.head)return Promise.resolve({count:2,error:null,data:null});
      const rows=[
        {organization_id:value,id:"b",nested:{z:1,a:2}},
        {nested:{a:1,z:2},id:"a",organization_id:value},
      ];
      return {range:async()=>({data:reverse?[...rows].reverse():rows,error:null})};
    }}),
  })});
  const first=await buildTenantArchive(makeAdmin(false),org,caseId,"2026-09-30T12:00:00.000Z");
  const second=await buildTenantArchive(makeAdmin(true),org,caseId,"2026-09-30T12:00:00.000Z");
  assert.equal(first.sha256,second.sha256);
  assert.equal(first.payload,second.payload);
});


test("portal export projections never include access-token or IP fingerprint material",()=>{
  assert.doesNotMatch(TENANT_EXPORT_COLUMNS.client_portal_links??"",/token_hash/);
  assert.doesNotMatch(TENANT_EXPORT_COLUMNS.client_portal_estimate_decisions??"",/ip_sha256|user_agent/);
  assert.match(TENANT_EXPORT_COLUMNS.client_portal_links??"",/client_id/);
  assert.match(TENANT_EXPORT_COLUMNS.client_portal_estimate_decisions??"",/offer_sha256/);
});


test("offboarding actor audit IDs do not foreign-key Auth users",()=>{
  assert.doesNotMatch(migration,/requested_by uuid references auth\.users/);
  assert.doesNotMatch(migration,/action_by uuid references auth\.users/);
  assert.doesNotMatch(migration,/package_generated_by uuid references auth\.users/);
  assert.doesNotMatch(migration,/actor_user_id uuid references auth\.users/);
  assert.match(migration,/Actor UUIDs are intentionally not foreign keys/);
  assert.match(migration,/status <> 'closed' and closure_reference is null and closed_at is null/);
  assert.match(migration,/Archive evidence is not allowed before package generation/);
});


test("offboarding migration gate fails safely without disabling Legal and GDPR",()=>{
  assert.match(ownerAPI,/offboarding_migration_required/);
  assert.match(staffAPI,/offboardingConfigured/);
  assert.match(staffAPI,/exitCases:offboardingConfigured/);
  assert.match(staffUI,/Migrarea de offboarding nu este activată încă/);
  assert.match(page,/migrarea bazei de date nu este activată încă/);
  assert.match(page,/offboardingConfigured&&!active/);
});