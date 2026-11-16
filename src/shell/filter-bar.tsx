'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../cn';
import { DateRangePicker, type DateRangeAdapter, type DateRangeValue } from './date-range-picker';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import type { ISODate } from '../dates';

/** Pill chip with a dropdown list: "Department  All ▾". */
function ChipMenu({ label, value, options, current, onPick }: { label: string; value: string; options: { value: string; label: string }[]; current: string; onPick: (v: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`${label}: ${value}. Change`} className="ls-chip ls-run inline-flex min-h-11 max-w-[260px] items-center gap-2 rounded-full pr-3.5 pl-4 text-sm">
          <span className="text-xs font-medium text-ink3">{label}</span>
          <span className="min-w-0 truncate font-semibold">{value}</span>
          <ChevronDown className="size-3.5 flex-none text-ink3" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[min(420px,var(--radix-dropdown-menu-content-available-height))] min-w-[220px] overflow-y-auto">
        {options.map((o) => (
          <DropdownMenuItem key={o.value} onSelect={() => onPick(o.value)} className="justify-between gap-3">
            <span>{o.label}</span>
            {o.value === current && <Check className="size-4 text-accent-ink" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** A dropdown filter chip: `label` + shown `value`, with the list of `options` and which one is `current`. */
export type FilterChipDef = {
  key: string;
  label: string;
  /** what the chip shows, e.g. "All" or a vendor name */
  value: string;
  current: string;
  options: { value: string; label: string }[];
};

/** A quick-period button in the segmented control. */
export type FilterPeriod = { value: string; label: string; title: string };

/** Month / quarter / year to date: the INN360 standard quick periods (plus Custom). */
export const DEFAULT_PERIODS: FilterPeriod[] = [
  { value: 'mtd', label: 'MTD', title: 'Month to date' },
  { value: 'qtd', label: 'QTD', title: 'Quarter to date' },
  { value: 'ytd', label: 'YTD', title: 'Year to date' }
];

export type FilterBarRange = {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  /** period math of the module (presets, how a preset resolves to dates) */
  adapter: DateRangeAdapter;
  /** bounds of the custom calendar (first / last day with data) */
  min: ISODate;
  max: ISODate;
  /** earliest data, for the "All time" label */
  earliest?: ISODate;
  /** quick periods before "Custom" (default MTD / QTD / YTD) */
  periods?: FilterPeriod[];
};

/**
 * Global filter bar: quick periods + Custom, dropdown chips, and the date-range picker.
 * Presentation only: the module owns the current values and what a change does (cookie, URL, refresh).
 * Pass `pending` while the page is refreshing.
 */
export function FilterBar({
  range,
  chips = [],
  onChipChange,
  pending,
  className
}: {
  range?: FilterBarRange;
  chips?: FilterChipDef[];
  onChipChange?: (key: string, value: string) => void;
  pending?: boolean;
  className?: string;
}) {
  const periods = range?.periods ?? DEFAULT_PERIODS;
  const isPreset = range ? periods.some((p) => p.value === range.value.range) : false;
  return (
    <div role="group" aria-label="Filters" aria-busy={pending || undefined} className={cn('flex flex-wrap items-center gap-2', className)}>
      {range && (
        <div role="radiogroup" aria-label="Date range" className="ls-segs">
          {periods.map((p) => (
            <button key={p.value} type="button" role="radio" aria-checked={range.value.range === p.value} title={p.title} className="ls-seg ls-run" onClick={() => range.onChange({ range: p.value, from: undefined, to: undefined })}>
              {p.label}
            </button>
          ))}
          <button type="button" role="radio" aria-checked={!isPreset} title="Pick dates" className="ls-seg ls-run" onClick={() => document.getElementById('ls-date-chip')?.click()}>
            Custom
          </button>
        </div>
      )}
      {range && <span aria-hidden className="mx-1 h-7 w-px bg-[rgba(10,19,23,.12)] dark:bg-[rgba(212,175,55,.25)] max-[899px]:hidden" />}
      {chips.map((c) => (
        <ChipMenu key={c.key} label={c.label} value={c.value} options={c.options} current={c.current} onPick={(v) => onChipChange?.(c.key, v)} />
      ))}
      {range && (
        <DateRangePicker
          className="min-[900px]:ml-auto"
          value={range.value}
          min={range.min}
          max={range.max}
          earliest={range.earliest}
          adapter={range.adapter}
          onChange={range.onChange}
        />
      )}
      {pending && (
        <span role="status" className="ml-1 inline-flex h-4 items-center">
          <span className="ls-progress w-10" aria-hidden>
            <i />
          </span>
          <span className="sr-only">Updating</span>
        </span>
      )}
    </div>
  );
}
