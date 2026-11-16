'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { Building2, Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '../cn';
import { useShellConfig, type PropertyLogoDef } from './config';

export type PropertyOption = { id: number; name: string; shortName?: string | null; rooms?: number | null; brand?: string | null };

/** Logo for a property's brand, from the module's `propertyLogos` (falls back to a building icon). */
export function PropertyLogo({ brand, className }: { brand?: string | null; className?: string }) {
  const { propertyLogos } = useShellConfig();
  const hit: PropertyLogoDef | undefined = brand ? propertyLogos.find((l) => l.test.test(brand)) : undefined;
  if (hit) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={hit.src} alt={hit.alt} className={cn('ls-prop-logo block h-auto w-[46px] flex-none', className)} />;
  }
  return (
    <span aria-hidden className={cn('grid size-[34px] flex-none place-items-center rounded-lg bg-accentsoft text-accent-ink', className)}>
      <Building2 className="size-[18px]" />
    </span>
  );
}

function CardFace({ p, label, chevron }: { p?: PropertyOption | null; label: string; chevron: boolean }) {
  return (
    <>
      <PropertyLogo brand={p?.brand} />
      <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
        <span className="text-xs font-normal text-ink3">Property</span>
        <span className="truncate font-semibold" title={label}>{label}</span>
      </span>
      {chevron && <ChevronsUpDown className="size-4 flex-none text-ink3" aria-hidden />}
    </>
  );
}

/**
 * Property picker in the top bar. 1 property → static label. Search appears
 * above 6 properties. "All properties" (portfolio) when `allowAll`.
 * On pick it calls the shell's `onPropertyChange` (the module persists the choice, e.g. in a cookie), then router.refresh().
 */
export function PropertySwitcher({
  properties,
  currentPropertyId,
  allowAll = true,
  onChange,
  className
}: {
  properties: PropertyOption[];
  currentPropertyId: number | 'all';
  allowAll?: boolean;
  /** Optional extra hook (Storybook / tests). The shell's onPropertyChange and the refresh still happen. */
  onChange?: (id: number | 'all') => void;
  className?: string;
}) {
  const router = useRouter();
  const { onPropertyChange } = useShellConfig();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [value, setValue] = React.useState<number | 'all'>(currentPropertyId);
  const [pending, start] = React.useTransition();
  const listRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => setValue(currentPropertyId), [currentPropertyId]);

  const many = properties.length > 6;
  const current = value === 'all' ? null : properties.find((p) => p.id === value);
  const triggerLabel = current ? (current.shortName || current.name) : allowAll && properties.length > 1 ? `All properties (${properties.length})` : (properties[0]?.name ?? 'No properties');

  if (properties.length <= 1) {
    return (
      <div className={cn('ls-box flex min-h-[52px] w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-sm', className)}>
        <CardFace p={properties[0]} label={properties[0]?.name || 'No properties yet'} chevron={false} />
      </div>
    );
  }

  const needle = q.trim().toLowerCase();
  const filtered = needle ? properties.filter((p) => (p.name + ' ' + (p.shortName ?? '')).toLowerCase().includes(needle)) : properties;

  const pick = (id: number | 'all') => {
    setValue(id);
    setOpen(false);
    setQ('');
    onPropertyChange?.(id);
    onChange?.(id);
    start(() => router.refresh());
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const opts = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role=option]') ?? []);
    const i = opts.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === 'ArrowDown' ? Math.min(opts.length - 1, i + 1) : Math.max(0, i - 1);
    opts[next]?.focus();
  };

  const Opt = ({ id, name, sub }: { id: number | 'all'; name: string; sub?: string }) => {
    const on = value === id;
    return (
      <button
        type="button"
        role="option"
        aria-selected={on}
        onClick={() => pick(id)}
        className={cn(
          'flex min-h-10 w-full items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 text-left text-sm text-ink outline-none hover:bg-accentsoft focus-visible:bg-accentsoft focus-visible:outline-none',
          on && 'font-[650]'
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block [overflow-wrap:anywhere]">{name}</span>
          {sub && <span className="block text-xs text-ink3">{sub}</span>}
        </span>
        {on && <Check className="size-4 flex-none text-accent-ink dark:text-accent2" aria-hidden />}
      </button>
    );
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={`Property: ${triggerLabel}. Change property`}
          className={cn(
            'ls-box ls-run flex min-h-[52px] w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-sm text-ink',
            pending && 'opacity-70',
            className
          )}
        >
          <CardFace p={current} label={current ? current.name : triggerLabel} chevron />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          collisionPadding={12}
          onOpenAutoFocus={(e) => {
            if (!many) {
              e.preventDefault();
              listRef.current?.querySelector<HTMLButtonElement>('[aria-selected=true],[role=option]')?.focus();
            }
          }}
          className="glass-pop z-50 flex max-h-[min(70dvh,520px)] w-[min(340px,calc(100vw-24px))] flex-col rounded-[16px] p-1.5 text-ink data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none"
        >
          {many && (
            <div className="relative mb-1.5 p-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink3" aria-hidden />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    listRef.current?.querySelector<HTMLButtonElement>('[role=option]')?.focus();
                  }
                }}
                placeholder={`Search ${properties.length} properties`}
                aria-label="Search properties"
                className="min-h-[38px] w-full rounded-ctl border border-line bg-glass2 py-2 pr-3 pl-9 text-sm placeholder:text-ink3"
              />
            </div>
          )}
          <div ref={listRef} role="listbox" aria-label="Properties" onKeyDown={onListKey} className="flex min-h-0 flex-col gap-0.5 overflow-y-auto">
            {allowAll && !needle && (
              <>
                <Opt id="all" name="All properties" sub={`Portfolio · ${properties.length} hotels`} />
                <div className="mx-1 my-1 h-px bg-line" role="presentation" />
              </>
            )}
            {filtered.map((p) => (
              <Opt key={p.id} id={p.id} name={p.name} sub={p.rooms ? `${p.rooms} rooms` : (p.shortName ?? undefined)} />
            ))}
            {!filtered.length && <p className="m-0 px-3 py-4 text-center text-sm text-ink3">No property matches “{q}”.</p>}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
