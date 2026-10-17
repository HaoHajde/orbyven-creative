import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("integrity UI API remains platform-owner only", () => {
  const route = read("app/api/control-center/integrity/route.ts");
  const reportRoute = read("app/api/control-center/integrity/report/route.ts");

  assert.match(route, /authorizeControlCenter\(request\)/);
  assert.match(route, /requireStaffRole\(staffRole, \["platform_owner"\]\)/);
  assert.match(reportRoute, /authorizeControlCenter\(request\)/);
  assert.match(reportRoute, /requireStaffRole\(staffRole, \["platform_owner"\]\)/);
  assert.match(reportRoute, /Cache-Control.*no-store/s);
});

test("integrity ingest requires an independent signed server secret", () => {
  const route = read("app/api/internal/integrity-audit/route.ts");
  const server = read("lib/orbyven-integrity-server.ts");

  assert.match(route, /authorizeIntegrityIngest\(request\)/);
  assert.match(server, /ORBYVEN_INTEGRITY_INGEST_SECRET/);
  assert.match(server, /x-orbyven-integrity-secret/);
  assert.match(server, /timingSafeEqual/);
  assert.match(server, /integrity_report_digest_mismatch/);
  assert.match(server, /integrity_run_conflict/);
});

test("integrity tables are server-only with RLS and no browser grants", () => {
  const migration = read(
    "supabase/migrations/20261017115000_control_center_integrity_audit.sql"
  );

  for (const table of [
    "platform_integrity_runs",
    "platform_integrity_findings",
    "platform_integrity_actions",
  ]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(
      migration,
      new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`)
    );
    assert.match(migration, new RegExp(`grant all on table public\\.${table} to service_role`));
  }
});

test("Guardian is structurally limited to PR preparation", () => {
  const contracts = read("lib/orbyven-integrity-contracts.ts");
  const server = read("lib/orbyven-integrity-server.ts");
  const workflow = read(".github/workflows/daily-integrity-audit.yml");

  assert.match(contracts, /mode: "pr_only"/);
  assert.match(contracts, /automatic_merge: false/);
  assert.match(contracts, /direct_production_writes: false/);
  assert.match(server, /mode: "prepare_pr"/);
  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
});

test("scheduled audit remains disabled until the private-audit safety switch is enabled", () => {
  const workflow = read(".github/workflows/daily-integrity-audit.yml");

  assert.match(workflow, /ORBYVEN_ENABLE_PRIVATE_AUDIT == 'true'/);
  assert.match(workflow, /TZ=Europe\/Bucharest date \+%H:%M/);
  assert.match(workflow, /"07:30"/);
});
