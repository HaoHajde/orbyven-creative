import assert from "node:assert/strict";
import test from "node:test";
import { buildImportPreflight, ImportPreflightError } from "../lib/data-portability/import-preflight.ts";

const tenant = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  authenticatedOrganizationId: "11111111-1111-4111-8111-111111111111",
};

const fields = [
  { key: "name", label: "Nume", required: true, type: "text" },
  { key: "email", label: "Email", required: true, type: "email" },
  { key: "amount", label: "Valoare", type: "number" },
];

const mapping = {
  Nume: "name",
  Email: "email",
  Valoare: "amount",
};

test("import preflight fails closed when tenant identity is missing or ambiguous", () => {
  assert.throws(
    () => buildImportPreflight({
      tenant: { organizationId: "", authenticatedOrganizationId: tenant.authenticatedOrganizationId },
      headers: ["Nume"], rows: [["Ana"]], fields, mapping: { Nume: "name" }, duplicateKeyFields: ["name"],
    }),
    error => error instanceof ImportPreflightError && error.code === "TENANT_SCOPE_REQUIRED",
  );

  assert.throws(
    () => buildImportPreflight({
      tenant: { organizationId: tenant.organizationId, authenticatedOrganizationId: "22222222-2222-4222-8222-222222222222" },
      headers: ["Nume"], rows: [["Ana"]], fields, mapping: { Nume: "name" }, duplicateKeyFields: ["name"],
    }),
    error => error instanceof ImportPreflightError && error.code === "TENANT_SCOPE_MISMATCH",
  );
});

test("mapping blocks unknown, duplicate and missing required destinations before row import", () => {
  const report = buildImportPreflight({
    tenant,
    headers: ["Nume", "Email", "Alias"],
    rows: [["Ana", "ana@example.ro", "A"]],
    fields,
    mapping: { Nume: "name", Email: "name", Alias: "missing" },
    duplicateKeyFields: ["email"],
  });

  assert.equal(report.status, "blocked");
  assert.equal(report.canConfirm, false);
  assert.equal(report.duplicatePolicy, "skip");
  assert.deepEqual(
    new Set(report.mappingIssues.map(issue => issue.code)),
    new Set(["duplicate_target_mapping", "unknown_target_field", "required_target_unmapped", "duplicate_key_unmapped"]),
  );
  assert.equal(report.summary.readyRows, 0);
});

test("row validation reports required/type errors without mutating destination data", () => {
  const report = buildImportPreflight({
    tenant,
    headers: ["Nume", "Email", "Valoare"],
    rows: [
      ["Ana", "ana@example.ro", "120,50"],
      ["", "nu-este-email", "abc"],
    ],
    fields,
    mapping,
    duplicateKeyFields: ["email"],
  });

  assert.equal(report.status, "needs_review");
  assert.equal(report.canConfirm, false);
  assert.equal(report.summary.readyRows, 1);
  assert.equal(report.summary.invalidRows, 1);
  assert.deepEqual(
    new Set(report.preview[1].issues.map(issue => issue.code)),
    new Set(["required_value_missing", "invalid_value_type"]),
  );
});

test("duplicates are reported and skipped non-destructively against existing and source rows", () => {
  const report = buildImportPreflight({
    tenant,
    headers: ["Nume", "Email", "Valoare"],
    rows: [
      ["Ana", "ANA@example.ro", "10"],
      ["Ana duplicat", " ana@example.ro ", "20"],
      ["Mihai", "mihai@example.ro", "30"],
      ["Nou", "nou@example.ro", "40"],
    ],
    fields,
    mapping,
    duplicateKeyFields: ["email"],
    existingRecords: [{ email: "mihai@example.ro" }],
  });

  assert.equal(report.status, "ready");
  assert.equal(report.canConfirm, true);
  assert.equal(report.duplicatePolicy, "skip");
  assert.deepEqual(report.summary, {
    totalRows: 4,
    readyRows: 2,
    invalidRows: 0,
    duplicateRows: 2,
    duplicateSourceRows: 1,
    duplicateExistingRows: 1,
    blankRows: 0,
  });
  assert.equal(report.preview[1].action, "skip_duplicate");
  assert.equal(report.preview[1].duplicateKind, "source");
  assert.equal(report.preview[2].action, "skip_duplicate");
  assert.equal(report.preview[2].duplicateKind, "existing");
});

test("blank rows are ignored and preview is bounded while totals stay complete", () => {
  const rows = [
    ["", "", ""],
    ...Array.from({ length: 12 }, (_, index) => [`Client ${index}`, `client${index}@example.ro`, String(index)]),
  ];
  const report = buildImportPreflight({
    tenant,
    headers: ["Nume", "Email", "Valoare"],
    rows,
    fields,
    mapping,
    duplicateKeyFields: ["email"],
    previewLimit: 3,
  });

  assert.equal(report.status, "ready");
  assert.equal(report.summary.totalRows, 13);
  assert.equal(report.summary.blankRows, 1);
  assert.equal(report.summary.readyRows, 12);
  assert.equal(report.preview.length, 3);
  assert.equal(report.preview[0].action, "skip_blank");
});

test("duplicate detection is mandatory before confirmation", () => {
  const report = buildImportPreflight({
    tenant,
    headers: ["Nume", "Email", "Valoare"],
    rows: [["Ana", "ana@example.ro", "10"]],
    fields,
    mapping,
  });

  assert.equal(report.status, "blocked");
  assert.equal(report.canConfirm, false);
  assert.ok(report.mappingIssues.some(issue => issue.code === "duplicate_detection_not_configured"));
});
