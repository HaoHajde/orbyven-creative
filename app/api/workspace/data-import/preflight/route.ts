import { NextResponse } from "next/server";

import { authenticateBillingActor } from "@/lib/billing/supabase-server";
import {
  buildImportPreflight,
  ImportPreflightError,
  type ImportColumnMapping,
  type ImportFieldDefinition,
  type ImportFieldType,
} from "@/lib/data-portability/import-preflight";
import {
  IMPORT_SOURCE_LIMITS,
  ImportSourceError,
  parseDelimitedImportSource,
  type ImportSourceFormat,
} from "@/lib/data-portability/import-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = IMPORT_SOURCE_LIMITS.maxBytes + 128 * 1024;
const FIELD_TYPES = new Set<ImportFieldType>(["text", "number", "integer", "boolean", "date", "email"]);

function json(payload: object, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Pragma": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function uuid(value: unknown) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseFields(value: unknown): ImportFieldDefinition[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > IMPORT_SOURCE_LIMITS.maxColumns) return null;
  const fields: ImportFieldDefinition[] = [];
  for (const item of value) {
    if (!record(item)) return null;
    const key = typeof item.key === "string" ? item.key.trim() : "";
    if (!key || key.length > 128) return null;
    const type = item.type === undefined ? undefined : item.type;
    if (type !== undefined && (typeof type !== "string" || !FIELD_TYPES.has(type as ImportFieldType))) return null;
    if (item.label !== undefined && (typeof item.label !== "string" || item.label.length > 200)) return null;
    if (item.required !== undefined && typeof item.required !== "boolean") return null;
    if (item.maxLength !== undefined &&
      (typeof item.maxLength !== "number" || !Number.isInteger(item.maxLength) || item.maxLength < 1 || item.maxLength > 100_000)) return null;
    fields.push({
      key,
      ...(typeof item.label === "string" ? { label: item.label } : {}),
      ...(typeof item.required === "boolean" ? { required: item.required } : {}),
      ...(typeof type === "string" ? { type: type as ImportFieldType } : {}),
      ...(typeof item.maxLength === "number" ? { maxLength: item.maxLength } : {}),
    });
  }
  return fields;
}

function parseMapping(value: unknown): ImportColumnMapping | null {
  if (!record(value) || Object.keys(value).length > IMPORT_SOURCE_LIMITS.maxColumns) return null;
  const mapping: ImportColumnMapping = {};
  for (const [source, target] of Object.entries(value)) {
    if (!source.trim() || source.length > 500) return null;
    if (target !== null && target !== undefined && (typeof target !== "string" || target.length > 128)) return null;
    mapping[source] = typeof target === "string" ? target : null;
  }
  return mapping;
}

function parseDuplicateKeys(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 10) return null;
  const keys: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !item.trim() || item.length > 128) return null;
    keys.push(item.trim());
  }
  return keys;
}

function parseFormat(value: unknown): "auto" | ImportSourceFormat | null {
  return value === undefined || value === "auto" || value === "csv" || value === "tsv"
    ? (value ?? "auto") as "auto" | ImportSourceFormat
    : null;
}

function parsePreviewLimit(value: unknown) {
  if (value === undefined) return undefined;
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 100 ? value : null;
}

function sourceError(error: ImportSourceError) {
  if (error.code === "SOURCE_TOO_LARGE" || error.code === "SOURCE_TOO_MANY_ROWS" ||
    error.code === "SOURCE_TOO_MANY_COLUMNS" || error.code === "SOURCE_CELL_TOO_LARGE") {
    return json({ error: "import_source_limit", reason: error.code }, 413);
  }
  return json({ error: "invalid_import_source", reason: error.code }, 400);
}

function errorResponse(error: unknown) {
  if (error instanceof ImportSourceError) return sourceError(error);
  if (error instanceof ImportPreflightError) {
    return json({ error: "organization_access_denied", reason: error.code }, 403);
  }
  const message = error instanceof Error ? error.message : "";
  if (message === "AUTH_REQUIRED") return json({ error: "auth_required" }, 401);
  if (message === "ORG_ACCESS_REQUIRED") return json({ error: "organization_access_denied" }, 403);
  console.error("ORBYVEN import preflight failed", message);
  return json({ error: "import_preflight_unavailable" }, 500);
}

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return json({ error: "expected_json" }, 415);
    }
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
      return json({ error: "request_too_large" }, 413);
    }
    const rawBody = await request.text();
    if (byteLength(rawBody) > MAX_REQUEST_BYTES) return json({ error: "request_too_large" }, 413);

    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(rawBody) as unknown;
      if (!record(parsed)) return json({ error: "invalid_request" }, 400);
      body = parsed;
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const organizationId = uuid(body.organizationId);
    const sourceText = typeof body.sourceText === "string" ? body.sourceText : null;
    const fields = parseFields(body.fields);
    const mapping = parseMapping(body.mapping);
    const duplicateKeyFields = parseDuplicateKeys(body.duplicateKeyFields);
    const format = parseFormat(body.format);
    const previewLimit = parsePreviewLimit(body.previewLimit);

    if (!organizationId || sourceText === null || !fields || !mapping || !duplicateKeyFields || !format || previewLimit === null) {
      return json({ error: "invalid_request" }, 400);
    }
    if (body.existingRecords !== undefined) {
      return json({ error: "client_existing_records_forbidden" }, 400);
    }

    const actor = await authenticateBillingActor(request, organizationId);
    const source = parseDelimitedImportSource(sourceText, format);
    const preflight = buildImportPreflight({
      tenant: {
        organizationId,
        authenticatedOrganizationId: actor.organizationId,
      },
      headers: source.headers,
      rows: source.rows,
      fields,
      mapping,
      duplicateKeyFields,
      existingRecords: [],
      previewLimit,
    });

    return json({
      source: {
        format: source.format,
        delimiter: source.delimiter,
        byteLength: source.byteLength,
        ...source.summary,
      },
      preflight,
      execution: {
        canConfirm: false,
        writesPerformed: false,
        reason: "existing_duplicate_check_required",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
