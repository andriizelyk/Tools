import { useState } from 'react';
import {
  Alert,
  Button,
  MenuItem,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import CompressIcon from '@mui/icons-material/Compress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CopyButton from '../../components/CopyButton';
import PageHeader from '../../components/PageHeader';
import { languages, minifyJson, type LanguageId } from './formatters';
import './FormatterPage.css';

export default function FormatterPage() {
  const [languageId, setLanguageId] = useState<LanguageId>('json');
  const [indentSize, setIndentSize] = useState(2);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const run = async (action: () => Promise<string> | string) => {
    try {
      setOutput(await action());
      setError('');
    } catch (e) {
      setOutput('');
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const language = languages.find((l) => l.id === languageId)!;

  return (
    <>
      <PageHeader
        title="Code Formatter"
        description="Beautify JSON, YAML, XML, C#, JavaScript and TypeScript."
      />
      <Paper variant="outlined" className="panel">
        <div className="toolbar">
          <ToggleButtonGroup
            exclusive
            size="small"
            color="primary"
            value={languageId}
            onChange={(_, value: LanguageId | null) => value && setLanguageId(value)}
          >
            {languages.map((l) => (
              <ToggleButton key={l.id} value={l.id}>
                {l.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <TextField
            select
            size="small"
            label="Indent"
            value={indentSize}
            onChange={(e) => setIndentSize(Number(e.target.value))}
            className="indent-select"
          >
            {[2, 4, 8].map((n) => (
              <MenuItem key={n} value={n}>
                {n} spaces
              </MenuItem>
            ))}
          </TextField>
        </div>

        <div className="toolbar">
          <Button
            variant="contained"
            startIcon={<AutoFixHighIcon />}
            onClick={() => run(() => language.format(input, indentSize))}
            disabled={!input.trim()}
          >
            Format
          </Button>
          {languageId === 'json' && (
            <Button
              variant="outlined"
              startIcon={<CompressIcon />}
              onClick={() => run(() => minifyJson(input))}
              disabled={!input.trim()}
            >
              Minify
            </Button>
          )}
          <Button
            startIcon={<DeleteOutlineIcon />}
            onClick={() => {
              setInput('');
              setOutput('');
              setError('');
            }}
          >
            Clear
          </Button>
          <span className="toolbar-spacer" />
          <Button onClick={() => setInput(output)} disabled={!output}>
            Use output as input
          </Button>
          <CopyButton text={output} label="Copy output" />
        </div>

        {error && (
          <Alert severity="error" className="formatter-error">
            <pre className="formatter-error-text">{error}</pre>
          </Alert>
        )}

        <div className="formatter-panes">
          <TextField
            multiline
            fullWidth
            rows={24}
            label="Input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="mono-field"
            spellCheck={false}
          />
          <TextField
            multiline
            fullWidth
            rows={24}
            label="Output"
            value={output}
            className="mono-field"
            slotProps={{ input: { readOnly: true } }}
          />
        </div>
      </Paper>
    </>
  );
}
