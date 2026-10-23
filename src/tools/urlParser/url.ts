export interface QueryParam {
  id: number;
  key: string;
  value: string;
}

export interface UrlParts {
  protocol: string;
  host: string;
  path: string;
  params: QueryParam[];
  hash: string;
}

const URL_PATTERN = /^(?:([a-z][a-z0-9+.-]*):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/i;

let nextId = 1;
export const newParamId = () => nextId++;

export function parseUrl(raw: string): UrlParts {
  const [, protocol = '', host = '', path = '', query = '', hash = ''] = raw.trim().match(URL_PATTERN) ?? [];
  const params = query
    ? query.split('&').map((pair) => {
        const eq = pair.indexOf('=');
        return {
          id: newParamId(),
          key: eq === -1 ? pair : pair.slice(0, eq),
          value: eq === -1 ? '' : pair.slice(eq + 1),
        };
      })
    : [];
  return { protocol, host, path, params, hash };
}

export function buildUrl({ protocol, host, path, params, hash }: UrlParts): string {
  const query = params.map((p) => (p.value === '' && !p.key ? '' : `${p.key}=${p.value}`)).filter(Boolean).join('&');
  const prefix = host ? `${protocol ? `${protocol}:` : ''}//${host}` : protocol ? `${protocol}:` : '';
  const normalizedPath = host && path && !path.startsWith('/') ? `/${path}` : path;
  return `${prefix}${normalizedPath}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}

// Decoding first keeps the encoders idempotent: already-encoded input is not double-encoded.
const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const encodeComponent = (value: string) => encodeURIComponent(safeDecode(value));

export const encodePath = (path: string) => path.split('/').map(encodeComponent).join('/');

export function encodeHost(host: string): string {
  try {
    return new URL(`http://${host}`).host || host;
  } catch {
    return host;
  }
}

export const decodeComponent = safeDecode;

export function encodeAll(parts: UrlParts): UrlParts {
  return {
    ...parts,
    host: encodeHost(parts.host),
    path: encodePath(parts.path),
    params: parts.params.map((p) => ({ ...p, key: encodeComponent(p.key), value: encodeComponent(p.value) })),
    hash: encodeComponent(parts.hash),
  };
}
