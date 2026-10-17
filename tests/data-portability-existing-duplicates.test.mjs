import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildImportPreflight } from "../lib/data-portability/import-preflight.ts";
import {
  getImportTargetContract,
  parseImportTargetId,
} from "../lib/data-portability/import-targets.ts";

const readerSource = readFileSync(
  new URL("../lib/data-portability/import-existing-records.server.ts", import.meta.url),
  "utf8",
);
const routeSource = readFileSync(
  new URL("../app/api/workspace/data-import/preflight/route.ts", import.meta.url),
  "utf8",
);

test("CRM contacts is an allowlisted target with server-owned normalized email duplicate semantics", () => {
  assert.equal(parseImportTargetId("crm_contacts"), "crm_contacts");
  assert.equal(parseImportTargetId("crm_leads"), null);
  assert.equal(parseImportTargetId("other_table"), null);

  const contract = getImportTargetContract("crm_contacts");
  assert.equal(contract.requiredModuleId, "leads");
  assert.equal(contract.duplicateStrategy, "normalized_email");
  assert.deepEqual(contract.duplicateKeyFields, ["email"]);
  assert.ok(contract.fields.some(field => field.key === "name" && field.required));
  assert.ok(contract.fields.some(field => field.key === "email" && field.type === "email"));
});

test("CRM target preflight detects an existing email case-insensitively without overwriting it", () => {
  const contract = getImportTargetContract("crm_contacts");
  const report = buildImportPreflight({
    tenant: {
      organizationId: "11111111-1111-4111-8111-111111111111",
      authenticatedOrganizationId: "11111111-1111-4111-8111-111111111111",
    },
    headers: ["Nume", "Email"],
    rows: [
      ["Ana", "ANA@example.ro"],
      ["Bob", "bob@example.ro"],
    ],
    fields: contract.fields,
    mapping: { Nume: "name", Email: "email" },
    duplicateKeyFields: contract.duplicateKeyFields,
    existingRecords: [{ email: "ana@EXAMPLE.ro" }],
  });

  assert.equal(report.status, "ready");
  assert.equal(report.summary.duplicateExistingRows, 1);
  assert.equal(report.summary.readyRows, 1);
  assert.equal(report.preview[0].action, "skip_duplicate");
  assert.equal(report.preview[0].duplicateKind, "existing");
  assert.equal(report.duplicatePolicy, "skip");
});

test("existing duplicate reader is actor-scoped, entitlement-aware, bounded and read-only", () => {
  assert.match(readerSource, /Authorization: `Bearer \$\{accessToken\}`/);
  assert.match(readerSource, /\.from\("organization_entitlements"\)/);
  assert.match(readerSource, /\.eq\("organization_id", actor\.organizationId\)/);
  assert.match(readerSource, /contract\.requiredModuleId/);
  assert.match(readerSource, /TARGET_NOT_ENTITLED/);
  assert.match(readerSource, /\.from\("crm_leads"\)/);
  assert.match(readerSource, /\.select\("organization_id,email"\)/);
  assert.match(readerSource, /EXISTING_DUPLICATE_SCAN_LIMIT = 10_000/);
  assert.match(readerSource, /observedRows !== countQuery\.count/);
  assert.match(readerSource, /CROSS_TENANT_DUPLICATE_RESULT/);

  assert.doesNotMatch(readerSource, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(readerSource, /createBillingServiceClient/);
  assert.doesNotMatch(readerSource, /\.insert\(/);
  assert.doesNotMatch(readerSource, /\.update\(/);
  assert.doesNotMatch(readerSource, /\.upsert\(/);
  assert.doesNotMatch(readerSource, /\.delete\(/);
});

test("target-aware route derives contract and existing records server-side and still exposes no write execution", () => {
  assert.match(routeSource, /parseImportTargetId\(body\.target\)/);
  assert.match(routeSource, /import_target_contract_override_forbidden/);
  assert.match(routeSource, /getImportTargetContract\(targetId\)/);
  assert.match(routeSource, /loadExistingDuplicateCoverage\(actor, contract\)/);
  assert.match(routeSource, /existingRecords: coverage\.records/);
  assert.match(routeSource, /duplicateCoverage: \{/);
  assert.match(routeSource, /write_execution_not_available/);
  assert.match(routeSource, /writesPerformed: false/);
  assert.match(routeSource, /client_existing_records_forbidden/);
  assert.match(routeSource, /existing_duplicate_check_required/);

  assert.doesNotMatch(routeSource, /createBillingServiceClient/);
  assert.doesNotMatch(routeSource, /\.insert\(/);
  assert.doesNotMatch(routeSource, /\.update\(/);
  assert.doesNotMatch(routeSource, /\.upsert\(/);
  assert.doesNotMatch(routeSource, /\.delete\(/);
});
