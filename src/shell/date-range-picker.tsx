'use client';

import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../cn';
import { Button } from '../ui/button';
import { addDays, addMonths, daysInMonth, iso, isISODate, parts, type ISODate } from '../dates';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekday = (d: ISODate) => new Date(d + 'T12:00:00Z').getUTCDay();
const firstOfMonth = (d: ISODate) => { const p = parts(d); return iso(p.y, p.m, 1); };
const clamp = (d: ISODate, lo: ISODate, hi: ISODate) => (d < lo ? lo : d > hi ? hi : d);
const longDate = (d: ISODate) => { const p = parts(d); return `${WEEKDAYS_FULL[weekday(d)]}, ${MONTHS[p.m - 1]} ${p.d}, ${p.y}`; };

/** What the picker holds: a preset code (`range`) or 'custom' with `from`/`to` calendar dates. */
export type DateRangeValue = { range: string; from?: string; to?: string };
/** A preset in the menu, in order. */
export type DateRangePreset = { value: string; label: string };
/** A range resolved to dates: `dates` e.g. "Nov 1 – Nov 13, 2026", `display` e.g. "Nov 1 – Nov 13, 2026 · Month to date". */
export type ResolvedRange = { start: ISODate; end: ISODate; dates: string; display: string };

/** The module's period logic: how presets map to dates and how a range reads as text. */
export type DateRangeAdapter = {
  presets: DateRangePreset[];
  /** resolve a value (preset or custom) to concrete dates; `today` and `earliest` are calendar dates */
  resolve: (v: DateRangeValue, today: ISODate, earliest: ISODate) => ResolvedRange;
  /** "Nov 1 – Nov 13, 2026" */
  rangeText: (start: ISODate, end: ISODate) => string;
  /** the module's business "today" (calendar date) */
  today: () => ISODate;
};

/**
 * Date-range control for the top bar: presets (month/quarter/year to date, last month/quarter/year, last 12 months, all time)
 * and a custom range with a two-month calendar plus typed start/end dates.
 * `min`/`max` bound the custom calendar to the data range. The module supplies the preset math through `adapter`.
 */
