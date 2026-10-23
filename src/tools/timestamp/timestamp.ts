export const LOCAL_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function getTimeZones(): string[] {
  const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  return Array.from(new Set([LOCAL_ZONE, 'UTC', ...zones]));
}

// Numbers are epoch values (seconds, or milliseconds once they are too large to be seconds);
// anything else is handed to Date.parse.
export function parseInput(raw: string): Date | null {
  const text = raw.trim();
  if (!text) return null;
  const date = /^-?\d+(\.\d+)?$/.test(text)
    ? new Date(Math.abs(Number(text)) >= 1e11 ? Number(text) : Number(text) * 1000)
    : new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatInZone(date: Date, timeZone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'short',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} ${parts.timeZoneName}`;
}

export function relativeTime(date: Date, now = Date.now()): string {
  const seconds = Math.round((date.getTime() - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(seconds, 'second');
}
