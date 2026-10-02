import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("privileged Web Design quota logic stays private while public RPCs are invokers", () => {
  const fallback = read("supabase/migrations/20261002161525_web_design_authenticated_fallback.sql");
  const privateHelpers = read("supabase/migrations/20261002162039_web_design_private_quota_helpers.sql");

  assert.match(fallback, /actor_id = \(select auth\.uid\(\)\)/i);
  assert.match(fallback, /ACTOR_MISMATCH/);

  assert.match(privateHelpers, /create or replace function private\.ai_web_design_claim_impl/i);
  assert.match(privateHelpers, /create or replace function private\.ai_web_design_finish_impl/i);
  assert.match(privateHelpers, /security definer/i);
  assert.match(privateHelpers, /ACTOR_MISMATCH/);

  const publicClaim = privateHelpers.match(
    /create or replace function public\.ai_web_design_claim[\s\S]*?\$function\$;/
  )?.[0] ?? "";
  const publicFinish = privateHelpers.match(
    /create or replace function public\.ai_web_design_finish[\s\S]*?\$function\$;/
  )?.[0] ?? "";

  assert.match(publicClaim, /language sql/i);
  assert.match(publicClaim, /security invoker/i);
  assert.doesNotMatch(publicClaim, /security definer/i);
  assert.match(publicClaim, /private\.ai_web_design_claim_impl/i);

  assert.match(publicFinish, /language sql/i);
  assert.match(publicFinish, /security invoker/i);
  assert.doesNotMatch(publicFinish, /security definer/i);
  assert.match(publicFinish, /private\.ai_web_design_finish_impl/i);
});

test("organization bootstrap keeps verified onboarding logic private behind an invoker RPC", () => {
  const migration = read("supabase/migrations/20261002162143_bootstrap_private_helper.sql");

  assert.match(migration, /create or replace function private\.bootstrap_organization_impl/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /Verified account required/);
  assert.match(migration, /User already belongs to an ORBYVEN organization/);
  assert.match(migration, /pg_advisory_xact_lock/i);

  const publicBootstrap = migration.match(
    /create or replace function public\.bootstrap_organization[\s\S]*?\$function\$;/
  )?.[0] ?? "";

  assert.match(publicBootstrap, /language sql/i);
  assert.match(publicBootstrap, /security invoker/i);
  assert.doesNotMatch(publicBootstrap, /security definer/i);
  assert.match(publicBootstrap, /private\.bootstrap_organization_impl/i);
  assert.match(migration, /grant execute on function public\.bootstrap_organization[\s\S]*authenticated, service_role/i);
});
