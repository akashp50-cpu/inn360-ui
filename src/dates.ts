/** Date helpers on ISO 'YYYY-MM-DD' strings. No time zones, no Date objects leaking out. */
export type ISODate = string;

const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (y: number, m1: number, d: number): ISODate => `${y}-${pad(m1)}-${pad(d)}`;
export function parts(s: ISODate): { y: number; m: number; d: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) throw new Error(`Bad ISO date: ${s}`);
  return { y: +m[1], m: +m[2], d: +m[3] };
}
export const isISODate = (s: unknown): s is ISODate => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z'));
export const daysInMonth = (y: number, m1: number) => new Date(Date.UTC(y, m1, 0)).getUTCDate();
const toUtc = (s: ISODate) => { const p = parts(s); return Date.UTC(p.y, p.m - 1, p.d); };
const fromUtc = (t: number): ISODate => { const d = new Date(t); return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); };
/** inclusive day count between two dates */
export const daysBetween = (a: ISODate, b: ISODate) => Math.round((toUtc(b) - toUtc(a)) / 864e5) + 1;
export const addDays = (s: ISODate, n: number): ISODate => fromUtc(toUtc(s) + n * 864e5);
/** add months, clamping to the end of the target month (Mar 31 - 1 month = Feb 28) */
export function addMonths(s: ISODate, n: number): ISODate {
  const { y, m, d } = parts(s);
  const t = (y * 12 + (m - 1)) + n, ny = Math.floor(t / 12), nm = (t % 12 + 12) % 12 + 1;
  return iso(ny, nm, Math.min(d, daysInMonth(ny, nm)));
}
export const addYears = (s: ISODate, n: number): ISODate => addMonths(s, n * 12);
export const monthStart = (s: ISODate): ISODate => { const p = parts(s); return iso(p.y, p.m, 1); };
export const monthEnd = (s: ISODate): ISODate => { const p = parts(s); return iso(p.y, p.m, daysInMonth(p.y, p.m)); };
export const monthKey = (s: ISODate) => s.slice(0, 7);
export const maxDate = (a: ISODate, b: ISODate) => (a > b ? a : b);
export const minDate = (a: ISODate, b: ISODate) => (a < b ? a : b);
/** first-of-month dates from the month containing `a` through the month containing `b` */
export function monthsBetween(a: ISODate, b: ISODate): ISODate[] {
  const out: ISODate[] = [];
  let cur = monthStart(a);
  const end = monthStart(b);
  while (cur <= end) { out.push(cur); cur = addMonths(cur, 1); }
  return out;
}

/** "Nov 1 – Nov 13, 2026", "Dec 1, 2025 – Jan 31, 2026", "Nov 13, 2026" (en dash). */
export function rangeText(s: ISODate, e: ISODate): string {
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const md = (d: ISODate) => `${MONTH_NAMES[parts(d).m - 1]} ${parts(d).d}`;
  const a = parts(s), b = parts(e);
  if (s === e) return `${md(s)}, ${a.y}`;
  if (a.y === b.y) return `${md(s)} – ${md(e)}, ${b.y}`;
  return `${md(s)}, ${a.y} – ${md(e)}, ${b.y}`;
}