export function DateRangePicker({ value, onChange, min, max, earliest, adapter, className }: {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  /** first selectable day (earliest invoice) */
  min: ISODate;
  /** last selectable day (today or the latest invoice) */
  max: ISODate;
  /** earliest data, for the "All time" label */
  earliest?: ISODate;
  adapter: DateRangeAdapter;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const t = adapter.today();
  const p = adapter.resolve(value, t, earliest ?? min);
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id="ls-date-chip"
          aria-label={`Date range: ${p.display}. Change`}
          className={cn(
            'ls-chip ls-run inline-flex min-h-11 min-w-0 items-center gap-2 rounded-full pr-3.5 pl-3 text-left text-sm',
            className
          )}
        >
          <CalendarDays className="size-4 flex-none text-accent" aria-hidden />
          <span className="min-w-0 truncate font-semibold text-ink tnum">{p.dates}</span>
          <ChevronDown className="size-3.5 flex-none text-ink3" aria-hidden />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          collisionPadding={8}
          className="glass-pop z-50 max-h-[min(640px,var(--radix-popover-content-available-height))] w-[min(720px,calc(100vw-16px))] overflow-y-auto rounded-[18px] p-0 text-ink data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none"
        >
          <RangePanel adapter={adapter} value={value} today={t} min={min} max={max} earliest={earliest ?? min} onApply={(v) => { setOpen(false); onChange(v); }} onCancel={() => setOpen(false)} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function RangePanel({ adapter, value, today: t, min, max, earliest, onApply, onCancel }: {
  adapter: DateRangeAdapter; value: DateRangeValue; today: ISODate; min: ISODate; max: ISODate; earliest: ISODate;
  onApply: (v: DateRangeValue) => void; onCancel: () => void;
}) {
  const { rangeText } = adapter;
  const cur = adapter.resolve(value, t, earliest);
  const [mode, setMode] = React.useState<'preset' | 'custom'>(value.range === 'custom' ? 'custom' : 'preset');
  const [start, setStart] = React.useState<ISODate | null>(clamp(cur.start, min, max));
  const [end, setEnd] = React.useState<ISODate | null>(clamp(cur.end, min, max));
  const [hover, setHover] = React.useState<ISODate | null>(null);
  // left month shown: the month before the end date (so the end is visible on the right), bounded by the data range
  const initialLeft = () => {
    const e = end ?? max;
    const left = firstOfMonth(addMonths(e, -1));
    return left < firstOfMonth(min) ? firstOfMonth(min) : left;
  };
  const [left, setLeft] = React.useState<ISODate>(initialLeft);
  const [focus, setFocus] = React.useState<ISODate>(end ?? max);
  const [startText, setStartText] = React.useState(start ?? '');
  const [endText, setEndText] = React.useState(end ?? '');
  const gridRef = React.useRef<HTMLDivElement>(null);
  const focusOnRender = React.useRef(false);

  React.useEffect(() => { setStartText(start ?? ''); }, [start]);
  React.useEffect(() => { setEndText(end ?? ''); }, [end]);
  React.useEffect(() => {
    if (!focusOnRender.current) return;
    focusOnRender.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focus}"]`)?.focus();
  }, [focus, left]);

  const pick = (d: ISODate) => {
    setMode('custom');
    if (!start || (start && end)) { setStart(d); setEnd(null); }
    else if (d < start) { setEnd(start); setStart(d); }
    else setEnd(d);
  };
  const moveFocus = (d: ISODate) => {
    const next = clamp(d, min, max);
    focusOnRender.current = true;
    setFocus(next);
    const right = addMonths(left, 1);
    const phone = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
    // phones show one month (the right one): keep the focused day in it
    if (phone) { if (next.slice(0, 7) !== right.slice(0, 7)) setLeft(firstOfMonth(addMonths(next, -1))); }
    else if (next < left) setLeft(firstOfMonth(next));
    else if (next > iso(parts(right).y, parts(right).m, daysInMonth(parts(right).y, parts(right).m))) setLeft(firstOfMonth(addMonths(next, -1)));
  };
  const onKey = (e: React.KeyboardEvent, d: ISODate) => {
    const map: Record<string, () => ISODate> = {
      ArrowLeft: () => addDays(d, -1), ArrowRight: () => addDays(d, 1), ArrowUp: () => addDays(d, -7), ArrowDown: () => addDays(d, 7),
      Home: () => addDays(d, -weekday(d)), End: () => addDays(d, 6 - weekday(d)),
      PageUp: () => addMonths(d, e.shiftKey ? -12 : -1), PageDown: () => addMonths(d, e.shiftKey ? 12 : 1),
    };
    if (map[e.key]) { e.preventDefault(); moveFocus(map[e.key]()); }
  };
  const typed = (s: string, which: 'start' | 'end') => {
    if (which === 'start') setStartText(s); else setEndText(s);
    if (!isISODate(s)) return;
    const d = clamp(s, min, max);
    setMode('custom');
    if (which === 'start') { setStart(d); if (end && d > end) setEnd(d); }
    else { setEnd(d); if (start && d < start) setStart(d); }
    setLeft(firstOfMonth(addMonths(which === 'end' ? d : addMonths(d, 1), -1)));
  };
  const canApply = !!(start && end);
  const span = start && end ? rangeText(start, end) : start ? `${rangeText(start, start)} – pick an end date` : 'Pick a start date';
  const right = addMonths(left, 1);
  const prevOk = left > firstOfMonth(min);
  const nextOk = right < firstOfMonth(max);
  const previewEnd = start && !end && hover ? hover : end;
  const rightEnd = iso(parts(right).y, parts(right).m, daysInMonth(parts(right).y, parts(right).m));
  const tabTarget = focus >= left && focus <= rightEnd ? focus : clamp(left, min, max);

  return (
    <div className="grid min-[640px]:grid-cols-[190px_1fr]">
      <div role="group" aria-label="Presets" className="relative flex gap-1 overflow-x-auto border-line p-2 max-[639px]:border-b min-[640px]:flex-col min-[640px]:border-r">
        {adapter.presets.map((r) => {
          const pp = adapter.resolve({ range: r.value }, t, earliest);
          const on = mode === 'preset' && value.range === r.value;
          return (
            <button
              key={r.value}
              type="button"
              aria-pressed={on}
              onClick={() => onApply({ range: r.value })}
              className={cn(
                'flex min-h-11 flex-none flex-col items-start justify-center rounded-[12px] px-3 py-1.5 text-left text-sm whitespace-nowrap text-ink2 hover:bg-glass2 hover:text-ink min-[640px]:min-h-10',
                on && 'bg-accentsoft font-[650] text-ink'
              )}
            >
              <span className="inline-flex items-center gap-1.5">{r.label}{on && <Check className="size-3.5 text-accent-ink" aria-hidden />}</span>
              <span className="text-[11.5px] font-normal text-ink3 tnum max-[639px]:hidden">{pp.dates}</span>
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={mode === 'custom'}
          onClick={() => setMode('custom')}
          className={cn('flex min-h-11 flex-none items-center rounded-[12px] px-3 py-1.5 text-left text-sm whitespace-nowrap text-ink2 hover:bg-glass2 hover:text-ink min-[640px]:min-h-10', mode === 'custom' && 'bg-accentsoft font-[650] text-ink')}
        >
          Custom range
        </button>
      </div>

      <div className="flex min-w-0 flex-col gap-3 p-3.5">
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex flex-col gap-1 text-[12px] font-[600] text-ink3">
            Start date
            <input type="date" className="ls-select min-h-10 !bg-none !pr-2 text-sm text-ink" min={min} max={max} value={startText} onChange={(e) => typed(e.target.value, 'start')} />
          </label>
          <label className="flex flex-col gap-1 text-[12px] font-[600] text-ink3">
            End date
            <input type="date" className="ls-select min-h-10 !bg-none !pr-2 text-sm text-ink" min={min} max={max} value={endText} onChange={(e) => typed(e.target.value, 'end')} />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="quiet" size="icon" aria-label="Previous month" disabled={!prevOk} onClick={() => setLeft(addMonths(left, -1))} className="size-10"><ChevronLeft aria-hidden /></Button>
          <span className="text-[12.5px] text-ink3 max-[639px]:invisible">Arrow keys move · Enter picks</span>
          <Button variant="quiet" size="icon" aria-label="Next month" disabled={!nextOk} onClick={() => setLeft(addMonths(left, 1))} className="size-10"><ChevronRight aria-hidden /></Button>
        </div>
        <div ref={gridRef} className="grid gap-4 min-[640px]:grid-cols-2" onMouseLeave={() => setHover(null)}>
          {[left, right].map((m, i) => (
            <Month key={m} month={m} hideOnPhone={i === 0} start={start} end={previewEnd} min={min} max={max} today={t} focus={tabTarget}
              onPick={pick} onHover={setHover} onKey={onKey} onFocusDay={setFocus} />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <span className="text-[13px] text-ink2 tnum" aria-live="polite">{span}</span>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" className="min-h-10" onClick={onCancel}>Cancel</Button>
            <Button variant="accent" size="sm" className="min-h-10" disabled={!canApply} onClick={() => start && end && onApply({ range: 'custom', from: start, to: end })}>Apply range</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Month({ month, hideOnPhone, start, end, min, max, today: t, focus, onPick, onHover, onKey, onFocusDay }: {
  month: ISODate; hideOnPhone: boolean; start: ISODate | null; end: ISODate | null; min: ISODate; max: ISODate; today: ISODate; focus: ISODate;
  onPick: (d: ISODate) => void; onHover: (d: ISODate | null) => void; onKey: (e: React.KeyboardEvent, d: ISODate) => void; onFocusDay: (d: ISODate) => void;
}) {
  const { y, m } = parts(month);
  const n = daysInMonth(y, m), lead = weekday(month);
  const cells: (ISODate | null)[] = [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => iso(y, m, i + 1))];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const lo = start && end ? (start < end ? start : end) : start, hi = start && end ? (start < end ? end : start) : start;
  // roving tabindex: the focused day if it is in this month, else the first enabled day
  const tabDay = focus.slice(0, 7) === month.slice(0, 7) ? focus : null;
  const labelId = `cal-${month}`;
  return (
    <div className={cn('min-w-0', hideOnPhone && 'max-[639px]:hidden')}>
      <div id={labelId} className="mb-1.5 text-center text-[13.5px] font-[700]">{MONTHS[m - 1]} {y}</div>
      <div role="grid" aria-labelledby={labelId} className="flex flex-col gap-0.5">
        <div role="row" className="grid grid-cols-7">
          {WEEKDAYS.map((w, i) => <div key={w} role="columnheader" aria-label={WEEKDAYS_FULL[i]} className="py-1 text-center text-[11px] font-[650] text-ink3">{w}</div>)}
        </div>
        {weeks.map((wk, wi) => (
          <div role="row" key={wi} className="grid grid-cols-7">
            {wk.map((d, di) => {
              if (!d) return <div role="gridcell" key={`x${di}`} />;
              const disabled = d < min || d > max;
              const edge = d === lo || d === hi;
              const inside = !!(lo && hi && d > lo && d < hi);
              return (
                <div role="gridcell" key={d} aria-selected={edge || inside} className={cn('relative', inside && 'bg-accentsoft', d === lo && hi && hi !== lo && 'rounded-l-full bg-accentsoft', d === hi && lo && hi !== lo && 'rounded-r-full bg-accentsoft')}>
                  <button
                    type="button"
                    data-day={d}
                    tabIndex={d === tabDay ? 0 : -1}
                    disabled={disabled}
                    aria-label={`${longDate(d)}${d === t ? ' (today)' : ''}`}
                    aria-pressed={edge}
                    onClick={() => onPick(d)}
                    onMouseEnter={() => onHover(d)}
                    onFocus={() => onFocusDay(d)}
                    onKeyDown={(e) => onKey(e, d)}
                    className={cn(
                      'relative mx-auto grid h-10 w-full max-w-10 place-items-center rounded-full text-[13px] tnum text-ink hover:bg-glass2 disabled:cursor-not-allowed disabled:text-ink3 disabled:opacity-40 min-[640px]:h-9',
                      edge && 'bg-accent font-[700] text-on-accent hover:bg-accent',
                      d === t && !edge && 'font-[700] text-accent-ink underline decoration-2 underline-offset-4'
                    )}
                  >
                    {parts(d).d}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
