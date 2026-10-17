export type ImportFieldType = "text" | "number" | "integer" | "boolean" | "date" | "email";

export type ImportFieldDefinition = {
  key: string;
  label?: string;
  required?: boolean;
  type?: ImportFieldType;
  maxLength?: number;
};

export type ImportColumnMapping = Record<string, string | null | undefined>;

export type ImportTenantScope = {
  organizationId: string;
  authenticatedOrganizationId: string;
};

export type ImportPreflightIssue = {
  code: string;
  message: string;
  sourceColumn?: string;
  targetField?: string;
  rowNumber?: number;
};

export type ImportPreflightRow = {
  rowNumber: number;
  action: "ready" | "skip_duplicate" | "invalid" | "skip_blank";
  duplicateKind: "source" | "existing" | null;
  values: Record<string, unknown>;
  issues: ImportPreflightIssue[];
};

export type ImportPreflightInput = {
  tenant: ImportTenantScope;
  headers: readonly string[];
  rows: readonly (readonly unknown[])[];
  fields: readonly ImportFieldDefinition[];
  mapping: ImportColumnMapping;
  duplicateKeyFields?: readonly string[];
  existingRecords?: readonly Readonly<Record<string, unknown>>[];
  previewLimit?: number;
};

export type ImportPreflightReport = {
  organizationId: string;
  status: "blocked" | "needs_review" | "ready";
  canConfirm: boolean;
  duplicatePolicy: "skip";
  mappingIssues: ImportPreflightIssue[];
  warnings: ImportPreflightIssue[];
  normalizedHeaders: string[];
  mappedTargetFields: string[];
  duplicateKeyFields: string[];
  summary: {
    totalRows: number;
    readyRows: number;
    invalidRows: number;
    duplicateRows: number;
    duplicateSourceRows: number;
    duplicateExistingRows: number;
    blankRows: number;
  };
  preview: ImportPreflightRow[];
};

export class ImportPreflightError extends Error {
  readonly code: "TENANT_SCOPE_REQUIRED" | "TENANT_SCOPE_MISMATCH";

  constructor(code: "TENANT_SCOPE_REQUIRED" | "TENANT_SCOPE_MISMATCH") {
    super(code);
    this.name = "ImportPreflightError";
    this.code = code;
  }
}

function cleanIdentifier(value: string) {
  return value.trim();
}

function requireTenantScope(scope: ImportTenantScope) {
  const requested = cleanIdentifier(scope.organizationId ?? "");
  const authenticated = cleanIdentifier(scope.authenticatedOrganizationId ?? "");
  if (!requested || !authenticated) throw new ImportPreflightError("TENANT_SCOPE_REQUIRED");
  if (requested !== authenticated) throw new ImportPreflightError("TENANT_SCOPE_MISMATCH");
  return requested;
}

