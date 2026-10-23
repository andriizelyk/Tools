import * as prettier from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';
import * as typescriptPlugin from 'prettier/plugins/typescript';
import * as yamlPlugin from 'prettier/plugins/yaml';
import { formatCSharp } from './csharp';
import { formatXml } from './xml';

export type LanguageId = 'json' | 'yaml' | 'xml' | 'csharp' | 'javascript' | 'typescript';

export interface Language {
  id: LanguageId;
  label: string;
  format: (source: string, indentSize: number) => Promise<string> | string;
}

const plugins = [babelPlugin, estreePlugin, typescriptPlugin, yamlPlugin];

const withPrettier =
  (parser: string) =>
  (source: string, indentSize: number) =>
    prettier.format(source, { parser, plugins, tabWidth: indentSize });

export const languages: Language[] = [
  { id: 'json', label: 'JSON', format: withPrettier('json') },
  { id: 'yaml', label: 'YAML / YML', format: withPrettier('yaml') },
  { id: 'xml', label: 'XML', format: formatXml },
  { id: 'csharp', label: 'C#', format: formatCSharp },
  { id: 'javascript', label: 'JavaScript', format: withPrettier('babel') },
  { id: 'typescript', label: 'TypeScript', format: withPrettier('typescript') },
];

export function minifyJson(source: string): string {
  return JSON.stringify(JSON.parse(source));
}
