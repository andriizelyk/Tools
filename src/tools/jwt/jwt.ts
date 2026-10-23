export interface DecodedJwt {
  header: unknown;
  payload: unknown;
  signature: string;
}

function decodeSegment(segment: string): unknown {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().replace(/^Bearer\s+/i, '').split('.');
  if (parts.length !== 3) {
    throw new Error('A JWT must have three dot-separated parts (header.payload.signature).');
  }
  try {
    return { header: decodeSegment(parts[0]), payload: decodeSegment(parts[1]), signature: parts[2] };
  } catch {
    throw new Error('Header or payload is not valid base64url-encoded JSON.');
  }
}

export const TIME_CLAIMS: Record<string, string> = {
  exp: 'Expires',
  iat: 'Issued at',
  nbf: 'Not before',
};
