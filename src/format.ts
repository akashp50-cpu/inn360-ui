/**
 * Display formatting used by the design-system components and every INN360 module. Pure, locale en-US.
 * Negative money uses a true minus sign: −$1,234 (credits).
 */

export type NumberFormat = 'usd0' | 'usd2' | 'usd4' | 'pct' | 'pctDelta' | 'int' | 'dec1' | 'cpor';

const MINUS = '−';

export function usd(x: number | null | undefined, decimals = 2): string {
  if (x == null || !Number.isFinite(x)) return '—';
  const s = Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  // avoid "−$0.00"
  const neg = x < 0 && Number(s.replace(/,/g, '')) !== 0;
  return (neg ? MINUS + '$' : '$') + s;
}
export const usd0 = (x: number | null | undefined) => usd(x, 0);
export const usd2 = (x: number | null | undefined) => usd(x, 2);

/** 0.123 → "12.3%" */
export function pct(x: number | null | undefined, decimals = 1): string {
  if (x == null || !Number.isFinite(x)) return '—';
  const s = (Math.abs(x) * 100).toFixed(decimals) + '%';
  return (x < 0 && Number((Math.abs(x) * 100).toFixed(decimals)) !== 0 ? MINUS : '') + s;
}
/** 0.123 → "+12.3%", −0.05 → "−5.0%" */
export function pctDelta(x: number | null | undefined, decimals = 1): string {
  if (x == null || !Number.isFinite(x)) return '—';
  const r = Number((x * 100).toFixed(decimals));
  if (r === 0) return (0).toFixed(decimals) + '%';
  return (r > 0 ? '+' : MINUS) + Math.abs(r).toFixed(decimals) + '%';
}
export function int(x: number | null | undefined): string {
  if (x == null || !Number.isFinite(x)) return '—';
  const s = Math.round(Math.abs(x)).toLocaleString('en-US');
  return (x < 0 && Math.round(x) !== 0 ? MINUS : '') + s;
}

export function formatNumber(x: number | null | undefined, f: NumberFormat): string {
  switch (f) {
    case 'usd0':
      return usd(x, 0);
    case 'usd2':
      return usd(x, 2);
    case 'usd4':
      return usd(x, 4);
    case 'cpor':
      // per occupied room: $0.00 at or above $0.10, 3 decimals below
      return x == null || !Number.isFinite(x) ? '—' : Math.abs(x) >= 0.1 || x === 0 ? usd(x, 2) : usd(x, 3);
    case 'pct':
      return pct(x);
    case 'pctDelta':
      return pctDelta(x);
    case 'dec1':
      return x == null || !Number.isFinite(x) ? '—' : x.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    default:
      return int(x);
  }
}

/** Compact axis label: $12k, $1.2k, $950, $2.40 (when small). */
export function usdAxis(x: number): string {
  const a = Math.abs(x),
    sign = x < 0 ? MINUS : '';
  if (a >= 1e6) return sign + '$' + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M';
  if (a >= 1000) return sign + '$' + (a / 1000).toFixed(a >= 1e4 ? 0 : 1) + 'k';
  if (a > 0 && a < 10) return sign + '$' + a.toFixed(2);
  return sign + '$' + Math.round(a);
}

export function toDate(d: Date | string | number | null | undefined): Date | null {
  if (d == null || d === '') return null;
  if (d instanceof Date) return isNaN(+d) ? null : d;
  // 'YYYY-MM-DD' is a calendar date: parse in local time, not UTC
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day);
  }
  const x = new Date(d);
  return isNaN(+x) ? null : x;
}

/** "Nov 3, 2026" */
export function date(d: Date | string | number | null | undefined): string {
  const x = toDate(d);
  return x ? x.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}
/** "Nov 3" */
export function dateShort(d: Date | string | number | null | undefined): string {
  const x = toDate(d);
  return x ? x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const MINOR = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'by', 'for', 'vs', 'at', 'with', 'nor', 'but', 'oz', 'ml', 'lb', 'ct', 'x']);
/** Title Case for titles and category names ("Linen & bedding" → "Linen & Bedding"). Small words and units stay lower case except first. */
export function titleCase(s: string | null | undefined): string {
  if (!s) return '';
  let first = true;
  return s.replace(/\S+/g, (w) => {
    const core = w.toLowerCase().replace(/^[("']+|[)"',.:;]+$/g, '');
    const out = !first && MINOR.has(core) ? w : w[0] && w[0] !== w[0].toUpperCase() ? w[0].toUpperCase() + w.slice(1) : w;
    first = false;
    return out;
  });
}
