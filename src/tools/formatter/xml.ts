const TOKEN = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<![^>]*>|<\/?[^>]+>|[^<]+/g;

const isOpenTag = (t: string) => /^<[^!?/]/.test(t) && !t.endsWith('/>');
const isCloseTag = (t: string) => t.startsWith('</');

function assertWellFormed(source: string) {
  const doc = new DOMParser().parseFromString(source, 'application/xml');
  const error = doc.querySelector('parsererror');
  if (error) {
    throw new Error(error.textContent?.trim().split('\n')[0] || 'Invalid XML');
  }
}

export function formatXml(source: string, indentSize: number): string {
  assertWellFormed(source);
  const indentUnit = ' '.repeat(indentSize);
  const tokens = (source.match(TOKEN) ?? [])
    .map((t) => (t.startsWith('<') ? t : t.trim()))
    .filter((t) => t.length > 0);

  const lines: string[] = [];
  let depth = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const pad = indentUnit.repeat(depth);

    if (isCloseTag(token)) {
      depth = Math.max(0, depth - 1);
      lines.push(indentUnit.repeat(depth) + token);
    } else if (isOpenTag(token)) {
      const next = tokens[i + 1];
      const after = tokens[i + 2];
      if (next !== undefined && !next.startsWith('<') && after !== undefined && isCloseTag(after)) {
        lines.push(`${pad}${token}${next}${after}`);
        i += 2;
      } else {
        lines.push(pad + token);
        depth++;
      }
    } else {
      lines.push(pad + token);
    }
  }
  return lines.join('\n');
}
