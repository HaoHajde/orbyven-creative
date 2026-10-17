import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("integrity UI API remains platform-owner and explicit-owner only", () => {
  const route = read("app/api/control-center/integrity/route.ts");
  const reportRoute = read("app/api/control-center/integrity/report/route.ts");
  const ownerGuard = read("lib/orbyven-integrity-owner.ts");

  assert.match(route, /authorizeControlCenter\(request\)/);
  assert.match(route, /requireStaffRole\(staffRole, \["platform_owner"\]\)/);
  assert.match(route, /requireIntegrityOwner\(user\.id\)/);
  assert.match(reportRoute, /authorizeControlCenter\(request\)/);
  assert.match(reportRoute, /requireStaffRole\(staffRole, \["platform_owner"\]\)/);
  assert.match(reportRoute, /requireIntegrityOwner\(user\.id\)/);
  assert.match(reportRoute, /Cache-Control.*no-store/s);
  assert.match(ownerGuard, /ORBYVEN_INTEGRITY_OWNER_ID/);
  assert.match(ownerGuard, /integrity_owner_not_configured/);
  assert.match(ownerGuard, /integrity_owner_required/);
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

test("Guardian queue is structurally limited to PR preparation", () => {
  const contracts = read("lib/orbyven-integrity-contracts.ts");
  const server = read("lib/orbyven-integrity-server.ts");

  assert.match(contracts, /mode: "pr_only"/);
  assert.match(contracts, /automatic_merge: false/);
  assert.match(contracts, /direct_production_writes: false/);
  assert.match(server, /mode: "prepare_pr"/);
});

test("daily integrity workflow is private-repo only and cannot write repository contents", () => {
  const workflow = read(".github/workflows/daily-integrity-audit.yml");

  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.match(workflow, /github\.event\.repository\.private == true/);
  assert.match(workflow, /ORBYVEN_ENABLE_PRIVATE_AUDIT == 'true'/);
  assert.match(workflow, /TZ=Europe\/Bucharest date \+%H:%M/);
  assert.match(workflow, /"07:30"/);
  assert.match(workflow, /persist-credentials: false/);
});

test("daily security audit includes production dependency vulnerability scanning", () => {
  const runner = read("scripts/run-integrity-audit.mjs");

  assert.match(runner, /Production dependency vulnerabilities/);
  assert.match(runner, /"audit", "--omit=dev", "--audit-level=high"/);
});

test("Guardian AI runs only on a private repo and without a write-capable GitHub token", () => {
  const workflow = read(".github/workflows/guardian-pr-worker.yml");

  assert.match(workflow, /github\.event\.repository\.private == true/);
  assert.match(workflow, /prepare-patch:[\s\S]*permissions:\s*\n\s*contents: read/);
  assert.match(workflow, /openai\/codex-action@a8d8be6ee028bea4525bc722d16f36687b408c81/);
  assert.match(workflow, /permission-profile: ":workspace"/);
  assert.match(workflow, /safety-strategy: "drop-sudo"/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /ORBYVEN_ENABLE_GUARDIAN == 'true'/);

  const prepareJob = workflow.split("validate-and-open-pr:")[0];
  assert.doesNotMatch(prepareJob, /contents:\s*write/);
  assert.doesNotMatch(prepareJob, /pull-requests:\s*write/);
});

test("Guardian write token exists only in trusted validation job", () => {
  const workflow = read(".github/workflows/guardian-pr-worker.yml");
  const trustedJob = workflow.split("validate-and-open-pr:")[1];

  assert.match(trustedJob, /contents: write/);
  assert.match(trustedJob, /pull-requests: write/);
  assert.match(trustedJob, /Independently enforce Guardian trust boundary/);
  assert.match(trustedJob, /Prevent validation-script tampering/);
  assert.match(trustedJob, /npm run validate/);
  assert.match(trustedJob, /gh pr create --draft/);
  assert.doesNotMatch(trustedJob, /openai\/codex-action/);
  assert.doesNotMatch(workflow, /gh pr merge/);
});

test("Guardian cannot self-modify its own trust boundaries", () => {
  const workflow = read(".github/workflows/guardian-pr-worker.yml");
  const prompt = read("scripts/guardian-claim.mjs");
  const boundaries = [
    ".github/workflows/",
    "app/api/internal/integrity-guardian/",
    "app/api/internal/integrity-audit/",
    "app/api/control-center/integrity/",
    "lib/orbyven-guardian-server.ts",
    "lib/orbyven-integrity-owner.ts",
    "scripts/guardian-claim.mjs",
    "scripts/guardian-result.mjs",
    "scripts/publish-integrity-audit.mjs",
    "tests/control-center-integrity.test.mjs",
    "supabase/migrations/20261017115000_control_center_integrity_audit.sql",
  ];

  assert.match(workflow, /lib\/orbyven-integrity-\*\.ts/);

  for (const boundary of boundaries) {
    const escaped = boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (boundary.startsWith("lib/orbyven-integrity-") && boundary !== "lib/orbyven-integrity-owner.ts") {
      continue;
    }
    assert.match(prompt, new RegExp(escaped));
    if (boundary !== "lib/orbyven-integrity-owner.ts") {
      assert.match(workflow, new RegExp(escaped));
    }
  }
  assert.match(prompt, /lib\/orbyven-integrity-owner\.ts/);
});

test("Guardian cannot rewrite critical package validation scripts", () => {
  const workflow = read(".github/workflows/guardian-pr-worker.yml");

  for (const script of [
    "lint",
    "typecheck",
    "build",
    "validate",
    "test:architecture",
    "test:security",
    "test:compliance",
    "test:seo",
  ]) {
    assert.match(workflow, new RegExp(`'${script.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`));
  }
  assert.match(workflow, /process\.exit\(43\)/);
});
