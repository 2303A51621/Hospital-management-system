/**
 * Safely converts any Date object, ISO string, timestamp or date-like value
 * into a YYYY-MM-DD string without throwing `.slice is not a function`.
 */
export function toDateString(dateVal: any): string {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') return dateVal.slice(0, 10);
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return dateVal.toISOString().slice(0, 10);
  }
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  } catch {}
  return String(dateVal || '').slice(0, 10);
}

/**
 * Safely formats a date into human-readable string (e.g. 11 Nov 2026)
 */
export function formatDisplayDate(dateVal: any): string {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {}
  return String(dateVal);
}
