// Lightweight brace-based C# beautifier (Allman style). It re-indents and re-breaks lines;
// it does not parse the full language grammar.

const ACCESSORS = /^\{(\s*(?:(?:public|private|protected|internal)\s+)?(?:get|set|init)\s*;)+\s*\}$/;

function skipString(src: string, i: number): number {
  let j = i;
  while (src[j] === '$' || src[j] === '@') j++;
  if (src.startsWith('"""', j)) {
    const end = src.indexOf('"""', j + 3);
    return end === -1 ? src.length : end + 3;
  }
  const verbatim = src.slice(i, j).includes('@');
  const quote = src[j];
  j++;
  while (j < src.length) {
    const c = src[j];
    if (verbatim) {
      if (c === '"' && src[j + 1] === '"') j += 2;
      else if (c === '"') return j + 1;
      else j++;
    } else if (c === '\\') j += 2;
    else if (c === quote) return j + 1;
    else j++;
  }
  return src.length;
}

const stringStart = (src: string, i: number) => /^(\$@|@\$|\$|@)?"/.test(src.slice(i, i + 3)) ;

function findMatchingBrace(src: string, open: number): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      if (nl === -1) return -1;
      i = nl;
    } else if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end === -1) return -1;
      i = end + 1;
    } else if (stringStart(src, i)) {
      i = skipString(src, i) - 1;
    } else if (c === "'") {
      i = skipChar(src, i) - 1;
    } else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i;
  }
  return -1;
}

function skipChar(src: string, i: number): number {
  let j = i + 1;
  while (j < src.length && src[j] !== "'") j += src[j] === '\\' ? 2 : 1;
  return j + 1;
}

export function formatCSharp(source: string, indentSize: number): string {
  const src = source.replace(/\r\n?/g, '\n');
  const unit = ' '.repeat(indentSize);
  const out: string[] = [];
  let cur = '';
  let indent = 0;
  let paren = 0;
  let bracket = 0;

  const pushLines = (text: string) => {
    text.split('\n').forEach((line, n) => out.push(unit.repeat(indent) + (n ? ' ' : '') + line.trim()));
  };
  const flush = () => {
    if (cur.trim()) pushLines(cur.trim());
    cur = '';
  };
  const peekNext = (from: number) => {
    let j = from;
    while (j < src.length && /\s/.test(src[j])) j++;
    return src.slice(j, j + 5);
  };

  let i = 0;
  while (i < src.length) {
    const c = src[i];

    if (/\s/.test(c)) {
      let j = i;
      let newlines = 0;
      while (j < src.length && /\s/.test(src[j])) {
        if (src[j] === '\n') newlines++;
        j++;
      }
      if (cur && !cur.endsWith(' ')) cur += ' ';
      else if (!cur && newlines > 1 && out.length && out[out.length - 1] !== '') out.push('');
      i = j;
      continue;
    }

    if (c === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      const end = nl === -1 ? src.length : nl;
      cur += src.slice(i, end).trimEnd();
      flush();
      i = end;
      continue;
    }

    if (c === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2);
      const end = close === -1 ? src.length : close + 2;
      cur += src.slice(i, end);
      i = end;
      continue;
    }

    if (c === '#' && !cur) {
      const nl = src.indexOf('\n', i);
      const end = nl === -1 ? src.length : nl;
      out.push(src.slice(i, end).trim());
      i = end;
      continue;
    }

    if (stringStart(src, i)) {
      const end = skipString(src, i);
      cur += src.slice(i, end);
      i = end;
      continue;
    }

    if (c === "'") {
      const end = skipChar(src, i);
      cur += src.slice(i, end);
      i = end;
      continue;
    }

    switch (c) {
      case '(':
        paren++;
        cur += c;
        break;
      case ')':
        paren = Math.max(0, paren - 1);
        cur += c;
        break;
      case '[':
        bracket++;
        cur += c;
        break;
      case ']':
        bracket = Math.max(0, bracket - 1);
        cur += c;
        if (bracket === 0 && paren === 0 && cur.trimStart().startsWith('[') && /^\[[^\]]*\]$/.test(cur.trim())) {
          flush();
        }
        break;
      case ';':
        cur += c;
        if (paren === 0 && !/^[ \t]*\/\//.test(src.slice(i + 1))) flush();
        break;
      case '{': {
        const close = findMatchingBrace(src, i);
        const block = close === -1 ? '' : src.slice(i, close + 1);
        const head = cur.trimEnd();
        const expression = /(=|\]|\(|,)$/.test(head) || /\bnew\b[^;{}]*$/.test(head);
        const inline = block && ((!block.includes('\n') && ACCESSORS.test(block)) || expression);
        if (inline) {
          cur += /["'@$]/.test(block) ? block : block.replace(/\s+/g, ' ');
          i = close + 1;
          if (!expression) flush();
          continue;
        }
        flush();
        out.push(unit.repeat(indent) + '{');
        indent++;
        break;
      }
      case '}': {
        flush();
        indent = Math.max(0, indent - 1);
        cur = '}';
        const next = peekNext(i + 1);
        if (!/^[;,)]/.test(next)) flush();
        break;
      }
      default:
        cur += c;
    }
    i++;
  }
  flush();
  return out.join('\n');
}
