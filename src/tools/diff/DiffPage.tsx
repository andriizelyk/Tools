import { useMemo, useState } from 'react';
import {
  Alert,
  Chip,
  FormControlLabel,
  Paper,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import { diffLines, toSplitRows, type DiffLine } from './diff';
import './DiffPage.css';

const MARKS = { same: ' ', added: '+', removed: '-' } as const;

type ViewMode = 'split' | 'unified';

function LineText({ line }: { line: DiffLine }) {
  return (
    <span className="diff-text">
      {line.segments
        ? line.segments.map((seg, i) =>
            seg.changed ? (
              <mark key={i} className={`diff-char diff-char-${line.kind}`}>
                {seg.text}
              </mark>
            ) : (
              seg.text
            ),
          )
        : line.text}
    </span>
  );
}

function Cell({ line, side }: { line?: DiffLine; side: 'old' | 'new' }) {
  if (!line) return <div className="diff-line diff-empty" />;
  return (
    <div className={`diff-line diff-${line.kind}`}>
      <span className="diff-no">{side === 'old' ? line.oldNo : line.newNo}</span>
      <span className="diff-mark">{MARKS[line.kind]}</span>
      <LineText line={line} />
    </div>
  );
}

export default function DiffPage() {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [wrap, setWrap] = useState(true);
  const [view, setView] = useState<ViewMode>('split');
  const narrow = useMediaQuery('(max-width: 56rem)');
  const split = view === 'split' && !narrow;

  const { lines, error } = useMemo<{ lines: DiffLine[]; error: string }>(() => {
    try {
      return { lines: diffLines(original, modified, { ignoreWhitespace, ignoreCase }), error: '' };
    } catch (e) {
      return { lines: [], error: e instanceof Error ? e.message : String(e) };
    }
  }, [original, modified, ignoreWhitespace, ignoreCase]);

  const added = lines.filter((l) => l.kind === 'added').length;
  const removed = lines.filter((l) => l.kind === 'removed').length;

  return (
    <>
      <PageHeader title="Text Diff" description="Compare two texts line by line and see what was added or removed." />
      <Paper variant="outlined" className="panel diff-section">
        <div className="diff-panes">
          <TextField
            multiline
            fullWidth
            rows={8}
            label="Original"
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            className="mono-field diff-input"
            spellCheck={false}
          />
          <TextField
            multiline
            fullWidth
            rows={8}
            label="Modified"
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            className="mono-field diff-input"
            spellCheck={false}
          />
        </div>
        <div className="toolbar diff-options">
          <FormControlLabel
            control={<Switch checked={ignoreWhitespace} onChange={(_, v) => setIgnoreWhitespace(v)} />}
            label="Ignore whitespace"
          />
          <FormControlLabel
            control={<Switch checked={ignoreCase} onChange={(_, v) => setIgnoreCase(v)} />}
            label="Ignore case"
          />
          <FormControlLabel
            control={<Switch checked={wrap} onChange={(_, v) => setWrap(v)} />}
            label="Wrap lines"
          />
          {!narrow && (
            <ToggleButtonGroup
              exclusive
              size="small"
              color="primary"
              value={view}
              onChange={(_, v: ViewMode | null) => v && setView(v)}
            >
              <ToggleButton value="split">Side by side</ToggleButton>
              <ToggleButton value="unified">Unified</ToggleButton>
            </ToggleButtonGroup>
          )}
          <span className="toolbar-spacer" />
          <Chip color="success" variant="outlined" label={`+${added}`} />
          <Chip color="error" variant="outlined" label={`-${removed}`} />
        </div>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      {lines.length > 0 && (
        <Paper variant="outlined" className={`diff-result ${wrap ? 'diff-wrap' : 'diff-nowrap'}`}>
          {split
            ? toSplitRows(lines).map((row, i) => (
                <div key={i} className="diff-split-row">
                  <Cell line={row.left} side="old" />
                  <Cell line={row.right} side="new" />
                </div>
              ))
            : lines.map((line, i) => (
                <div key={i} className={`diff-line diff-${line.kind}`}>
                  <span className="diff-no">{line.oldNo ?? ''}</span>
                  <span className="diff-no">{line.newNo ?? ''}</span>
                  <span className="diff-mark">{MARKS[line.kind]}</span>
                  <LineText line={line} />
                </div>
              ))}
        </Paper>
      )}
    </>
  );
}
