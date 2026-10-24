// ---------- IPv4 ----------

export interface Ipv4Result {
  family: 4;
  address: string;
  prefix: number;
  mask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  total: number;
  usable: number;
  ipClass: string;
  kind: string;
  addressBinary: string;
  maskBinary: string;
}

export interface Ipv6Result {
  family: 6;
  address: string;
  expanded: string;
  prefix: number;
  network: string;
  firstAddress: string;
  lastAddress: string;
  total: string;
}

export type CidrResult = Ipv4Result | Ipv6Result;

export function parseIPv4(text: string): number | null {
  const parts = text.trim().split('.');
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || Number(part) > 255) return null;
    value = value * 256 + Number(part);
  }
  return value;
}

export const formatIPv4 = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');

export const maskFromPrefix = (prefix: number) => (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0);

function prefixFromMask(mask: number): number | null {
  const bits = mask.toString(2).padStart(32, '0');
  return /^1*0*$/.test(bits) ? bits.indexOf('0') === -1 ? 32 : bits.indexOf('0') : null;
}

const binary = (n: number) => (n >>> 0).toString(2).padStart(32, '0').replace(/(.{8})(?=.)/g, '$1.');

function classify(ip: number): { ipClass: string; kind: string } {
  const first = ip >>> 24;
  const ipClass = first < 128 ? 'A' : first < 192 ? 'B' : first < 224 ? 'C' : first < 240 ? 'D (multicast)' : 'E (reserved)';
  const inRange = (base: string, prefix: number) => ((ip & maskFromPrefix(prefix)) >>> 0) === parseIPv4(base);
  let kind = 'Public';
  if (inRange('10.0.0.0', 8) || inRange('172.16.0.0', 12) || inRange('192.168.0.0', 16)) kind = 'Private';
  else if (inRange('127.0.0.0', 8)) kind = 'Loopback';
  else if (inRange('169.254.0.0', 16)) kind = 'Link-local';
  else if (inRange('100.64.0.0', 10)) kind = 'Carrier-grade NAT';
  else if (inRange('224.0.0.0', 4)) kind = 'Multicast';
  else if (inRange('240.0.0.0', 4)) kind = 'Reserved';
  else if (ip === 0 || inRange('0.0.0.0', 8)) kind = 'This network';
  return { ipClass, kind };
}

export function calculateIPv4(address: number, prefix: number): Ipv4Result {
  const mask = maskFromPrefix(prefix);
  const network = (address & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;
  const total = 2 ** (32 - prefix);
  const pointToPoint = prefix >= 31;
  return {
    family: 4,
    address: formatIPv4(address),
    prefix,
    mask: formatIPv4(mask),
    wildcard: formatIPv4(~mask >>> 0),
    network: formatIPv4(network),
    broadcast: formatIPv4(broadcast),
    firstHost: formatIPv4(pointToPoint ? network : network + 1),
    lastHost: formatIPv4(pointToPoint ? broadcast : broadcast - 1),
    total,
    usable: prefix === 32 ? 1 : prefix === 31 ? 2 : total - 2,
    ...classify(address),
    addressBinary: binary(address),
    maskBinary: binary(mask),
  };
}

export interface Subnet {
  cidr: string;
  firstHost: string;
  lastHost: string;
  broadcast: string;
  usable: number;
}

export function splitSubnets(result: Ipv4Result, newPrefix: number): Subnet[] {
  const base = parseIPv4(result.network)!;
  const size = 2 ** (32 - newPrefix);
  const count = 2 ** (newPrefix - result.prefix);
  return Array.from({ length: count }, (_, i) => {
    const r = calculateIPv4(base + i * size, newPrefix);
    return { cidr: `${r.network}/${newPrefix}`, firstHost: r.firstHost, lastHost: r.lastHost, broadcast: r.broadcast, usable: r.usable };
  });
}

// ---------- IPv6 ----------

export function parseIPv6(text: string): bigint | null {
  const input = text.trim().toLowerCase();
  if (!/^[0-9a-f:]+$/.test(input) || input.split('::').length > 2) return null;
  const [head, tail] = input.split('::');
  const toGroups = (s: string) => (s ? s.split(':') : []);
  const headGroups = toGroups(head);
  const tailGroups = tail === undefined ? [] : toGroups(tail);
  const missing = 8 - headGroups.length - tailGroups.length;
  if (tail === undefined ? missing !== 0 : missing < 1) return null;
  const groups = [...headGroups, ...Array(tail === undefined ? 0 : missing).fill('0'), ...tailGroups];
  if (groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return groups.reduce((acc, g) => (acc << 16n) | BigInt(parseInt(g, 16)), 0n);
}

const groupsOf = (n: bigint) => Array.from({ length: 8 }, (_, i) => Number((n >> BigInt((7 - i) * 16)) & 0xffffn));

export const expandIPv6 = (n: bigint) => groupsOf(n).map((g) => g.toString(16).padStart(4, '0')).join(':');

export function compressIPv6(n: bigint): string {
  const groups = groupsOf(n).map((g) => g.toString(16));
  let bestStart = -1;
  let bestLen = 0;
  for (let i = 0; i < 8; ) {
    if (groups[i] !== '0') {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && groups[j] === '0') j++;
    if (j - i > bestLen) [bestStart, bestLen] = [i, j - i];
    i = j;
  }
  if (bestLen < 2) return groups.join(':');
  return `${groups.slice(0, bestStart).join(':')}::${groups.slice(bestStart + bestLen).join(':')}`;
}

const ALL_ONES = (1n << 128n) - 1n;

export function calculateIPv6(address: bigint, prefix: number): Ipv6Result {
  const hostBits = BigInt(128 - prefix);
  const hostMask = (1n << hostBits) - 1n;
  const network = address & (ALL_ONES ^ hostMask);
  return {
    family: 6,
    address: compressIPv6(address),
    expanded: expandIPv6(address),
    prefix,
    network: compressIPv6(network),
    firstAddress: compressIPv6(network),
    lastAddress: compressIPv6(network | hostMask),
    total: (1n << hostBits).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','),
  };
}

// ---------- Input ----------

export function calculate(input: string): CidrResult {
  const text = input.trim();
  if (!text) throw new Error('Enter an address such as 192.168.1.10/24');
  const [addressText, suffix] = text.split(/[\s/]+/);

  if (addressText.includes(':')) {
    const address = parseIPv6(addressText);
    if (address === null) throw new Error('Invalid IPv6 address.');
    const prefix = suffix === undefined ? 128 : Number(suffix);
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 128) throw new Error('IPv6 prefix must be between 0 and 128.');
    return calculateIPv6(address, prefix);
  }

  const address = parseIPv4(addressText);
  if (address === null) throw new Error('Invalid IPv4 address.');
  if (suffix === undefined) return calculateIPv4(address, 32);
  if (suffix.includes('.')) {
    const mask = parseIPv4(suffix);
    const prefix = mask === null ? null : prefixFromMask(mask);
    if (prefix === null) throw new Error('Invalid subnet mask.');
    return calculateIPv4(address, prefix);
  }
  const prefix = Number(suffix);
  if (!/^\d+$/.test(suffix) || prefix > 32) throw new Error('IPv4 prefix must be between 0 and 32.');
  return calculateIPv4(address, prefix);
}
