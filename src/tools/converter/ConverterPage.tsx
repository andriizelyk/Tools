import { useMemo, useState } from 'react';
import { Alert, FormControlLabel, IconButton, MenuItem, Paper, Switch, TextField, Tooltip } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CodeEditor from '../../components/CodeEditor';
import CopyButton from '../../components/CopyButton';
import PageHeader from '../../components/PageHeader';
import { convert, FORMATS, type ConvertOptions, type FormatId } from './convert';
import './ConverterPage.css';

const DELIMITERS = [
  { value: ',', label: 'Comma' },
  { value: ';', label: 'Semicolon' },
  { value: '\t', label: 'Tab' },
  { value: '|', label: 'Pipe' },
];

const SAMPLE = '[\n  { "name": "Ada", "age": 36, "address": { "city": "London" } },\n  { "name": "Linus", "age": 54, "address": { "city": "Portland" } }\n]';

function FormatSelect({ label, value, onChange }: { label: string; value: FormatId; onChange: (f: FormatId) => void }) {
  return (
    <TextField select size="small" label={label} value={value} onChange={(e) => onChange(e.target.value as FormatId)} className="conv-format">
      {FORMATS.map((f) => (
        <MenuItem key={f.id} value={f.id}>
          {f.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default function ConverterPage() {
  const [from, setFrom] = useState<FormatId>('json');
  const [to, setTo] = useState<FormatId>('yaml');
  const [input, setInput] = useState(SAMPLE);
  const [options, setOptions] = useState<ConvertOptions>({ indent: 2, delimiter: ',', detectTypes: true });

  const { output, error } = useMemo(() => {
    try {
      return { output: convert(from, to, input, options), error: '' };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [from, to, input, options]);

  const fromFormat = FORMATS.find((f) => f.id === from)!;
  const toFormat = FORMATS.find((f) => f.id === to)!;
  const tabular = [from, to].some((f) => f === 'csv' || f === 'markdown');
  const usesCsv = from === 'csv' || to === 'csv';

  const swap = () => {
    setFrom(to);
    setTo(from);
    if (output) setInput(output);
  };

  return (
    <>
      <PageHeader
        title="Data Format Converter"
        description="Convert between JSON, YAML, XML, CSV and Markdown tables in one place."
      />
      <Paper variant="outlined" className="panel">
        <div className="toolbar">
          <FormatSelect label="From" value={from} onChange={setFrom} />
          <Tooltip title="Swap formats and use the output as input">
            <IconButton onClick={swap} aria-label="Swap formats">
              <SwapHorizIcon />
            </IconButton>
          </Tooltip>
          <FormatSelect label="To" value={to} onChange={setTo} />
          <TextField
            select
            size="small"
            label="Indent"
            value={options.indent}
            onChange={(e) => setOptions({ ...options, indent: Number(e.target.value) })}
            className="conv-small"
          >
            {[2, 4].map((n) => (
              <MenuItem key={n} value={n}>
                {n} spaces
              </MenuItem>
            ))}
          </TextField>
          {usesCsv && (
            <TextField
              select
              size="small"
              label="CSV delimiter"
              value={options.delimiter}
              onChange={(e) => setOptions({ ...options, delimiter: e.target.value })}
              className="conv-small"
            >
              {DELIMITERS.map((d) => (
                <MenuItem key={d.label} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </TextField>
          )}
          {tabular && (from === 'csv' || from === 'markdown') && (
            <FormControlLabel
              control={<Switch checked={options.detectTypes} onChange={(_, v) => setOptions({ ...options, detectTypes: v })} />}
              label="Detect numbers & booleans"
            />
          )}
          <span className="toolbar-spacer" />
          <CopyButton text={output} label="Copy output" />
        </div>

        {error && (
          <Alert severity="error" className="conv-error">
            {error}
          </Alert>
        )}
        {tabular && !error && (
          <Alert severity="info" className="conv-error">
            Tables are flat: nested objects become dotted columns (address.city) and arrays are stored as JSON text.
          </Alert>
        )}

        <div className="conv-panes">
          <CodeEditor label={`Input (${fromFormat.label})`} value={input} language={fromFormat.prism} onChange={setInput} />
          <CodeEditor label={`Output (${toFormat.label})`} value={output} language={toFormat.prism} readOnly />
        </div>
      </Paper>
    </>
  );
}
