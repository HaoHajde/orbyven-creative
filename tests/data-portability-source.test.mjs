import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  IMPORT_SOURCE_LIMITS,
  ImportSourceError,
  parseDelimitedImportSource,
} from "../lib/data-portability/import-source.ts";

const routeSource = readFileSync(
  new URL("../app/api/workspace/data-import/preflight/route.ts", import.meta.url),
  "utf8",
);

test("CSV source parser handles BOM, semicolon dialect, quoted delimiters, multiline cells and escaped quotes", () => {
  const source = '\ufeffNume;Email;Nota\r\n"Ana; Maria";ana@example.ro;"Linia 1\nLinia 2"\r\nBob;bob@example.ro;"A spus ""da"""';
  const parsed = parseDelimitedImportSource(source, "auto");

  assert.equal(parsed.format, "csv");
  assert.equal(parsed.delimiter, ";");
  assert.deepEqual(parsed.headers, ["Nume", "Email", "Nota"]);
  assert.deepEqual(parsed.rows, [
    ["Ana; Maria", "ana@example.ro", "Linia 1\nLinia 2"],
    ["Bob", "bob@example.ro", 'A spus "da"'],
  ]);
  assert.deepEqual(parsed.summary, { dataRows: 2, columns: 3 });
});

test("TSV parsing is explicit and missing trailing cells are normalized without discarding row position", () => {
  const parsed = parseDelimitedImportSource("Nume\tEmail\tTelefon\nAna\tana@example.ro\n\n", "tsv");

  assert.equal(parsed.format, "tsv");
  assert.equal(parsed.delimiter, "\t");
  assert.deepEqual(parsed.rows[0], ["Ana", "ana@example.ro", ""]);
  assert.deepEqual(parsed.rows[1], ["", "", ""]);
});

test("CSV mode does not silently switch to TSV", () => {
  const parsed = parseDelimitedImportSource("Nume\tEmail\nAna\tana@example.ro", "csv");

  assert.equal(parsed.format, "csv");
  assert.equal(parsed.delimiter, ",");
  assert.deepEqual(parsed.headers, ["Nume\tEmail"]);
});

test("source parser fails closed on malformed quotes and rows wider than the header", () => {
  assert.throws(
    () => parseDelimitedImportSource('Nume,Email\n"Ana,ana@example.ro', "csv"),
    error => error instanceof ImportSourceError && error.code === "SOURCE_UNTERMINATED_QUOTE",
  );
  assert.throws(
    () => parseDelimitedImportSource("Nume,Email\nAna,ana@example.ro,extra", "csv"),
    error => error instanceof ImportSourceError && error.code === "SOURCE_ROW_TOO_WIDE",
  );
});

test("source parser enforces bounded cells, columns and payload size", () => {
  const largeCell = "x".repeat(IMPORT_SOURCE_LIMITS.maxCellCharacters + 1);
  assert.throws(
    () => parseDelimitedImportSource(`Nume\n${largeCell}`, "csv"),
    error => error instanceof ImportSourceError && error.code === "SOURCE_CELL_TOO_LARGE",
  );

  const tooManyHeaders = Array.from({ length: IMPORT_SOURCE_LIMITS.maxColumns + 1 }, (_, index) => `C${index}`).join(",");
  assert.throws(
    () => parseDelimitedImportSource(tooManyHeaders, "csv"),
    error => error instanceof ImportSourceError && error.code === "SOURCE_TOO_MANY_COLUMNS",
  );

  const oversized = "x".repeat(IMPORT_SOURCE_LIMITS.maxBytes + 1);
  assert.throws(
    () => parseDelimitedImportSource(oversized, "csv"),
    error => error instanceof ImportSourceError && error.code === "SOURCE_TOO_LARGE",
  );
});

test("authenticated import preflight route reuses canonical tenant auth and stays zero-write", () => {
  assert.match(routeSource, /authenticateBillingActor\(request, organizationId\)/);
  assert.match(routeSource, /parseDelimitedImportSource\(sourceText, format\)/);
  assert.match(routeSource, /buildImportPreflight\(\{/);
  assert.match(routeSource, /authenticatedOrganizationId: actor\.organizationId/);
  assert.match(routeSource, /existingRecords: \[\]/);
  assert.match(routeSource, /client_existing_records_forbidden/);
  assert.match(routeSource, /canConfirm: false/);
  assert.match(routeSource, /existing_duplicate_check_required/);
  assert.match(routeSource, /writesPerformed: false/);
  assert.match(routeSource, /private, no-store/);

  assert.doesNotMatch(routeSource, /createBillingServiceClient/);
  assert.doesNotMatch(routeSource, /\.from\(/);
  assert.doesNotMatch(routeSource, /\.storage\b/);
  assert.doesNotMatch(routeSource, /\.insert\(/);
  assert.doesNotMatch(routeSource, /\.update\(/);
  assert.doesNotMatch(routeSource, /\.upsert\(/);
  assert.doesNotMatch(routeSource, /\.delete\(/);
});
