export type UuidVersion = 'v4' | 'v7';

export interface UuidOptions {
  version: UuidVersion;
  count: number;
  uppercase: boolean;
  hyphens: boolean;
  braces: boolean;
}

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

function uuidV7(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const ms = BigInt(Date.now());
  for (let i = 0; i < 6; i++) bytes[i] = Number((ms >> BigInt(8 * (5 - i))) & 0xffn);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = hex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function generateUuids({ version, count, uppercase, hyphens, braces }: UuidOptions): string[] {
  return Array.from({ length: count }, () => {
    let id = version === 'v4' ? crypto.randomUUID() : uuidV7();
    if (!hyphens) id = id.replace(/-/g, '');
    if (uppercase) id = id.toUpperCase();
    return braces ? `{${id}}` : id;
  });
}
