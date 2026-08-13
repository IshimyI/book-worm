const rtf = new Intl.RelativeTimeFormat('ru-RU', { numeric: 'auto' });
const absoluteFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

const UNITS = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
];

// "2 часа назад" style — falls back to an absolute date once it's old
// enough that "N months ago" stops being useful information.
export function relativeTime(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const diffSeconds = (date.getTime() - Date.now()) / 1000;
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) return 'только что';

  for (const [unit, secondsInUnit] of UNITS) {
    if (absSeconds >= secondsInUnit) {
      if (unit === 'month' && absSeconds >= UNITS[0][1] * 2) break;
      const value = Math.round(diffSeconds / secondsInUnit);
      return rtf.format(value, unit);
    }
  }

  return absoluteFormatter.format(date);
}
