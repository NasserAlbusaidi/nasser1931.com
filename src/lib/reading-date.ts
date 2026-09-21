// StoryGraph permits year-only and month-only read dates. Preserve that precision.
export function formatReadingDate(value: string): string {
  if (/^\d{4}$/.test(value)) return value;
  const monthOnly = /^\d{4}-\d{2}$/.test(value);
  const parsed = new Date(`${monthOnly ? `${value}-01` : value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    ...(monthOnly ? {} : { day: 'numeric' as const }),
    month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(parsed);
}
