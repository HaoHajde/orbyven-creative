export const IMPORT_SOURCE_LIMITS = {
  maxBytes: 512 * 1024,
  maxRows: 5_000,
  maxColumns: 100,
  maxCellCharacters: 10_000,
} as const;

export type ImportSourceDelimiter = "," | ";" | "\t";

export type ImportSourceFormat = "csv" | "tsv";

export type ParsedImportSource = {
  format: ImportSourceFormat;
  delimiter: ImportSourceDelimiter;
  byteLength: number;
  headers: string[];
  rows: string[][];
  summary: {
    dataRows: number;
    columns: number;
  };
};

export class ImportSourceError extends Error {
  readonly code:
    | "SOURCE_REQUIRED"
    | "SOURCE_TOO_LARGE"
    | "SOURCE_CONTAINS_NUL"
    | "SOURCE_UNTERMINATED_QUOTE"
    | "SOURCE_TOO_MANY_ROWS"
    | "SOURCE_TOO_MANY_COLUMNS"
    | "SOURCE_CELL_TOO_LARGE"
    | "SOURCE_HEADER_REQUIRED"
    | "SOURCE_ROW_TOO_WIDE";

  constructor(code: ImportSourceError["code"]) {
    super(code);
    this.name = "ImportSourceError";
    this.code = code;
  }
}

function sourceBytes(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function firstLogicalRecord(source: string) {
  let quoted = false;
  let record = "";
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        record += '""';
        index += 1;
        continue;
      }
      quoted = !quoted;
      record += character;
      continue;
    }
    if (!quoted && (character === "\n" || character === "\r")) break;
    record += character;
  }
  return record;
}

function delimiterCount(record: string, delimiter: ImportSourceDelimiter) {
  let quoted = false;
  let count = 0;
  for (let index = 0; index < record.length; index += 1) {
    const character = record[index];
    if (character === '"') {
      if (quoted && record[index + 1] === '"') {
        index += 1;
        continue;
      }
      quoted = !quoted;
      continue;
    }
    if (!quoted && character === delimiter) count += 1;
  }
  return count;
}

function detectDelimiter(source: string, requestedFormat: "auto" | ImportSourceFormat): ImportSourceDelimiter {
  if (requestedFormat === "tsv") return "\t";
  const record = firstLogicalRecord(source);
  const candidates: ImportSourceDelimiter[] = requestedFormat === "csv" ? [",", ";"] : [",", ";", "\t"];
  let selected = candidates[0];
  let selectedCount = -1;
  for (const candidate of candidates) {
    const count = delimiterCount(record, candidate);
    if (count > selectedCount) {
      selected = candidate;
      selectedCount = count;
    }
  }
  return selected;
}

function assertCellSize(value: string) {
  if (value.length > IMPORT_SOURCE_LIMITS.maxCellCharacters) {
    throw new ImportSourceError("SOURCE_CELL_TOO_LARGE");
  }
}

function parseRecords(source: string, delimiter: ImportSourceDelimiter) {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;

  const pushCell = () => {
    assertCellSize(cell);
    record.push(cell);
    cell = "";
    if (record.length > IMPORT_SOURCE_LIMITS.maxColumns) {
      throw new ImportSourceError("SOURCE_TOO_MANY_COLUMNS");
    }
  };
  const pushRecord = () => {
    pushCell();
    records.push(record);
    record = [];
    if (records.length > IMPORT_SOURCE_LIMITS.maxRows + 1) {
      throw new ImportSourceError("SOURCE_TOO_MANY_ROWS");
    }
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (!quoted && character === delimiter) {
      pushCell();
      continue;
    }
    if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      pushRecord();
      continue;
    }
    cell += character;
    if (cell.length > IMPORT_SOURCE_LIMITS.maxCellCharacters) {
      throw new ImportSourceError("SOURCE_CELL_TOO_LARGE");
    }
  }

  if (quoted) throw new ImportSourceError("SOURCE_UNTERMINATED_QUOTE");
  if (cell.length > 0 || record.length > 0) pushRecord();
  return records;
}

export function parseDelimitedImportSource(
  rawSource: string,
  requestedFormat: "auto" | ImportSourceFormat = "auto",
): ParsedImportSource {
  if (typeof rawSource !== "string" || rawSource.length === 0) {
    throw new ImportSourceError("SOURCE_REQUIRED");
  }
  const byteLength = sourceBytes(rawSource);
  if (byteLength > IMPORT_SOURCE_LIMITS.maxBytes) {
    throw new ImportSourceError("SOURCE_TOO_LARGE");
  }
  if (rawSource.includes("\0")) throw new ImportSourceError("SOURCE_CONTAINS_NUL");

  const source = rawSource.charCodeAt(0) === 0xfeff ? rawSource.slice(1) : rawSource;
  const delimiter = detectDelimiter(source, requestedFormat);
  const records = parseRecords(source, delimiter);
  if (records.length === 0 || records[0].every(value => value.trim() === "")) {
    throw new ImportSourceError("SOURCE_HEADER_REQUIRED");
  }

  const headers = records[0];
  const rows = records.slice(1).map(row => {
    if (row.length === 1 && row[0].trim() === "" && headers.length > 1) return Array(headers.length).fill("");
    if (row.length > headers.length) throw new ImportSourceError("SOURCE_ROW_TOO_WIDE");
    if (row.length === headers.length) return row;
    return [...row, ...Array(headers.length - row.length).fill("")];
  });
  if (rows.length > IMPORT_SOURCE_LIMITS.maxRows) {
    throw new ImportSourceError("SOURCE_TOO_MANY_ROWS");
  }
  const columns = headers.length;
  if (columns > IMPORT_SOURCE_LIMITS.maxColumns) {
    throw new ImportSourceError("SOURCE_TOO_MANY_COLUMNS");
  }

  return {
    format: delimiter === "\t" ? "tsv" : "csv",
    delimiter,
    byteLength,
    headers,
    rows,
    summary: { dataRows: rows.length, columns },
  };
}
