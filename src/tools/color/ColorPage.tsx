import { useState } from 'react';
import { Chip, Paper, TextField, Typography } from '@mui/material';
import CopyIconButton from '../../components/CopyIconButton';
import PageHeader from '../../components/PageHeader';
import {
  contrastRatio,
  formatHsl,
  formatRgb,
  palettes,
  parseColor,
  readableTextOn,
  rgbToHex,
  type Rgb,
} from './color';
import './ColorPage.css';

function Swatch({ hex, label }: { hex: string; label: string }) {
  const rgb = parseColor(hex)!;
  return (
    <button
      type="button"
      className="color-swatch"
      style={{ background: hex, color: readableTextOn(rgb) }}
      onClick={() => navigator.clipboard?.writeText(hex).catch(() => undefined)}
      title="Click to copy"
    >
      <span>{label}</span>
      <span className="mono-text">{hex}</span>
    </button>
  );
}

function ContrastBadge({ label, pass }: { label: string; pass: boolean }) {
  return <Chip size="small" color={pass ? 'success' : 'error'} variant="outlined" label={`${label} ${pass ? 'pass' : 'fail'}`} />;
}

export default function ColorPage() {
  const [input, setInput] = useState('#6c7bff');
  const [fgInput, setFgInput] = useState('#ffffff');
  const [bgInput, setBgInput] = useState('#6c7bff');

  const rgb = parseColor(input);
  const fg = parseColor(fgInput);
  const bg = parseColor(bgInput);
  const ratio = fg && bg ? contrastRatio(fg, bg) : null;

  const values = (c: Rgb) => [
    ['HEX', rgbToHex(c)],
    ['RGB', formatRgb(c)],
    ['HSL', formatHsl(c)],
  ];

  return (
    <>
      <PageHeader
        title="Color Tools"
        description="Convert between HEX, RGB and HSL, check WCAG contrast and generate palettes."
      />

      <Paper variant="outlined" className="panel color-section">
        <Typography variant="h6" gutterBottom>
          Converter
        </Typography>
        <div className="color-converter">
          <input
            type="color"
            aria-label="Pick a color"
            className="color-picker"
            value={rgb ? rgbToHex(rgb) : '#000000'}
            onChange={(e) => setInput(e.target.value)}
          />
          <TextField
            label="HEX, rgb() or hsl()"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            error={!!input.trim() && !rgb}
            helperText={input.trim() && !rgb ? 'Unrecognised color' : ' '}
            className="mono-field color-input"
            spellCheck={false}
          />
        </div>
        {rgb &&
          values(rgb).map(([label, value]) => (
            <div key={label} className="color-row">
              <Typography color="text.secondary" className="color-label">
                {label}
              </Typography>
              <Typography className="mono-text color-value">{value}</Typography>
              <CopyIconButton text={value} label={`Copy ${label}`} />
            </div>
          ))}
      </Paper>

      <Paper variant="outlined" className="panel color-section">
        <Typography variant="h6" gutterBottom>
          Contrast checker
        </Typography>
        <div className="color-converter">
          <TextField
            label="Foreground"
            value={fgInput}
            onChange={(e) => setFgInput(e.target.value)}
            error={!!fgInput.trim() && !fg}
            className="mono-field color-input"
            spellCheck={false}
          />
          <TextField
            label="Background"
            value={bgInput}
            onChange={(e) => setBgInput(e.target.value)}
            error={!!bgInput.trim() && !bg}
            className="mono-field color-input"
            spellCheck={false}
          />
        </div>
        {fg && bg && ratio !== null && (
          <>
            <div className="contrast-preview" style={{ color: rgbToHex(fg), background: rgbToHex(bg) }}>
              <span className="contrast-large">Sample heading</span>
              <span>The quick brown fox jumps over the lazy dog.</span>
            </div>
            <div className="contrast-results">
              <Typography variant="h5">{ratio.toFixed(2)} : 1</Typography>
              <ContrastBadge label="AA text" pass={ratio >= 4.5} />
              <ContrastBadge label="AA large" pass={ratio >= 3} />
              <ContrastBadge label="AAA text" pass={ratio >= 7} />
              <ContrastBadge label="AAA large" pass={ratio >= 4.5} />
            </div>
          </>
        )}
      </Paper>

      {rgb && (
        <Paper variant="outlined" className="panel">
          <Typography variant="h6" gutterBottom>
            Palettes
          </Typography>
          {palettes(rgb).map((group) => (
            <div key={group.title} className="palette-group">
              <Typography variant="subtitle2" color="text.secondary">
                {group.title}
              </Typography>
              <div className="palette-swatches">
                {group.swatches.map((s) => (
                  <Swatch key={s.label} {...s} />
                ))}
              </div>
            </div>
          ))}
        </Paper>
      )}
    </>
  );
}
