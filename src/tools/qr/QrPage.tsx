import { useEffect, useState } from 'react';
import { Alert, Button, MenuItem, Paper, Slider, TextField, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import QRCode from 'qrcode';
import PageHeader from '../../components/PageHeader';
import './QrPage.css';

type Level = 'L' | 'M' | 'Q' | 'H';

const LEVELS: { value: Level; label: string }[] = [
  { value: 'L', label: 'Low (7%)' },
  { value: 'M', label: 'Medium (15%)' },
  { value: 'Q', label: 'Quartile (25%)' },
  { value: 'H', label: 'High (30%)' },
];

function download(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}

export default function QrPage() {
  const [text, setText] = useState('https://github.com');
  const [level, setLevel] = useState<Level>('M');
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [dark, setDark] = useState('#000000');
  const [light, setLight] = useState('#ffffff');
  const [png, setPng] = useState('');
  const [error, setError] = useState('');

  const options = { errorCorrectionLevel: level, width: size, margin, color: { dark, light } };

  useEffect(() => {
    if (!text) {
      setPng('');
      setError('');
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(text, options)
      .then((url) => {
        if (!cancelled) {
          setPng(url);
          setError('');
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setPng('');
          setError(e instanceof Error ? e.message : String(e));
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, level, size, margin, dark, light]);

  const downloadSvg = async () => {
    const svg = await QRCode.toString(text, { ...options, type: 'svg' });
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    download(url, 'qrcode.svg');
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="QR Code Generator" description="Turn any text or URL into a QR code and download it as PNG or SVG." />
      <div className="qr-layout">
        <Paper variant="outlined" className="panel">
          <TextField
            multiline
            fullWidth
            minRows={4}
            label="Text or URL"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mono-field qr-field"
            spellCheck={false}
          />
          <TextField
            select
            fullWidth
            label="Error correction"
            value={level}
            onChange={(e) => setLevel(e.target.value as Level)}
            className="qr-field"
          >
            {LEVELS.map((l) => (
              <MenuItem key={l.value} value={l.value}>
                {l.label}
              </MenuItem>
            ))}
          </TextField>
          <Typography gutterBottom>Size: {size} px</Typography>
          <Slider value={size} min={128} max={1024} step={32} onChange={(_, v) => setSize(v)} className="qr-field" />
          <Typography gutterBottom>Margin: {margin} modules</Typography>
          <Slider value={margin} min={0} max={8} step={1} onChange={(_, v) => setMargin(v)} className="qr-field" />
          <div className="qr-colors">
            <label className="qr-color">
              <input type="color" value={dark} onChange={(e) => setDark(e.target.value)} />
              <Typography>Foreground</Typography>
            </label>
            <label className="qr-color">
              <input type="color" value={light} onChange={(e) => setLight(e.target.value)} />
              <Typography>Background</Typography>
            </label>
          </div>
        </Paper>

        <Paper variant="outlined" className="panel qr-preview">
          {error && <Alert severity="error">{error}</Alert>}
          {png ? (
            <>
              <img src={png} alt="Generated QR code" className="qr-image" />
              <div className="toolbar">
                <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => download(png, 'qrcode.png')}>
                  PNG
                </Button>
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadSvg}>
                  SVG
                </Button>
              </div>
            </>
          ) : (
            !error && <Typography color="text.secondary">Enter some text to generate a code.</Typography>
          )}
        </Paper>
      </div>
    </>
  );
}
