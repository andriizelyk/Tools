import type { Table } from './table';

export function parseCsv(text: string, delimiter: string): Table {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === '') quoted = true;
    else if (c === delimiter) {
      record.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      record.push(field);
      records.push(record);
      field = '';
      record = [];
    } else field += c;
  }
  if (quoted) throw new Error('CSV has an unterminated quoted field.');
  if (field !== '' || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  const nonEmpty = records.filter((r) => !(r.length === 1 && r[0] === ''));
  if (nonEmpty.length === 0) throw new Error('CSV is empty.');
  const [headers, ...rows] = nonEmpty;
  return { headers, rows };
}

export function stringifyCsv({ headers, rows }: Table, delimiter: string): string {
  const escape = (value: string) =>
    value.includes(delimiter) || /["\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  return [headers, ...rows].map((row) => row.map(escape).join(delimiter)).join('\n');
}
