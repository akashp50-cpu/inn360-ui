'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { LayoutGrid, Search, type LucideIcon } from 'lucide-react';
import { cn } from '../cn';
import { ThemeToggle } from '../theme/theme-toggle';
import { titleForPath, useShellConfig, type SearchConfig, type SearchGroup, type SearchHit } from './config';
import { Crumbs, usePageHead } from './page-title';

export type { ShellUser } from './sidebar';

type Hit = { href: string; t: string; s: string; r?: string; kind: string; group: string; icon: LucideIcon; tint: NonNullable<SearchHit['tint']> };
const TINT: Record<NonNullable<SearchHit['tint']>, string> = {
  blue: 'bg-[rgba(1,113,227,.13)] text-[#042F97] dark:bg-accentsoft dark:text-accent-ink',
  orange: 'bg-[rgba(235,110,0,.13)] text-[#6B2203] dark:bg-accentsoft dark:text-accent-ink',
  green: 'bg-[rgba(11,153,31,.13)] text-[#09441F] dark:bg-accentsoft dark:text-accent-ink',
  neutral: 'bg-[rgba(10,19,23,.07)] text-ink dark:bg-glass2'
};

/** ⌘K Spotlight: the module's search groups (from `search.url`) plus the navigation pages. */
export function SpotlightSearch({ search }: { search: SearchConfig }) {
  const router = useRouter();
  const { nav, brand } = useShellConfig();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [hits, setHits] = React.useState<Hit[]>([]);
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const placeholder = search.placeholder ?? 'Search';
  const pagesLabel = search.pagesLabel === undefined ? 'Pages' : search.pagesLabel;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const ctl = new AbortController();
    const id = setTimeout(async () => {
      const ql = q.trim().toLowerCase();
      const pages: Hit[] = pagesLabel === null ? [] : nav.items
        .filter((n) => !ql || n.label.toLowerCase().includes(ql))
        .map((n) => ({ href: n.href, t: n.label, s: 'Page', kind: '__pages', group: pagesLabel ?? '', icon: LayoutGrid, tint: 'neutral' as const }));
      try {
        const sep = search.url.includes('?') ? '&' : '?';
        const r = await fetch(search.url + sep + 'q=' + encodeURIComponent(q.trim()), { signal: ctl.signal });
        const json = r.ok ? await r.json() : { groups: [] };
        const groups: SearchGroup[] = (search.parse ? search.parse(json) : json.groups) ?? [];
        const next: Hit[] = [
          ...groups.flatMap((g) =>
            g.items.map((h) => ({ href: h.href, t: h.title, s: h.subtitle ?? '', r: h.right, kind: g.key, group: g.label, icon: h.icon ?? LayoutGrid, tint: h.tint ?? ('blue' as const) }))
          ),
          ...pages.slice(0, ql ? 6 : 4)
        ];
        setHits(next);
        setActive(0);
      } catch {
        /* aborted */
      }
    }, 140);
    return () => {
      clearTimeout(id);
      ctl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open]);

  const go = (h: Hit) => {
    setOpen(false);
    setQ('');
    router.push(h.href);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(hits.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && hits[active]) {
      e.preventDefault();
      go(hits[active]);
    }
  };
  React.useEffect(() => {
    listRef.current?.querySelector('[data-active=true]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  // groups in the order the module returned them, navigation pages last
  const order = Array.from(new Set(hits.map((h) => h.kind)));
  const groups = order.map((k) => ({ k, items: hits.map((h, i) => ({ h, i })).filter((x) => x.h.kind === k) })).filter((g) => g.items.length);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button type="button" aria-label="Search (Command K)" className="ls-run ls-ico grid size-11 place-items-center rounded-full text-ink transition hover:bg-[rgba(5,54,89,.07)] dark:hover:bg-accentsoft">
          <Search className="size-[18px]" aria-hidden />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-[rgba(10,19,23,.62)] backdrop-blur-[10px] dark:bg-black/65" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="ls-spotlight fixed top-[14vh] left-1/2 z-[91] w-[min(640px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-[18px] border border-[rgba(10,19,23,.14)] bg-white text-ink shadow-[0_32px_90px_rgba(10,19,23,.45),0_4px_14px_rgba(10,19,23,.18)] dark:border-[rgba(212,175,55,.28)] dark:bg-[#17150F] dark:shadow-[0_24px_80px_rgba(0,0,0,.7),0_0_40px_rgba(212,175,55,.12)]"
        >
          <DialogPrimitive.Title className="sr-only">Search {brand.name}</DialogPrimitive.Title>
          <label className="flex min-h-[68px] items-center gap-3.5 border-b border-line bg-[#F2F5F9] px-5 dark:bg-white/[.04]">
            <Search className="size-[22px] text-accent" aria-hidden />
            <input
              autoFocus
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label={search.label ?? placeholder}
              placeholder={placeholder}
              className="min-w-0 flex-1 border-0 bg-transparent text-xl text-ink outline-none placeholder:text-ink3"
            />
            <DialogPrimitive.Close className="min-h-7 rounded-md border border-line bg-white px-2 text-xs text-ink3 dark:bg-white/[.06]">esc</DialogPrimitive.Close>
          </label>
          <div ref={listRef} className="max-h-[420px] overflow-y-auto p-2">
            {groups.map((g) => (
              <div key={g.k} className="py-1.5">
                <div className="px-3 pt-2.5 pb-1.5 text-[11px] font-bold tracking-[.08em] text-ink uppercase dark:text-accent-ink">{g.items[0].h.group}</div>
                {g.items.map(({ h, i }) => {
                  const Icon = h.icon;
                  return (
                    <Link
                      key={h.kind + h.href + i}
                      href={h.href}
                      onClick={(e) => {
                        e.preventDefault();
                        go(h);
                      }}
                      onMouseEnter={() => setActive(i)}
                      data-active={i === active}
                      className="grid min-h-12 grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] border border-transparent px-3 py-1.5 text-ink no-underline transition-[padding,background] data-[active=true]:border-[rgba(0,100,224,.25)] data-[active=true]:bg-[rgba(0,100,224,.10)] data-[active=true]:pl-[18px] dark:data-[active=true]:border-[rgba(212,175,55,.35)] dark:data-[active=true]:bg-accentsoft"
                    >
                      <span aria-hidden className={cn('grid size-8 place-items-center rounded-lg', TINT[h.tint])}>
                        <Icon className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate text-[14.5px] font-semibold">{h.t}</span>
                        <span className="truncate text-xs text-ink3">{h.s}</span>
                      </span>
                      {h.r && <span className="text-[13px] font-semibold tnum">{h.r}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
            {!groups.length && <p className="m-0 px-3 py-7 text-center text-ink3">{q ? `No matches for “${q}”` : 'Searching…'}</p>}
          </div>
          <div className="flex gap-4 border-t border-line bg-[#F2F5F9] px-5 py-2.5 text-xs text-ink3 dark:bg-white/[.04]">
            <span>↑↓ to move</span>
            <span>↵ to open</span>
            <span className="ml-auto">⌘K to search anywhere</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Page header: big title on the left, search + theme pill on the right, filters below. */
export function TopBar({ title, filters, actions, className }: { title?: string; filters?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const head = usePageHead();
  const { nav, search } = useShellConfig();
  const t = head?.title ?? title ?? titleForPath(pathname, nav);
  return (
    <header className={cn('flex flex-col gap-[18px] px-1 pt-1', className)}>
      {head?.crumbs?.length ? <Crumbs crumbs={head.crumbs} /> : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 key={pathname} className="ls-title m-0 text-[30px] leading-[1.1] font-bold tracking-[-0.022em] min-[900px]:text-[35px]">{t}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {head?.actions}
          {actions}
          <div className="glass flex items-center gap-1 rounded-full p-1.5">
            {search && <SpotlightSearch search={search} />}
            <ThemeToggle className="ls-run ls-ico size-11 rounded-full border-0 bg-transparent text-ink hover:bg-[rgba(5,54,89,.07)] dark:hover:bg-accentsoft" />
          </div>
        </div>
      </div>
      {filters}
    </header>
  );
}
