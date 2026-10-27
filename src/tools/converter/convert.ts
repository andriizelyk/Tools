import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { parseCsv, stringifyCsv } from './csv';
import { parseMarkdownTable, stringifyMarkdownTable } from './markdown';
import { tableToValue, valueToTable } from './table';

export type FormatId = 'json' | 'yaml' | 'xml' | 'csv' | 'markdown';

export const FORMATS: { id: FormatId; label: string; /** Prism grammar used for highlighting. */ prism: string }[] = [
  { id: 'json', label: 'JSON', prism: 'json' },
  { id: 'yaml', label: 'YAML', prism: 'yaml' },
  { id: 'xml', label: 'XML', prism: 'markup' },
  { id: 'csv', label: 'CSV', prism: 'csv' },
  { id: 'markdown', label: 'Markdown table', prism: 'markdown' },
];

export interface ConvertOptions {
  indent: number;
  delimiter: string;
  detectTypes: boolean;
}

const XML_OPTIONS = { ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text' };

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function sanitizeXmlName(key: string): string {
  if (key === '#text') return key;
  const prefix = key.startsWith('@_') ? '@_' : '';
  const name = key.slice(prefix.length).replace(/[^\w.-]/g, '_');
  return prefix + (/^[A-Za-z_]/.test(name) ? name : `_${name}`);
}

function sanitizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeKeys);
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [sanitizeXmlName(k), sanitizeKeys(v)]));
  }
  return value;
}

function toXmlDocument(value: unknown): unknown {
  const single = isPlainObject(value) && Object.keys(value).length === 1 && !Array.isArray(Object.values(value)[0]);
  if (single) return value;
  return { root: Array.isArray(value) ? { item: value } : value };
}

export function parseInput(format: FormatId, text: string, options: ConvertOptions): unknown {
  switch (format) {
    case 'json':
      return JSON.parse(text);
    case 'yaml':
      return parseYaml(text);
    case 'xml': {
      const parser = new XMLParser({
        ...XML_OPTIONS,
        ignoreDeclaration: true,
        parseAttributeValue: true,
        numberParseOptions: { hex: false, leadingZeros: false },
      });
      return parser.parse(text, true);
    }
    case 'csv':
      return tableToValue(parseCsv(text, options.delimiter), options.detectTypes);
    case 'markdown':
      return tableToValue(parseMarkdownTable(text), options.detectTypes);
  }
}

export function stringifyOutput(format: FormatId, value: unknown, options: ConvertOptions): string {
  switch (format) {
    case 'json':
      return JSON.stringify(value, null, options.indent);
    case 'yaml':
      return stringifyYaml(value, { indent: options.indent }).trimEnd();
    case 'xml': {
      const builder = new XMLBuilder({
        ...XML_OPTIONS,
        format: true,
        indentBy: ' '.repeat(options.indent),
        suppressEmptyNode: true,
      });
      return String(builder.build(sanitizeKeys(toXmlDocument(value)))).trim();
    }
    case 'csv':
      return stringifyCsv(valueToTable(value), options.delimiter);
    case 'markdown':
      return stringifyMarkdownTable(valueToTable(value));
  }
}

export function convert(from: FormatId, to: FormatId, text: string, options: ConvertOptions): string {
  if (!text.trim()) return '';
  return stringifyOutput(to, parseInput(from, text, options), options);
}
