import { useState } from 'react';
import {
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CopyButton from '../../components/CopyButton';
import PageHeader from '../../components/PageHeader';
import { generateUuids, type UuidOptions, type UuidVersion } from './uuid';
import './UuidPage.css';

const COUNTS = [1, 5, 10, 25, 50, 100];

export default function UuidPage() {
  const [options, setOptions] = useState<UuidOptions>({
    version: 'v4',
    count: 5,
    uppercase: false,
    hyphens: true,
    braces: false,
  });
  const [ids, setIds] = useState(() => generateUuids(options));

  // Every option change regenerates so the output always matches the selected format.
  const change = (patch: Partial<UuidOptions>) => {
    const next = { ...options, ...patch };
    setOptions(next);
    setIds(generateUuids(next));
  };

  const text = ids.join('\n');

  return (
    <>
      <PageHeader
        title="UUID / GUID Generator"
        description="Generate random (v4) or time-ordered (v7) identifiers using the browser's secure random source."
      />
      <Paper variant="outlined" className="panel">
        <div className="toolbar">
          <ToggleButtonGroup
            exclusive
            size="small"
            color="primary"
            value={options.version}
            onChange={(_, value: UuidVersion | null) => value && change({ version: value })}
          >
            <ToggleButton value="v4">Version 4</ToggleButton>
            <ToggleButton value="v7">Version 7</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            select
            size="small"
            label="Count"
            value={options.count}
            onChange={(e) => change({ count: Number(e.target.value) })}
            className="uuid-count"
          >
            {COUNTS.map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={<Switch checked={options.uppercase} onChange={(_, v) => change({ uppercase: v })} />}
            label="Uppercase"
          />
          <FormControlLabel
            control={<Switch checked={options.hyphens} onChange={(_, v) => change({ hyphens: v })} />}
            label="Hyphens"
          />
          <FormControlLabel
            control={<Switch checked={options.braces} onChange={(_, v) => change({ braces: v })} />}
            label="Braces"
          />
        </div>
        <div className="toolbar">
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => setIds(generateUuids(options))}>
            Generate
          </Button>
          <CopyButton text={text} label="Copy all" />
        </div>
        <TextField
          multiline
          fullWidth
          minRows={6}
          value={text}
          className="mono-field"
          slotProps={{ input: { readOnly: true } }}
        />
      </Paper>
    </>
  );
}
