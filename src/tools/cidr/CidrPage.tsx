import { useMemo, useState } from 'react';
import {
  Alert,
  Chip,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CopyIconButton from '../../components/CopyIconButton';
import PageHeader from '../../components/PageHeader';
import { calculate, splitSubnets, type Ipv4Result } from './cidr';
import './CidrPage.css';

const EXAMPLES = ['192.168.1.10/24', '10.0.0.0/8', '172.16.5.4 255.255.240.0', '2001:db8::1/64'];

function Row({ label, value }: { label: string; value: string | number }) {
  const text = String(value);
  return (
    <div className="cidr-row">
      <Typography color="text.secondary" className="cidr-label">
        {label}
      </Typography>
      <Typography className="mono-text cidr-value">{text}</Typography>
      <CopyIconButton text={text} label={`Copy ${label}`} />
    </div>
  );
}

function Bits({ binary, prefix }: { binary: string; prefix: number }) {
  // Dots separate octets, so count only digits when finding the network/host boundary.
  let digits = 0;
  return (
    <span className="mono-text cidr-bits">
      {[...binary].map((ch, i) => {
        if (ch === '.') return <span key={i}>.</span>;
        const network = digits++ < prefix;
        return (
          <span key={i} className={network ? 'bit-network' : 'bit-host'}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}

function SubnetSplitter({ result }: { result: Ipv4Result }) {
  const [newPrefix, setNewPrefix] = useState<number | ''>('');
  const options = Array.from({ length: Math.min(8, 32 - result.prefix) }, (_, i) => result.prefix + i + 1);
  const target = options.includes(Number(newPrefix)) ? Number(newPrefix) : options[0];
  const subnets = useMemo(() => (target ? splitSubnets(result, target) : []), [result, target]);

  if (options.length === 0) return null;
  return (
    <Paper variant="outlined" className="panel cidr-section">
      <div className="toolbar">
        <Typography variant="h6">Split into subnets</Typography>
        <TextField select size="small" label="New prefix" value={target} onChange={(e) => setNewPrefix(Number(e.target.value))} className="cidr-prefix">
          {options.map((p) => (
            <MenuItem key={p} value={p}>
              /{p} ({2 ** (p - result.prefix)} subnets)
            </MenuItem>
          ))}
        </TextField>
      </div>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Subnet</TableCell>
              <TableCell>First host</TableCell>
              <TableCell>Last host</TableCell>
              <TableCell>Broadcast</TableCell>
              <TableCell align="right">Usable</TableCell>
            </TableRow>
          </TableHead>
          <TableBody className="mono-text">
            {subnets.map((s) => (
              <TableRow key={s.cidr}>
                <TableCell className="mono-text">{s.cidr}</TableCell>
                <TableCell className="mono-text">{s.firstHost}</TableCell>
                <TableCell className="mono-text">{s.lastHost}</TableCell>
                <TableCell className="mono-text">{s.broadcast}</TableCell>
                <TableCell align="right" className="mono-text">
                  {s.usable.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default function CidrPage() {
  const [input, setInput] = useState('192.168.1.10/24');

  const { result, error } = useMemo(() => {
    try {
      return { result: calculate(input), error: '' };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input]);

  return (
    <>
      <PageHeader
        title="CIDR / IP Calculator"
        description="Work out network ranges, masks and host counts for IPv4 and IPv6 subnets."
      />
      <Paper variant="outlined" className="panel cidr-section">
        <TextField
          fullWidth
          label="IP address with prefix or mask"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          error={!!error}
          helperText={error || 'e.g. 192.168.1.10/24, 10.0.0.1 255.255.0.0 or 2001:db8::/32'}
          className="mono-field"
          spellCheck={false}
        />
        <div className="cidr-examples">
          {EXAMPLES.map((e) => (
            <Chip key={e} label={e} variant="outlined" onClick={() => setInput(e)} />
          ))}
        </div>
      </Paper>

      {error && <Alert severity="error" className="cidr-section">{error}</Alert>}

      {result?.family === 4 && (
        <>
          <Paper variant="outlined" className="panel cidr-section">
            <Row label="Network" value={`${result.network}/${result.prefix}`} />
            <Row label="Subnet mask" value={result.mask} />
            <Row label="Wildcard mask" value={result.wildcard} />
            <Row label="Broadcast" value={result.broadcast} />
            <Row label="First host" value={result.firstHost} />
            <Row label="Last host" value={result.lastHost} />
            <Row label="Total addresses" value={result.total.toLocaleString()} />
            <Row label="Usable hosts" value={result.usable.toLocaleString()} />
            <Row label="Class" value={result.ipClass} />
            <Row label="Type" value={result.kind} />
          </Paper>
          <Paper variant="outlined" className="panel cidr-section">
            <Typography variant="h6" gutterBottom>
              Binary
            </Typography>
            <div className="cidr-binary">
              <Typography color="text.secondary" className="cidr-label">
                Address
              </Typography>
              <Bits binary={result.addressBinary} prefix={result.prefix} />
            </div>
            <div className="cidr-binary">
              <Typography color="text.secondary" className="cidr-label">
                Mask
              </Typography>
              <Bits binary={result.maskBinary} prefix={result.prefix} />
            </div>
            <Typography variant="caption" color="text.secondary">
              <span className="bit-network">Network bits</span> · <span className="bit-host">host bits</span>
            </Typography>
          </Paper>
          <SubnetSplitter result={result} />
        </>
      )}

      {result?.family === 6 && (
        <Paper variant="outlined" className="panel cidr-section">
          <Row label="Address" value={result.address} />
          <Row label="Expanded" value={result.expanded} />
          <Row label="Network" value={`${result.network}/${result.prefix}`} />
          <Row label="First address" value={result.firstAddress} />
          <Row label="Last address" value={result.lastAddress} />
          <Row label="Total addresses" value={result.total} />
        </Paper>
      )}
    </>
  );
}
