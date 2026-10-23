const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface Field {
  values: Set<number>;
  wildcard: boolean;
}

interface Schedule {
  minute: Field;
  hour: Field;
  dayOfMonth: Field;
  month: Field;
  dayOfWeek: Field;
}

function parseField(raw: string, min: number, max: number, names?: string[], nameOffset = 0): Field {
  const values = new Set<number>();
  const toNumber = (token: string) => {
    const idx = names?.indexOf(token.toUpperCase()) ?? -1;
    const n = idx >= 0 ? idx + nameOffset : Number(token);
    if (!Number.isInteger(n)) throw new Error(`Invalid value "${token}"`);
    return n;
  };

  for (const part of raw.split(',')) {
    const [range, stepText] = part.split('/');
    const step = stepText === undefined ? 1 : Number(stepText);
    if (!Number.isInteger(step) || step < 1) throw new Error(`Invalid step in "${part}"`);

    let from: number;
    let to: number;
    if (range === '*' || range === '?') {
      from = min;
      to = max;
    } else if (range.includes('-')) {
      const [a, b] = range.split('-');
      from = toNumber(a);
      to = toNumber(b);
    } else {
      from = toNumber(range);
      to = stepText === undefined ? from : max;
    }
    if (from < min || to > max || from > to) throw new Error(`"${part}" is out of range (${min}-${max})`);
    for (let v = from; v <= to; v += step) values.add(v);
  }
  return { values, wildcard: raw === '*' || raw === '?' };
}

function parseSchedule(expression: string): Schedule {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error('Next run times need a standard 5-field expression.');
  const dayOfWeek = parseField(parts[4], 0, 7, DAYS);
  if (dayOfWeek.values.has(7)) dayOfWeek.values.add(0);
  return {
    minute: parseField(parts[0], 0, 59),
    hour: parseField(parts[1], 0, 23),
    dayOfMonth: parseField(parts[2], 1, 31),
    month: parseField(parts[3], 1, 12, MONTHS, 1),
    dayOfWeek,
  };
}

// Like classic cron: when both day fields are restricted, a day matches if either one does.
function dayMatches(s: Schedule, dom: number, dow: number) {
  const domOk = s.dayOfMonth.values.has(dom);
  const dowOk = s.dayOfWeek.values.has(dow);
  if (s.dayOfMonth.wildcard || s.dayOfWeek.wildcard) return domOk && dowOk;
  return domOk || dowOk;
}

export function nextRuns(expression: string, count: number, from: Date, utc: boolean): Date[] {
  const s = parseSchedule(expression);
  const get = {
    year: () => (utc ? cursor.getUTCFullYear() : cursor.getFullYear()),
    month: () => (utc ? cursor.getUTCMonth() : cursor.getMonth()) + 1,
    day: () => (utc ? cursor.getUTCDate() : cursor.getDate()),
    dow: () => (utc ? cursor.getUTCDay() : cursor.getDay()),
    hour: () => (utc ? cursor.getUTCHours() : cursor.getHours()),
    minute: () => (utc ? cursor.getUTCMinutes() : cursor.getMinutes()),
  };
  const make = (y: number, mo: number, d: number, h: number, mi: number) =>
    utc ? new Date(Date.UTC(y, mo - 1, d, h, mi)) : new Date(y, mo - 1, d, h, mi);

  let cursor = new Date(from.getTime());
  cursor.setSeconds(0, 0);
  cursor = new Date(cursor.getTime() + 60_000);

  const results: Date[] = [];
  const limit = from.getTime() + 8 * 366 * 86_400_000;
  while (results.length < count && cursor.getTime() < limit) {
    const y = get.year();
    const mo = get.month();
    const d = get.day();
    const h = get.hour();
    if (!s.month.values.has(mo)) {
      cursor = make(y, mo + 1, 1, 0, 0);
    } else if (!dayMatches(s, d, get.dow())) {
      cursor = make(y, mo, d + 1, 0, 0);
    } else if (!s.hour.values.has(h)) {
      cursor = make(y, mo, d, h + 1, 0);
    } else if (!s.minute.values.has(get.minute())) {
      cursor = new Date(cursor.getTime() + 60_000);
    } else {
      results.push(cursor);
      cursor = new Date(cursor.getTime() + 60_000);
    }
  }
  return results;
}

export const PRESETS: { label: string; value: string }[] = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Weekdays at 9:00', value: '0 9 * * 1-5' },
  { label: 'Monthly (1st, 00:00)', value: '0 0 1 * *' },
];
