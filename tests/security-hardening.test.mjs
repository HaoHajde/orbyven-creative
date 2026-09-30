import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260925111241_orbyven_alpha_security_hardening.sql");
const billingMigration = read("supabase/migrations/20260925111631_orbyven_paid_module_rls_enforcement.sql");
const admin = read("app/admin/page.tsx");
const route = read("app/api/admin/leads/route.ts");
const documents = read("lib/modules/documents.ts");

test("legacy leads never grant tenant-wide read/update access", () => {
  assert.match(migration, /revoke select, update on public\.leads from authenticated/i);
  assert.match(migration, /drop policy if exists "Authenticated admins can read ORBITA leads"/);
  assert.doesNotMatch(read("supabase/admin-policies.sql"), /using\s*\(true\)/i);
  assert.doesNotMatch(admin, /\.from\("leads"\)/);
});

test("admin leads API requires verified platform staff, never browser service key", () => {
  assert.match(route, /authorizeControlCenter\(request\)/);
  assert.match(route, /requireStaffRole\(staffRole, \["platform_owner", "platform_admin"\]\)/);
  assert.match(route, /Cache-Control/);
  assert.doesNotMatch(route, /process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(admin, /\/api\/admin\/leads/);
});

test("organization owner role is guarded at the database boundary", () => {
  assert.match(migration, /organization_members_security_guard/);
  assert.match(migration, /old\.role = 'owner' or new\.role = 'owner'/);
  assert.match(migration, /revoke truncate, references, trigger on public\.organization_members/);
});

test("storage authorization uses the OBJECT path rather than company display name", () => {
  assert.equal((migration.match(/storage\.foldername\(storage\.objects\.name\)/g) ?? []).length, 5);
  assert.doesNotMatch(migration, /storage\.foldername\(o\.name\)/);
  assert.match(migration, /allowed_mime_types/);
  assert.match(documents, /validateDocumentFile\(input\.file\)/);
});

test("request throttling applies to the publicly callable SQL insert gateway", () => {
  assert.match(migration, /create trigger public_project_request_email_limit/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /from public\.project_requests pr/);
});

test("paid modules compose with restrictive tenant RLS and explicit pilot entitlements", () => {
  assert.match(billingMigration, /not exists\s*\([\s\S]*?from public\.subscriptions s/);
  assert.match(billingMigration, /private\.has_module_entitlement\(target_org, target_module\)/);
  assert.match(billingMigration, /as restrictive for all to authenticated/);
  assert.match(billingMigration, /billing_module_insert_guard/);
  assert.match(billingMigration, /billing_module_update_guard/);
});

test("baseline headers are configured without blocking existing scripts/images", () => {
  const config = read("next.config.ts");
  for (const name of [
    "Content-Security-Policy", "Strict-Transport-Security",
    "X-Content-Type-Options", "Referrer-Policy",
  ]) assert.ok(config.includes(name), name);
  assert.match(config, /frame-ancestors 'self'/);
});


const secondMigration = read("supabase/migrations/20260928140018_security_hardening_ii_finance_ip_quota.sql");
const publicRateLimit = read("lib/security/request-rate-limit.ts");
const publicRequestRoute = read("app/api/project-requests/route.ts");
const recoveryRoute = read("app/api/admin/billing/webhook-recovery/route.ts");
const workspaceOverview = read("lib/modules/overview.ts");

test("financial data stays role-restricted in Postgres, not only in UI", () => {
  assert.match(secondMigration, /m.role in \('owner','admin','manager'\)/);
  assert.match(secondMigration, /on public.finance_expenses as restrictive for all to authenticated/);
  assert.match(secondMigration, /on public.finance_budget_entries as restrictive for all to authenticated/);
  assert.match(workspaceOverview, /canAccessFinances/);
  assert.match(workspaceOverview, /readAllPages<\{ amount_cents: number \}>/);
  assert.match(read("tests/data-efficiency.test.mjs"), /monthExpensesCents/);
  assert.match(read("components/modules/OverviewModule.tsx"), /canAccessFinances && <SnapshotRow/);
  assert.ok(read("components/WorkspaceContent.tsx").includes('!["owner", "admin", "manager"].includes(role)'));
});

test("public request IP quota is atomic and service-role-only", () => {
  assert.match(secondMigration, /on conflict \(ip_fingerprint,bucket_started_at\)/i);
  assert.match(secondMigration, /where public.project_request_ip_quota.hits < 12/);
  assert.match(secondMigration, /grant execute on function public.claim_project_request_ip_quota\(text\)\s*to service_role/);
  assert.match(secondMigration, /alter table public.project_request_ip_quota enable row level security/);
  assert.match(publicRateLimit, /createHmac\("sha256", secret\)/);
  assert.match(publicRequestRoute, /claimProjectRequestIpQuota\(request\)/);
  assert.match(publicRequestRoute, /status: 429/);
});

test("stalled webhook recovery requires staff review and an audit log", () => {
  assert.match(recoveryRoute, /authorizeControlCenter\(request\)/);
  assert.match(recoveryRoute, /requireStaffRole\(staffRole, \["platform_owner"\]\)/);
  assert.match(recoveryRoute, /reviewedProviderState !== true/);
  assert.match(recoveryRoute, /billing.webhook_manual_recovery_requested/);
  assert.match(recoveryRoute, /await Stripe redelivery/);
  assert.doesNotMatch(recoveryRoute, /syncStripeInvoice\(/);
});

test("documents check leading content bytes without claiming antivirus protection", () => {
  const documentUpload = read("lib/modules/documents.ts");
  assert.match(documentUpload, /await validateDocumentFile\(input.file\)/);
  assert.match(documentUpload, /hasExpectedFileSignature\(file.type, header\)/);
  assert.ok(read("lib/security/file-signature.ts").includes("NOT malware/antivirus scanning"));
});


const pilotMigration = read("supabase/migrations/20260928140022_pilot_entitlements_private_requests.sql");
const gatewayCutover = read("supabase/migrations/20260928141201_project_requests_server_only_cutover.sql");
const workspace = read("lib/orbyven-workspace.ts");
const moduleStore = read("components/WorkspaceModuleStore.tsx");

test("existing pilot entitlement grants are explicit and time limited", () => {
  assert.equal((pilotMigration.match(/'[^']{8}-[^']{4}-[^']{4}-[^']{4}-[^']{12}'::uuid/g) ?? []).length, 4);
  assert.match(pilotMigration, /'pilot', true/);
  assert.match(pilotMigration, /2027-06-30T23:59:59Z/);
  assert.match(pilotMigration, /on conflict \(organization_id,module_id\) do nothing/);
  assert.doesNotMatch(
    pilotMigration,
    /not exists\s*\(\s*select 1 from public\.subscriptions s\s*where s\.organization_id = target_org/
  );
  assert.match(pilotMigration, /and private\.has_module_entitlement\(target_org, target_module\)/);
});

test("no subscription and no pilot grant never gives default paid module access", () => {
  assert.match(workspace, /\.from\("organization_entitlements"\)/);
  assert.match(workspace, /validModuleIds\.has\(moduleId\) && entitled\.has\(moduleId\)/);
  assert.match(workspace, /entitledModules:/);
  assert.match(moduleStore, /!entitled \|\| !canManage/);
  assert.match(read("components/ClientWorkspace.tsx"), /!workspace\.entitledModules\.includes\(id\)/);
});

test("public requests cannot bypass the API IP limiter through anonymous RPC", () => {
  assert.match(publicRequestRoute, /process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(publicRequestRoute, /process\.env\.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(gatewayCutover, /from public, anon, authenticated/);
  assert.match(gatewayCutover, /to service_role/);
  assert.match(publicRateLimit, /ORBYVEN_REQUEST_RATE_LIMIT_SECRET\?\.trim\(\) \|\| key/);
  assert.match(publicRateLimit, /orbyven:project-request:ip:v1:/);
  assert.match(secondMigration, /revoke all on function public\.claim_project_request_ip_quota\(text\)/);
});


test("document storage and legacy lead gateway cannot bypass module or repeat-email policy", () => {
  assert.match(pilotMigration, /on storage\.objects as restrictive for all to authenticated/);
  assert.match(pilotMigration, /private\.is_document_storage_allowed\(storage\.objects\.name\)/);
  assert.match(pilotMigration, /private\.is_billing_module_allowed\(/);
  assert.match(pilotMigration, /create trigger orbyven_legacy_lead_email_limit/);
  assert.match(pilotMigration, /pg_advisory_xact_lock/);
});


test("repository migration filenames match exact production versions for deterministic historical matches", () => {
  assert.equal(existsSync(new URL("../supabase/migrations/20260907095853_orbyven_multi_tenant_foundation.sql", import.meta.url)), true);
  assert.equal(existsSync(new URL("../supabase/migrations/20260907100000_orbyven_multi_tenant_foundation.sql", import.meta.url)), false);
  assert.equal(existsSync(new URL("../supabase/migrations/20260907104116_crm_leads_module.sql", import.meta.url)), true);
  assert.equal(existsSync(new URL("../supabase/migrations/20260907113000_crm_leads_module.sql", import.meta.url)), false);
  assert.equal(existsSync(new URL("../supabase/migrations/20260907104750_crm_leads_module_performance.sql", import.meta.url)), true);
  assert.equal(existsSync(new URL("../supabase/migrations/20260907115000_crm_leads_module_performance.sql", import.meta.url)), false);
  assert.equal(existsSync(new URL("../supabase/migrations/20260907112426_ops_tasks_module.sql", import.meta.url)), true);
  assert.equal(existsSync(new URL("../supabase/migrations/20260907123000_ops_tasks_module.sql", import.meta.url)), false);
  assert.equal(existsSync(new URL("../supabase/migrations/20260907120323_orbyven_billing_foundation.sql", import.meta.url)), true);
  assert.equal(existsSync(new URL("../supabase/migrations/20260907130000_orbyven_billing_foundation.sql", import.meta.url)), false);
  assert.equal(existsSync(new URL("../supabase/migrations/20260907122455_platform_core_auth_provisioning_v2.sql", import.meta.url)), true);
  assert.equal(existsSync(new URL("../supabase/migrations/20260907133000_platform_core_auth_provisioning_v2.sql", import.meta.url)), false);
  assert.equal(existsSync(new URL("../supabase/migrations/20260907121018_calendar_module.sql", import.meta.url)), true);
  assert.equal(existsSync(new URL("../supabase/migrations/20260907140000_calendar_module.sql", import.meta.url)), false);
  assert.equal(existsSync(new URL("../supabase/migrations/20260908051308_public_project_request_rpc.sql", import.meta.url)), true);
  assert.equal(existsSync(new URL("../supabase/migrations/20260908051500_public_project_request_rpc.sql", import.meta.url)), false);
  assert.equal(existsSync(new URL("../supabase/migrations/20260908061840_complete_workspace_business_modules.sql", import.meta.url)), true);
  assert.equal(existsSync(new URL("../supabase/migrations/20260908063000_complete_workspace_business_modules.sql", import.meta.url)), false);
  assert.equal(existsSync(new URL("../supabase/migrations/20260925105411_commercial_issuer_snapshots.sql", import.meta.url)), true);
  assert.equal(existsSync(new URL("../supabase/migrations/20260923164000_commercial_issuer_snapshots.sql", import.meta.url)), false);
  assert.equal(existsSync(new URL("../supabase/migrations/20260925105415_ai_editor_calls_actor_fk_index.sql", import.meta.url)), true);
  assert.equal(existsSync(new URL("../supabase/migrations/20260925135500_ai_editor_calls_actor_fk_index.sql", import.meta.url)), false);
  assert.equal(existsSync(new URL("../supabase/migrations/20260927152501_alpha06_material_catalog_revisions.sql", import.meta.url)), true);
  assert.equal(existsSync(new URL("../supabase/migrations/20260925150000_alpha06_material_catalog_revisions.sql", import.meta.url)), false);
});


const bootstrapOrganizationHardening = read("supabase/migrations/20260930181418_bootstrap_organization_atomicity.sql");

test("organization bootstrap serializes concurrent first-tenant creation", () => {
  assert.match(bootstrapOrganizationHardening, /pg_advisory_xact_lock/);
  assert.match(bootstrapOrganizationHardening, /hashtextextended\(current_user_id::text, 0\)/);
  assert.match(bootstrapOrganizationHardening, /array_length\(p_module_ids, 1\)/);
  assert.match(bootstrapOrganizationHardening, /> 32/);
  assert.match(bootstrapOrganizationHardening, /auth\.uid\(\)/);
  assert.match(bootstrapOrganizationHardening, /revoke all on function public\.bootstrap_organization\(text,text,text\[\]\)\s*from public, anon/);
  assert.match(bootstrapOrganizationHardening, /grant execute on function public\.bootstrap_organization\(text,text,text\[\]\)\s*to authenticated/);
});
