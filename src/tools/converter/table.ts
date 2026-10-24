// Shared helpers for the tabular formats (CSV and Markdown tables).

export interface Table {
  headers: string[];
  rows: string[][];
}

type Json = unknown;

const isPlainObject = (v: Json): v is Record<string, Json> => typeof v === 'object' && v !== null && !Array.isArray(v);

function flatten(value: Json, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (isPlainObject(value) && Object.keys(value).length > 0) {
    for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, out);
  } else {
    const key = prefix || 'value';
    out[key] = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
  return out;
}

// Arrays of objects become one row per object (nested objects get dotted headers);
// anything else becomes a single-column or single-row table.
export function valueToTable(value: Json): Table {
  const records = Array.isArray(value) ? value : [value];
  const flat = records.map((r) => flatten(r));
  const headers: string[] = [];
  for (const record of flat) for (const key of Object.keys(record)) if (!headers.includes(key)) headers.push(key);
  return { headers, rows: flat.map((record) => headers.map((h) => record[h] ?? '')) };
}

export function inferType(text: string): unknown {
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(text)) return Number(text);
  return text;
}

export function tableToValue({ headers, rows }: Table, detectTypes: boolean): Record<string, unknown>[] {
  return rows.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, detectTypes ? inferType(row[i] ?? '') : (row[i] ?? '')])),
  );
}
