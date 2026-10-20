import { LIMITS, normalizeHeader, stableHash } from "./constants.mjs";
import { CultureTraceValidationError } from "./errors.mjs";

function asText(input) {
  if (typeof input === "string") return input;
  if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(input instanceof Uint8Array ? input : new Uint8Array(input));
    } catch {
      throw new CultureTraceValidationError("The file is not valid UTF-8.", [{ code: "invalid-encoding" }]);
    }
  }
  throw new CultureTraceValidationError("CSV input must be text or UTF-8 bytes.", [{ code: "invalid-input" }]);
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r\n|\n|\r/, 1)[0] ?? "";
  const candidates = [",", ";", "\t"];
  return candidates.sort((a, b) => {
    const count = (line, delimiter) => line.split(delimiter).length - 1;
    return count(firstLine, b) - count(firstLine, a);
  })[0];
}

export function parseCsv(input, options = {}) {
  const limits = { ...LIMITS, ...(options.limits ?? {}) };
  const text = asText(input).replace(/^\uFEFF/, "");
  const byteLength = new TextEncoder().encode(text).byteLength;
  if (byteLength > limits.maxInputBytes) {
    throw new CultureTraceValidationError("This file exceeds the configured import limit.", [{ code: "input-too-large", byteLength, limit: limits.maxInputBytes }]);
  }
  if (text.includes("\0")) throw new CultureTraceValidationError("The CSV contains a NUL byte and cannot be imported.", [{ code: "nul-byte" }]);

  const delimiter = options.delimiter ?? detectDelimiter(text);
  const rows = [];
  const current = [];
  let cell = "";
  let inQuotes = false;
  let rowNumber = 1;
  let cellStartRow = 1;
  const pushCell = () => {
    if (cell.length > limits.maxCellCharacters) throw new CultureTraceValidationError("A CSV cell exceeds the configured limit.", [{ code: "cell-too-large", rowNumber: cellStartRow }]);
    current.push(cell);
    cell = "";
  };
  const pushRow = () => {
    pushCell();
    if (current.length > limits.maxColumns) throw new CultureTraceValidationError("The CSV contains too many columns.", [{ code: "too-many-columns", limit: limits.maxColumns }]);
    if (current.some((value) => value !== "")) rows.push({ rowNumber, cells: current.splice(0) });
    else current.length = 0;
    rowNumber += 1;
    cellStartRow = rowNumber;
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 1; }
        else inQuotes = false;
      } else cell += char;
      continue;
    }
    if (char === '"' && cell.length === 0) { inQuotes = true; continue; }
    if (char === delimiter) { pushCell(); continue; }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      pushRow();
      continue;
    }
    cell += char;
  }
  if (inQuotes) throw new CultureTraceValidationError("The CSV ends inside a quoted cell.", [{ code: "unterminated-quote", rowNumber: cellStartRow }]);
  if (cell.length || current.length) pushRow();
  if (rows.length < 2) throw new CultureTraceValidationError("The CSV needs a header and at least one data row.", [{ code: "not-enough-rows" }]);

  const originalHeaders = rows.shift().cells.map((value) => String(value));
  const normalized = originalHeaders.map(normalizeHeader);
  const seen = new Set();
  const headers = originalHeaders.map((name, index) => {
    const key = normalized[index];
    if (!key) throw new CultureTraceValidationError("A header is empty after normalization.", [{ code: "empty-header", column: index + 1 }]);
    if (seen.has(key)) throw new CultureTraceValidationError("Two headers normalize to the same name.", [{ code: "duplicate-header", header: key }]);
    seen.add(key);
    return { name, normalized: key, columnIndex: index };
  });
  const expectedWidth = headers.length;
  const diagnostics = [];
  const dataRows = rows.map(({ rowNumber: sourceRow, cells }) => {
    if (cells.length !== expectedWidth) diagnostics.push({ code: "row-width", severity: "warning", rowNumber: sourceRow, expected: expectedWidth, actual: cells.length });
    const padded = cells.slice(0, expectedWidth);
    while (padded.length < expectedWidth) padded.push("");
    return { rowNumber: sourceRow, cells: padded, raw: Object.fromEntries(headers.map((header, index) => [header.name, padded[index] ?? ""])) };
  });
  if (dataRows.length > limits.maxRows) throw new CultureTraceValidationError("The CSV contains too many rows.", [{ code: "too-many-rows", limit: limits.maxRows }]);
  return {
    format: "culturetrace-csv-table",
    schemaVersion: 1,
    source: { sourceId: options.sourceId ?? `upload-${stableHash(text)}`, filename: options.filename ?? "dataset.csv", byteLength, digest: stableHash(text) },
    delimiter: delimiter === "\t" ? "tab" : delimiter,
    headers,
    rows: dataRows,
    diagnostics,
  };
}
