import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("paid modules are enforced in restrictive tenant RLS only after subscription creation", () => {
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
