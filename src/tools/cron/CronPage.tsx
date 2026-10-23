import { useMemo, useState } from 'react';
import { Alert, Chip, FormControlLabel, Paper, Switch, TextField, Typography } from '@mui/material';
import cronstrue from 'cronstrue';
import CopyIconButton from '../../components/CopyIconButton';
import PageHeader from '../../components/PageHeader';
import { nextRuns, PRESETS } from './cron';
import './CronPage.css';

const FIELD_LABELS = ['Minute', 'Hour', 'Day of month', 'Month', 'Day of week'];

export default function CronPage() {
  const [expression, setExpression] = useState('*/15 9-17 * * 1-5');
  const [utc, setUtc] = useState(false);

  const result = useMemo(() => {
    const text = expression.trim();
    if (!text) return { description: '', runs: [], error: '', runsError: '' };
    let description = '';
    let error = '';
    try {
      description = cronstrue.toString(text, { use24HourTimeFormat: true, verbose: true });
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    let runs: Date[] = [];
    let runsError = '';
    if (!error) {
      try {
        runs = nextRuns(text, 10, new Date(), utc);
      } catch (e) {
        runsError = e instanceof Error ? e.message : String(e);
      }
    }
    return { description, runs, error, runsError };
  }, [expression, utc]);

  const fields = expression.trim().split(/\s+/);
  const format = (d: Date) => (utc ? d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : d.toLocaleString());

  return (
    <>
      <PageHeader
        title="Cron Expression Explainer"
        description="Translate a cron expression into plain English and preview when it will run next."
      />
      <Paper variant="outlined" className="panel cron-section">
        <TextField
          fullWidth
          label="Cron expression"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          className="mono-field cron-input"
          spellCheck={false}
          error={!!result.error}
        />
        {!result.error && fields.length === 5 && expression.trim() && (
          <div className="cron-fields">
            {fields.map((value, i) => (
              <div key={FIELD_LABELS[i]} className="cron-field">
                <Typography className="mono-text cron-field-value">{value}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {FIELD_LABELS[i]}
                </Typography>
              </div>
            ))}
          </div>
        )}
        <div className="cron-presets">
          {PRESETS.map((p) => (
            <Chip key={p.value} label={p.label} variant="outlined" onClick={() => setExpression(p.value)} />
          ))}
        </div>
      </Paper>

      {result.error && <Alert severity="error">{result.error}</Alert>}

      {result.description && (
        <Paper variant="outlined" className="panel cron-section">
          <Typography variant="overline" color="text.secondary">
            Meaning
          </Typography>
          <Typography variant="h5">{result.description}</Typography>
        </Paper>
      )}

      {result.description && (
        <Paper variant="outlined" className="panel">
          <div className="toolbar">
            <Typography variant="h6">Next runs</Typography>
            <span className="toolbar-spacer" />
            <FormControlLabel
              control={<Switch checked={utc} onChange={(_, v) => setUtc(v)} />}
              label="UTC"
            />
          </div>
          {result.runsError && <Alert severity="info">{result.runsError}</Alert>}
          {!result.runsError && result.runs.length === 0 && (
            <Typography color="text.secondary">No upcoming runs found in the next few years.</Typography>
          )}
          {result.runs.map((run, i) => (
            <div key={run.getTime()} className="cron-run">
              <Typography color="text.secondary" className="cron-run-index">
                {i + 1}
              </Typography>
              <Typography className="mono-text cron-run-value">{format(run)}</Typography>
              <CopyIconButton text={run.toISOString()} label="Copy ISO time" />
            </div>
          ))}
        </Paper>
      )}
    </>
  );
}
