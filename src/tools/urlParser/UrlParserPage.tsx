import { useState } from 'react';
import { Button, IconButton, InputAdornment, Paper, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CopyButton from '../../components/CopyButton';
import PageHeader from '../../components/PageHeader';
import {
  buildUrl,
  decodeComponent,
  encodeAll,
  encodeComponent,
  encodeHost,
  encodePath,
  newParamId,
  parseUrl,
  type UrlParts,
} from './url';
import './UrlParserPage.css';

const EXAMPLE = 'https://example.com:8080/api/v1/search items?q=hello world&lang=en&tag=a/b#results';

interface EncodeAdornmentProps {
  label: string;
  onEncode: () => void;
  onDecode: () => void;
}

function EncodeAdornment({ label, onEncode, onDecode }: EncodeAdornmentProps) {
  return (
    <InputAdornment position="end">
      <Tooltip title={`URL-encode ${label}`}>
        <IconButton size="small" onClick={onEncode} aria-label={`Encode ${label}`}>
          <LockIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={`Decode ${label}`}>
        <IconButton size="small" onClick={onDecode} aria-label={`Decode ${label}`}>
          <LockOpenIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </InputAdornment>
  );
}

export default function UrlParserPage() {
  const [raw, setRaw] = useState(EXAMPLE);
  const [parts, setParts] = useState<UrlParts>(() => parseUrl(EXAMPLE));

  const update = (patch: Partial<UrlParts>) => setParts((p) => ({ ...p, ...patch }));

  const updateParam = (id: number, patch: { key?: string; value?: string }) =>
    setParts((p) => ({ ...p, params: p.params.map((q) => (q.id === id ? { ...q, ...patch } : q)) }));

  const result = buildUrl(parts);

  return (
    <>
      <PageHeader
        title="URL Parser"
        description="Paste a URL to split it into parts. Edit and encode each part separately or all at once, then copy the result."
      />

      <Paper variant="outlined" className="panel url-section">
        <TextField
          fullWidth
          label="Original URL"
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            setParts(parseUrl(e.target.value));
          }}
          className="mono-field"
          spellCheck={false}
        />
      </Paper>

      <Paper variant="outlined" className="panel url-section">
        <Typography variant="h6" gutterBottom>
          Parts
        </Typography>
        <div className="url-row url-row-top">
          <TextField
            label="Protocol"
            value={parts.protocol}
            onChange={(e) => update({ protocol: e.target.value })}
            className="mono-field url-protocol"
          />
          <TextField
            label="Host"
            value={parts.host}
            onChange={(e) => update({ host: e.target.value })}
            className="mono-field url-grow"
            slotProps={{
              input: {
                endAdornment: (
                  <EncodeAdornment
                    label="host"
                    onEncode={() => update({ host: encodeHost(parts.host) })}
                    onDecode={() => update({ host: decodeComponent(parts.host) })}
                  />
                ),
              },
            }}
          />
        </div>
        <TextField
          fullWidth
          label="Path"
          value={parts.path}
          onChange={(e) => update({ path: e.target.value })}
          className="mono-field url-field"
          slotProps={{
            input: {
              endAdornment: (
                <EncodeAdornment
                  label="path"
                  onEncode={() => update({ path: encodePath(parts.path) })}
                  onDecode={() => update({ path: decodeComponent(parts.path) })}
                />
              ),
            },
          }}
        />

        <Typography variant="subtitle1" className="url-subtitle">
          Query parameters
        </Typography>
        {parts.params.length === 0 && (
          <Typography variant="body2" color="text.secondary" className="url-field">
            No query parameters.
          </Typography>
        )}
        {parts.params.map((param) => (
          <div key={param.id} className="url-row">
            <TextField
              label="Key"
              size="small"
              value={param.key}
              onChange={(e) => updateParam(param.id, { key: e.target.value })}
              className="mono-field url-grow"
              slotProps={{
                input: {
                  endAdornment: (
                    <EncodeAdornment
                      label="key"
                      onEncode={() => updateParam(param.id, { key: encodeComponent(param.key) })}
                      onDecode={() => updateParam(param.id, { key: decodeComponent(param.key) })}
                    />
                  ),
                },
              }}
            />
            <TextField
              label="Value"
              size="small"
              value={param.value}
              onChange={(e) => updateParam(param.id, { value: e.target.value })}
              className="mono-field url-grow"
              slotProps={{
                input: {
                  endAdornment: (
                    <EncodeAdornment
                      label="value"
                      onEncode={() => updateParam(param.id, { value: encodeComponent(param.value) })}
                      onDecode={() => updateParam(param.id, { value: decodeComponent(param.value) })}
                    />
                  ),
                },
              }}
            />
            <IconButton
              aria-label="Remove parameter"
              onClick={() => setParts((p) => ({ ...p, params: p.params.filter((q) => q.id !== param.id) }))}
            >
              <DeleteOutlineIcon />
            </IconButton>
          </div>
        ))}
        <Button
          startIcon={<AddIcon />}
          onClick={() => setParts((p) => ({ ...p, params: [...p.params, { id: newParamId(), key: '', value: '' }] }))}
        >
          Add parameter
        </Button>

        <TextField
          fullWidth
          label="Fragment (hash)"
          value={parts.hash}
          onChange={(e) => update({ hash: e.target.value })}
          className="mono-field url-field url-hash"
          slotProps={{
            input: {
              endAdornment: (
                <EncodeAdornment
                  label="fragment"
                  onEncode={() => update({ hash: encodeComponent(parts.hash) })}
                  onDecode={() => update({ hash: decodeComponent(parts.hash) })}
                />
              ),
            },
          }}
        />
      </Paper>

      <Paper variant="outlined" className="panel url-section">
        <div className="toolbar">
          <Typography variant="h6">Result</Typography>
          <span className="toolbar-spacer" />
          <Button variant="contained" onClick={() => setParts(encodeAll(parts))}>
            Encode all
          </Button>
          <CopyButton text={result} label="Copy URL" />
        </div>
        <TextField
          fullWidth
          multiline
          value={result}
          className="mono-field"
          slotProps={{ input: { readOnly: true } }}
        />
      </Paper>
    </>
  );
}