function isBlank(value: unknown) {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function normalizedToken(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value.trim().toLocaleLowerCase("ro-RO");
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") return String(value);
  return JSON.stringify(value) ?? "";
}

function isValidForType(value: unknown, type: ImportFieldType) {
  if (isBlank(value)) return true;
  if (type === "text") return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
  if (type === "number" || type === "integer") {
    const number = typeof value === "number" ? value : Number(String(value).trim().replace(",", "."));
    return Number.isFinite(number) && (type !== "integer" || Number.isInteger(number));
  }
  if (type === "boolean") {
    if (typeof value === "boolean") return true;
    return ["true", "false", "1", "0", "yes", "no", "da", "nu"].includes(String(value).trim().toLowerCase());
  }
  if (type === "date") {
    if (value instanceof Date) return !Number.isNaN(value.getTime());
    return !Number.isNaN(Date.parse(String(value).trim()));
  }
  if (type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  return false;
}

function rowIsBlank(row: readonly unknown[]) {
  return row.every(isBlank);
}

function duplicateKey(values: Readonly<Record<string, unknown>>, fields: readonly string[]) {
  if (fields.length === 0) return null;
  const parts: string[] = [];
  for (const field of fields) {
    const value = values[field];
    if (isBlank(value)) return null;
    parts.push(`${field}:${normalizedToken(value)}`);
  }
  return parts.join("\u001f");
}

function mappingError(code: string, message: string, extra: Partial<ImportPreflightIssue> = {}): ImportPreflightIssue {
  return { code, message, ...extra };
}

export function buildImportPreflight(input: ImportPreflightInput): ImportPreflightReport {
  const organizationId = requireTenantScope(input.tenant);
  const previewLimit = Number.isInteger(input.previewLimit) && Number(input.previewLimit) > 0
    ? Math.min(Number(input.previewLimit), 100)
    : 20;
  const normalizedHeaders = input.headers.map(header => String(header ?? "").trim());
  const mappingIssues: ImportPreflightIssue[] = [];
  const warnings: ImportPreflightIssue[] = [];
  const headerIndex = new Map<string, number>();
  const headerTokens = new Set<string>();

  normalizedHeaders.forEach((header, index) => {
    if (!header) {
      mappingIssues.push(mappingError("blank_source_header", "Coloana sursă nu poate avea antet gol."));
      return;
    }
    const token = header.toLocaleLowerCase("ro-RO");
    if (headerTokens.has(token)) {
      mappingIssues.push(mappingError("duplicate_source_header", `Antetul sursă „${header}” este ambiguu.`, { sourceColumn: header }));
      return;
    }
    headerTokens.add(token);
    headerIndex.set(header, index);
  });

  const fields = new Map<string, ImportFieldDefinition>();
  for (const rawField of input.fields) {
    const key = cleanIdentifier(rawField.key ?? "");
    if (!key) {
      mappingIssues.push(mappingError("blank_target_field", "Câmpul destinație nu poate avea cheie goală."));
      continue;
    }
    if (fields.has(key)) {
      mappingIssues.push(mappingError("duplicate_target_field_definition", `Câmpul destinație „${key}” este definit de mai multe ori.`, { targetField: key }));
      continue;
    }
    fields.set(key, { ...rawField, key });
  }

  const mappedTargets = new Map<string, string>();
  for (const [sourceRaw, targetRaw] of Object.entries(input.mapping)) {
    const source = sourceRaw.trim();
    const target = targetRaw?.trim() || null;
    if (!headerIndex.has(source)) {
      mappingIssues.push(mappingError("unknown_source_column", `Coloana sursă „${source}” nu există.`, { sourceColumn: source }));
      continue;
    }
    if (!target) continue;
    if (!fields.has(target)) {
      mappingIssues.push(mappingError("unknown_target_field", `Câmpul destinație „${target}” nu există.`, { sourceColumn: source, targetField: target }));
      continue;
    }
    const previousSource = mappedTargets.get(target);
    if (previousSource) {
      mappingIssues.push(mappingError(
        "duplicate_target_mapping",
        `Câmpul „${target}” este mapat atât din „${previousSource}”, cât și din „${source}”.`,
        { sourceColumn: source, targetField: target },
      ));
      continue;
    }
    mappedTargets.set(target, source);
  }

  for (const field of fields.values()) {
    if (field.required && !mappedTargets.has(field.key)) {
      mappingIssues.push(mappingError("required_target_unmapped", `Câmpul obligatoriu „${field.label ?? field.key}” nu este mapat.`, { targetField: field.key }));
    }
  }

  for (const header of normalizedHeaders) {
    if (header && !Object.prototype.hasOwnProperty.call(input.mapping, header)) {
      warnings.push(mappingError("source_column_unmapped", `Coloana „${header}” nu este mapată și va fi ignorată.`, { sourceColumn: header }));
    }
  }

  const duplicateFields = [...new Set((input.duplicateKeyFields ?? []).map(cleanIdentifier).filter(Boolean))];
  if (duplicateFields.length === 0) {
    mappingIssues.push(mappingError(
      "duplicate_detection_not_configured",
      "Configurează cel puțin o cheie stabilă de duplicat înainte de confirmarea importului.",
    ));
  }
  for (const field of duplicateFields) {
    if (!fields.has(field)) {
      mappingIssues.push(mappingError("unknown_duplicate_key", `Cheia de duplicat „${field}” nu există în schema destinație.`, { targetField: field }));
    } else if (!mappedTargets.has(field)) {
      mappingIssues.push(mappingError("duplicate_key_unmapped", `Cheia de duplicat „${field}” trebuie mapată pentru verificare sigură.`, { targetField: field }));
    }
  }

  const mappedTargetFields = [...mappedTargets.keys()];
  if (mappingIssues.length > 0) {
    const blankRows = input.rows.filter(rowIsBlank).length;
    return {
      organizationId,
      status: "blocked",
      canConfirm: false,
      duplicatePolicy: "skip",
      mappingIssues,
      warnings,
      normalizedHeaders,
      mappedTargetFields,
      duplicateKeyFields: duplicateFields,
      summary: {
        totalRows: input.rows.length,
        readyRows: 0,
        invalidRows: input.rows.length - blankRows,
        duplicateRows: 0,
        duplicateSourceRows: 0,
        duplicateExistingRows: 0,
        blankRows,
      },
      preview: [],
    };
  }

  const existingKeys = new Set<string>();
  for (const record of input.existingRecords ?? []) {
    const key = duplicateKey(record, duplicateFields);
    if (key) existingKeys.add(key);
  }

  const seenSourceKeys = new Set<string>();
  const preview: ImportPreflightRow[] = [];
  let readyRows = 0;
  let invalidRows = 0;
  let duplicateSourceRows = 0;
  let duplicateExistingRows = 0;
  let blankRows = 0;

  input.rows.forEach((row, zeroBasedIndex) => {
    const rowNumber = zeroBasedIndex + 2;
    if (rowIsBlank(row)) {
      blankRows += 1;
      if (preview.length < previewLimit) preview.push({ rowNumber, action: "skip_blank", duplicateKind: null, values: {}, issues: [] });
      return;
    }

    const values: Record<string, unknown> = {};
    for (const [target, source] of mappedTargets.entries()) values[target] = row[headerIndex.get(source)!];

    const issues: ImportPreflightIssue[] = [];
    for (const field of fields.values()) {
      if (!mappedTargets.has(field.key)) continue;
      const value = values[field.key];
      if (field.required && isBlank(value)) {
        issues.push({ code: "required_value_missing", message: `„${field.label ?? field.key}” este obligatoriu.`, targetField: field.key, rowNumber });
        continue;
      }
      if (!isBlank(value) && field.type && !isValidForType(value, field.type)) {
        issues.push({ code: "invalid_value_type", message: `„${field.label ?? field.key}” nu are formatul ${field.type}.`, targetField: field.key, rowNumber });
      }
      if (!isBlank(value) && field.maxLength && String(value).length > field.maxLength) {
        issues.push({ code: "value_too_long", message: `„${field.label ?? field.key}” depășește ${field.maxLength} caractere.`, targetField: field.key, rowNumber });
      }
    }

    const key = duplicateKey(values, duplicateFields);
    if (!key) {
      issues.push({ code: "duplicate_key_missing", message: "Cheia stabilă de duplicat este incompletă; rândul nu poate fi importat sigur.", rowNumber });
    }

    let action: ImportPreflightRow["action"] = "ready";
    let duplicateKind: ImportPreflightRow["duplicateKind"] = null;
    if (issues.length > 0) {
      action = "invalid";
      invalidRows += 1;
    } else if (key && existingKeys.has(key)) {
      action = "skip_duplicate";
      duplicateKind = "existing";
      duplicateExistingRows += 1;
    } else if (key && seenSourceKeys.has(key)) {
      action = "skip_duplicate";
      duplicateKind = "source";
      duplicateSourceRows += 1;
    } else {
      readyRows += 1;
      if (key) seenSourceKeys.add(key);
    }

    if (preview.length < previewLimit) preview.push({ rowNumber, action, duplicateKind, values, issues });
  });

  const duplicateRows = duplicateSourceRows + duplicateExistingRows;
  return {
    organizationId,
    status: invalidRows > 0 ? "needs_review" : "ready",
    canConfirm: invalidRows === 0,
    duplicatePolicy: "skip",
    mappingIssues,
    warnings,
    normalizedHeaders,
    mappedTargetFields,
    duplicateKeyFields: duplicateFields,
    summary: {
      totalRows: input.rows.length,
      readyRows,
      invalidRows,
      duplicateRows,
      duplicateSourceRows,
      duplicateExistingRows,
      blankRows,
    },
    preview,
  };
}
