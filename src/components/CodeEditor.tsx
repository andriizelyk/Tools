import EditorModule from 'react-simple-code-editor';
import Prism from './prismGlobal';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import './CodeEditor.css';

// The package is CommonJS; depending on the bundler the default import is the module object itself.
const Editor = ((EditorModule as unknown as { default?: typeof EditorModule }).default ?? EditorModule) as typeof EditorModule;

// Highlighting every keystroke of a huge document would freeze typing, so fall back to plain text.
const MAX_HIGHLIGHT_LENGTH = 300_000;

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface Props {
  label: string;
  value: string;
  /** A Prism grammar name: json, yaml, markup, csharp, javascript or typescript. */
  language: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export default function CodeEditor({ label, value, language, onChange, readOnly }: Props) {
  const grammar = Prism.languages[language];

  const highlight = (code: string) =>
    grammar && code.length <= MAX_HIGHLIGHT_LENGTH ? Prism.highlight(code, grammar, language) : escapeHtml(code);

  return (
    <div className="code-editor-field">
      <span className="code-editor-label">{label}</span>
      <div className="code-editor-scroll">
        <Editor
          value={value}
          onValueChange={onChange ?? (() => undefined)}
          highlight={highlight}
          padding="1rem"
          readOnly={readOnly}
          className="code-editor"
          textareaClassName="code-editor-textarea"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
