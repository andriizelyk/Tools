export type DiffKind = 'same' | 'added' | 'removed';

export interface DiffLine {
  kind: DiffKind;
  text: string;
  oldNo?: number;
  newNo?: number;
  /** Set on paired removed/added lines that are similar: the exact changed characters. */
  segments?: Segment[];
}

export interface Segment {
  text: string;
  changed: boolean;
}

export interface DiffOptions {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
}

const MAX_CELLS = 25_000_000;

export function diffLines(oldText: string, newText: string, opts: DiffOptions): DiffLine[] {
  const a = oldText ? oldText.split(/\r?\n/) : [];
  const b = newText ? newText.split(/\r?\n/) : [];
  const norm = (s: string) => {
    let r = s;
    if (opts.ignoreWhitespace) r = r.trim().replace(/\s+/g, ' ');
    if (opts.ignoreCase) r = r.toLowerCase();
    return r;
  };
  const na = a.map(norm);
  const nb = b.map(norm);

  let start = 0;
  while (start < na.length && start < nb.length && na[start] === nb[start]) start++;
  let endA = na.length;
  let endB = nb.length;
  while (endA > start && endB > start && na[endA - 1] === nb[endB - 1]) {
    endA--;
    endB--;
  }

  const n = endA - start;
  const m = endB - start;
  if (n * m > MAX_CELLS) throw new Error('Inputs are too large to compare in the browser.');

  // lcs[i][j] = length of the longest common subsequence of a[start+i..] and b[start+j..]
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] =
        na[start + i] === nb[start + j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let oldNo = 1;
  let newNo = 1;
  const same = (text: string) => result.push({ kind: 'same', text, oldNo: oldNo++, newNo: newNo++ });

  for (let k = 0; k < start; k++) same(b[k]);
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && na[start + i] === nb[start + j]) {
      same(b[start + j]);
      i++;
      j++;
    } else if (i < n && (j === m || lcs[i + 1][j] >= lcs[i][j + 1])) {
      result.push({ kind: 'removed', text: a[start + i], oldNo: oldNo++ });
      i++;
    } else {
      result.push({ kind: 'added', text: b[start + j], newNo: newNo++ });
      j++;
    }
  }
  for (let k = endB; k < b.length; k++) same(b[k]);
  annotateInline(result, opts.ignoreCase);
  return result;
}

export interface SplitRow {
  left?: DiffLine;
  right?: DiffLine;
}

// Pairs each run of removed lines with the run of added lines that follows it.
export function toSplitRows(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].kind === 'same') {
      rows.push({ left: lines[i], right: lines[i] });
      i++;
      continue;
    }
    const removed: DiffLine[] = [];
    const added: DiffLine[] = [];
    while (i < lines.length && lines[i].kind === 'removed') removed.push(lines[i++]);
    while (i < lines.length && lines[i].kind === 'added') added.push(lines[i++]);
    for (let k = 0; k < Math.max(removed.length, added.length); k++) {
      rows.push({ left: removed[k], right: added[k] });
    }
  }
  return rows;
}

const MAX_INLINE_CELLS = 1_000_000;
const MIN_SIMILARITY = 0.5;

function pushSegment(segments: Segment[], text: string, changed: boolean) {
  const last = segments[segments.length - 1];
  if (last && last.changed === changed) last.text += text;
  else segments.push({ text, changed });
}

// Character-level diff of two lines; null when they are too different to be worth highlighting.
function diffChars(oldLine: string, newLine: string, ignoreCase: boolean): [Segment[], Segment[]] | null {
  const a = Array.from(oldLine);
  const b = Array.from(newLine);
  const eq = (x: string, y: string) => (ignoreCase ? x.toLowerCase() === y.toLowerCase() : x === y);

  let start = 0;
  while (start < a.length && start < b.length && eq(a[start], b[start])) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && eq(a[endA - 1], b[endB - 1])) {
    endA--;
    endB--;
  }
  const n = endA - start;
  const m = endB - start;
  if (n * m > MAX_INLINE_CELLS) return null;

  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = eq(a[start + i], b[start + j]) ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const common = start + lcs[0][0] + (a.length - endA);
  if (common / Math.max(a.length, b.length) < MIN_SIMILARITY) return null;

  const left: Segment[] = [];
  const right: Segment[] = [];
  if (start) {
    pushSegment(left, a.slice(0, start).join(''), false);
    pushSegment(right, b.slice(0, start).join(''), false);
  }
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && eq(a[start + i], b[start + j])) {
      pushSegment(left, a[start + i], false);
      pushSegment(right, b[start + j], false);
      i++;
      j++;
    } else if (i < n && (j === m || lcs[i + 1][j] >= lcs[i][j + 1])) {
      pushSegment(left, a[start + i++], true);
    } else {
      pushSegment(right, b[start + j++], true);
    }
  }
  if (endA < a.length) {
    pushSegment(left, a.slice(endA).join(''), false);
    pushSegment(right, b.slice(endB).join(''), false);
  }
  return [left, right];
}

function annotateInline(lines: DiffLine[], ignoreCase: boolean) {
  let i = 0;
  while (i < lines.length) {
    if (lines[i].kind === 'same') {
      i++;
      continue;
    }
    const removed: DiffLine[] = [];
    const added: DiffLine[] = [];
    while (i < lines.length && lines[i].kind === 'removed') removed.push(lines[i++]);
    while (i < lines.length && lines[i].kind === 'added') added.push(lines[i++]);
    for (let k = 0; k < Math.min(removed.length, added.length); k++) {
      const result = diffChars(removed[k].text, added[k].text, ignoreCase);
      if (result) {
        removed[k].segments = result[0];
        added[k].segments = result[1];
      }
    }
  }
}
