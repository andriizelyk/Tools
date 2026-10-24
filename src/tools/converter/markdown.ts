import type { Table } from './table';

function splitRow(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  const body = line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '');
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '\\' && body[i + 1] === '|') {
      cell += '|';
      i++;
    } else if (body[i] === '|') {
      cells.push(cell.trim());
      cell = '';
    } else cell += body[i];
  }
  cells.push(cell.trim());
  return cells.map((c) => c.replace(/<br\s*\/?>/gi, '\n'));
}

const isSeparator = (line: string) => /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(line) && line.includes('-');

// Reads the first GitHub-style table found in the document.
export function parseMarkdownTable(text: string): Table {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].includes('|') && isSeparator(lines[i + 1])) {
      const headers = splitRow(lines[i]);
      const rows: string[][] = [];
      for (let j = i + 2; j < lines.length && lines[j].includes('|') && lines[j].trim() !== ''; j++) {
        const cells = splitRow(lines[j]);
        rows.push(headers.map((_, k) => cells[k] ?? ''));
      }
      return { headers, rows };
    }
  }
  throw new Error('No Markdown table found. Expected a header row followed by a | --- | separator row.');
}

export function stringifyMarkdownTable({ headers, rows }: Table): string {
  const clean = (v: string) => v.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
  const cells = [headers, ...rows].map((r) => r.map(clean));
  const widths = headers.map((_, i) => Math.max(3, ...cells.map((r) => r[i].length)));
  const line = (r: string[]) => `| ${r.map((c, i) => c.padEnd(widths[i])).join(' | ')} |`;
  return [line(cells[0]), `| ${widths.map((w) => '-'.repeat(w)).join(' | ')} |`, ...cells.slice(1).map(line)].join('\n');
}
