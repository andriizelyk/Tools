import { useMemo, useState } from 'react';
import { Alert, Chip, Paper, TextField, Typography } from '@mui/material';
import CopyButton from '../../components/CopyButton';
import PageHeader from '../../components/PageHeader';
import { decodeJwt, TIME_CLAIMS } from './jwt';
import './JwtPage.css';

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

export default function JwtPage() {
  const [token, setToken] = useState('');

  const { decoded, error } = useMemo(() => {
    if (!token.trim()) return { decoded: null, error: '' };
    try {
      return { decoded: decodeJwt(token), error: '' };
    } catch (e) {
      return { decoded: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [token]);

  const payload = decoded?.payload as Record<string, unknown> | undefined;
  const claims = payload
    ? Object.entries(TIME_CLAIMS).filter(([key]) => typeof payload[key] === 'number')
    : [];
  const now = Date.now();
  const exp = typeof payload?.exp === 'number' ? payload.exp * 1000 : null;

  return (
    <>
      <PageHeader
        title="JWT Decoder"
        description="Decode a JSON Web Token in your browser. Nothing is sent anywhere, and the signature is not verified."
      />
      <Paper variant="outlined" className="panel jwt-section">
        <TextField
          multiline
          fullWidth
          rows={5}
          label="Encoded token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="mono-field"
          spellCheck={false}
        />
        {error && (
          <Alert severity="error" className="jwt-alert">
            {error}
          </Alert>
        )}
      </Paper>

      {decoded && (
        <>
          {exp !== null && (
            <Chip
              color={exp < now ? 'error' : 'success'}
              label={exp < now ? 'Expired' : 'Not expired'}
              className="jwt-status"
            />
          )}
          <div className="jwt-panes">
            <Paper variant="outlined" className="panel">
              <div className="toolbar">
                <Typography variant="h6">Header</Typography>
                <span className="toolbar-spacer" />
                <CopyButton text={pretty(decoded.header)} size="small" />
              </div>
              <pre className="jwt-json">{pretty(decoded.header)}</pre>
            </Paper>
            <Paper variant="outlined" className="panel">
              <div className="toolbar">
                <Typography variant="h6">Payload</Typography>
                <span className="toolbar-spacer" />
                <CopyButton text={pretty(decoded.payload)} size="small" />
              </div>
              <pre className="jwt-json">{pretty(decoded.payload)}</pre>
            </Paper>
          </div>

          {claims.length > 0 && (
            <Paper variant="outlined" className="panel jwt-section">
              <Typography variant="h6" gutterBottom>
                Time claims
              </Typography>
              {claims.map(([key, label]) => {
                const date = new Date((payload![key] as number) * 1000);
                return (
                  <div key={key} className="jwt-claim">
                    <Typography color="text.secondary" className="jwt-claim-label">
                      {label} ({key})
                    </Typography>
                    <Typography className="mono-text">
                      {date.toISOString()} · {date.toLocaleString()}
                    </Typography>
                  </div>
                );
              })}
            </Paper>
          )}

          <Paper variant="outlined" className="panel jwt-section">
            <div className="toolbar">
              <Typography variant="h6">Signature</Typography>
              <span className="toolbar-spacer" />
              <CopyButton text={decoded.signature} size="small" />
            </div>
            <Typography className="mono-text jwt-signature">{decoded.signature || '(empty)'}</Typography>
          </Paper>
        </>
      )}
    </>
  );
}
