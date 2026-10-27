import { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Button, Paper, TextField, Typography } from '@mui/material';
import CopyIconButton from '../../components/CopyIconButton';
import PageHeader from '../../components/PageHeader';
import { formatInZone, getTimeZones, LOCAL_ZONE, parseInput, relativeTime, zoneLabels } from './timestamp';
import './TimestampPage.css';

export default function TimestampPage() {
  const [input, setInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [zone, setZone] = useState(LOCAL_ZONE);
  const [now, setNow] = useState(Date.now());
  const zones = useMemo(getTimeZones, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const date = parseInput(input);

  // Offsets depend on the date (daylight saving), so label zones for the entered moment, refreshed hourly.
  const referenceHour = Math.floor((date?.getTime() ?? now) / 3_600_000);
  const labels = useMemo(() => zoneLabels(zones, new Date(referenceHour * 3_600_000)), [zones, referenceHour]);

  const rows = date
    ? [
        ['Seconds', String(Math.floor(date.getTime() / 1000))],
        ['Milliseconds', String(date.getTime())],
        ['ISO 8601 (UTC)', date.toISOString()],
        [`In ${zone}`, formatInZone(date, zone)],
        ['UTC', formatInZone(date, 'UTC')],
        ['Relative', relativeTime(date, now)],
      ]
    : [];

  return (
    <>
      <PageHeader
        title="Timestamp Converter"
        description="Convert Unix epoch values (seconds or milliseconds) and date strings between formats and time zones."
      />
      <Paper variant="outlined" className="panel ts-section">
        <div className="ts-now">
          <Typography color="text.secondary">Current epoch</Typography>
          <Typography className="mono-text">{Math.floor(now / 1000)}</Typography>
          <Typography className="mono-text" color="text.secondary">
            {now}
          </Typography>
          <Button size="small" onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}>
            Use now
          </Button>
        </div>
        <div className="toolbar ts-inputs">
          <TextField
            label="Epoch or date"
            helperText="e.g. 1700000000, 1700000000000, 2024-05-01T12:00:00Z"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            error={!!input.trim() && !date}
            className="mono-field ts-input"
            spellCheck={false}
          />
          <Autocomplete
            disableClearable
            options={zones}
            getOptionLabel={(z) => labels[z] ?? z}
            value={zone}
            onChange={(_, value) => setZone(value)}
            renderInput={(params) => <TextField {...params} label="Time zone" />}
            className="ts-zone"
          />
        </div>
        {input.trim() && !date && (
          <Typography color="error">Could not parse that value as an epoch or a date.</Typography>
        )}
      </Paper>

      {rows.length > 0 && (
        <Paper variant="outlined" className="panel">
          {rows.map(([label, value]) => (
            <div key={label} className="ts-row">
              <Typography color="text.secondary" className="ts-label">
                {label}
              </Typography>
              <Typography className="mono-text ts-value">{value}</Typography>
              <CopyIconButton text={value} label={`Copy ${label}`} />
            </div>
          ))}
        </Paper>
      )}
    </>
  );
}
