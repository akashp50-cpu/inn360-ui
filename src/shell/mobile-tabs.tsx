'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { cn } from '../cn';
import { isActive, useShellConfig } from './config';

/** Floating glass tab bar for phones (< 900px). */
export function MobileTabs() {
  const pathname = usePathname();
  const { nav } = useShellConfig();
  const MOBILE_TABS = nav.mobileTabs;
  const inTabs = MOBILE_TABS.some((t) => !t.more && isActive(pathname, t.href, nav.items));
  return (
    <nav
      aria-label="Main"
      className="glass fixed right-3 bottom-3.5 left-3 z-20 flex justify-around gap-1 rounded-[24px] p-1.5 pb-[max(6px,env(safe-area-inset-bottom))] min-[900px]:hidden"
    >
      {MOBILE_TABS.map((t) => {
        const on = t.more ? !inTabs && !!pathname : isActive(pathname, t.href, nav.items);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            className={cn(
              'flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[16px] text-[11px] font-semibold text-ink3 no-underline transition-colors',
              on && 'bg-accentsoft text-accent-ink'
            )}
          >
            <Icon className="size-5" aria-hidden />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Body of the /more page: grouped phone menu (every page not in the tab bar) and the user card with sign out. */
export function MoreNav({ user, signOutAction }: { user?: { name: string; email: string; role: string }; signOutAction?: (formData: FormData) => void | Promise<void> }) {
  const pathname = usePathname();
  const { nav, roleLabels } = useShellConfig();
  const NAV_ITEMS = nav.items;
  const MOBILE_TABS = nav.mobileTabs;
  const NAV_GROUPS = nav.groups;
  const rest = NAV_ITEMS.filter((n) => !MOBILE_TABS.some((t) => t.href === n.href));
  const sections: { label: string; items: typeof rest }[] = [
    ...NAV_GROUPS.map((g) => ({ label: g.label, items: rest.filter((n) => n.group === g.key) })),
    { label: 'More', items: rest.filter((n) => !n.group) }
  ].filter((s) => s.items.length);
  const initials = user ? (user.name || user.email).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join('') : '';
  return (
    <div className="flex flex-col gap-3.5">
      {sections.map((sec) => (
        <section key={sec.label} aria-label={sec.label} className="flex flex-col gap-1.5">
          <h2 className="m-0 px-1.5 text-xs font-bold tracking-[.08em] text-ink3 uppercase">{sec.label}</h2>
          <div className="ls-card flex flex-col p-1.5">
            {sec.items.map((n) => {
              const Icon = n.icon;
              const on = isActive(pathname, n.href, NAV_ITEMS);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? 'page' : undefined}
                  className={cn('flex min-h-[52px] items-center gap-3 rounded-[12px] px-2.5 text-base font-medium text-ink no-underline hover:bg-accentsoft', on && 'bg-accentsoft text-accent-ink')}
                >
                  <span aria-hidden className="grid size-9 place-items-center rounded-[10px] bg-accentsoft text-accent-ink">
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">{n.label}</span>
                  <ChevronRight className="size-4 text-ink3" aria-hidden />
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      {user && (
        <div className="ls-card flex items-center gap-3 p-3.5">
          <span aria-hidden className="grid size-10 flex-none place-items-center rounded-full bg-accentsoft text-sm font-semibold text-accent-ink">{initials}</span>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate font-semibold">{user.name || user.email}</span>
            <span className="text-xs text-ink3">{roleLabels[user.role] ?? user.role}</span>
          </span>
          {signOutAction && (
            <form action={signOutAction}>
              <button type="submit" className="min-h-11 px-1 text-sm font-semibold text-accent-ink">Sign out</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
