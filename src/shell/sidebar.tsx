'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, LogOut } from 'lucide-react';
import { cn } from '../cn';
import { PropertySwitcher, type PropertyOption } from './property-switcher';
import { isActive, useShellConfig, type NavGroup, type NavItem, type ShellBrand, type ShellNav } from './config';

export type ShellUser = { name: string; email: string; role: string };

/** Logo mark + product name ("Lotus **Supply**": first word light, the rest bold) in its own white card. */
export function Logo({ brand, className }: { brand: ShellBrand; className?: string }) {
  const sp = brand.name.indexOf(' ');
  const first = sp < 0 ? brand.name : brand.name.slice(0, sp);
  const rest = sp < 0 ? '' : brand.name.slice(sp + 1);
  return (
    <Link
      href={brand.href ?? '/'}
      aria-label={`${brand.name}, home`}
      className={cn('ls-box flex min-h-14 items-center gap-2.5 rounded-xl px-3 py-2 text-ink no-underline', className)}
    >
      {brand.markSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.markSrc} alt="" aria-hidden className="ls-lotus block h-auto w-[34px]" />
      )}
      <span className="text-[19px] leading-none font-[650] tracking-[-0.025em]">
        {rest ? (
          <>
            {first} <span className="font-[750]">{rest}</span>
          </>
        ) : (
          first
        )}
      </span>
    </Link>
  );
}

function NavRow({ n, pathname, items, onNavigate }: { n: NavItem; pathname: string | null; items: NavItem[]; onNavigate?: () => void }) {
  const on = isActive(pathname, n.href, items);
  const Icon = n.icon;
  return (
    <Link
      href={n.href}
      onClick={onNavigate}
      aria-current={on ? 'page' : undefined}
      className={cn(
        'ls-run ls-nav group flex min-h-[40px] items-center gap-2.5 rounded-[10px] px-2 text-[14.5px] font-medium tracking-[-0.01em] text-ink no-underline transition-colors hover:bg-[rgba(5,54,89,.06)] dark:hover:bg-accentsoft',
        on && 'bg-accentsoft font-[650] text-accent-ink hover:bg-accentsoft'
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-[26px] flex-none place-items-center rounded-lg bg-accentsoft text-accent-ink transition-transform group-hover:translate-x-0.5 group-hover:scale-105',
          on && 'bg-accent text-on-accent shadow-[0_2px_8px_var(--accentsoft)]'
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate">{n.label}</span>
      {n.tag && <span className="rounded-full bg-accent px-2 py-px text-[11px] font-semibold text-on-accent">{n.tag}</span>}
    </Link>
  );
}

/** Nav: top box · collapsible groups · bottom box (all from the module's ShellNav). */
export function NavLinks({ pathname, nav, onNavigate }: { pathname: string | null; nav: ShellNav; onNavigate?: () => void }) {
  const NAV_ITEMS = nav.items;
  const NAV_GROUPS: NavGroup[] = nav.groups;
  const [open, setOpen] = React.useState<Record<string, boolean>>(() => Object.fromEntries(NAV_GROUPS.map((g) => [g.key, true])));
  const top = NAV_ITEMS.filter((n) => n.box === 'top');
  const bottom = NAV_ITEMS.filter((n) => n.box === 'bottom');
  return (
    <div className="flex flex-col gap-2.5">
      <div className="ls-box flex flex-col gap-0.5 rounded-[14px] p-1">
        {top.map((n) => <NavRow key={n.href} n={n} pathname={pathname} items={NAV_ITEMS} onNavigate={onNavigate} />)}
      </div>
      {NAV_GROUPS.map((g) => {
        const items = NAV_ITEMS.filter((n) => n.group === g.key);
        const isOpen = open[g.key];
        const hasActive = items.some((n) => isActive(pathname, n.href, NAV_ITEMS));
        const GIcon = g.icon;
        const id = `nav-${g.key}`;
        return (
          <div key={g.key} className="ls-box flex flex-col gap-0.5 rounded-[14px] p-1">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={id}
              onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))}
              className={cn(
                'ls-run group flex min-h-11 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-[rgba(5,54,89,.06)] dark:hover:bg-accentsoft',
                !isOpen && hasActive && 'bg-accentsoft text-accent-ink'
              )}
            >
              <span aria-hidden className="grid size-[30px] flex-none place-items-center rounded-lg bg-accentsoft text-accent-ink transition-transform group-hover:-rotate-6 group-hover:scale-105">
                <GIcon className="size-[15px]" />
              </span>
              <span className="flex-1">{g.label}</span>
              {!isOpen && hasActive && <span aria-label="Current page is in this group" className="size-1.5 rounded-full bg-accent" />}
              <ChevronDown aria-hidden className={cn('size-4 transition-transform duration-200', !isOpen && '-rotate-90')} />
            </button>
            {isOpen && (
              <div id={id} className="mt-0.5 mb-1.5 ml-[23px] flex flex-col gap-0.5 border-l-[1.5px] border-line pl-2.5">
                {items.map((n) => <NavRow key={n.href} n={n} pathname={pathname} items={NAV_ITEMS} onNavigate={onNavigate} />)}
              </div>
            )}
          </div>
        );
      })}
      <div className="ls-box flex flex-col gap-0.5 rounded-[14px] p-1">
        {bottom.map((n) => <NavRow key={n.href} n={n} pathname={pathname} items={NAV_ITEMS} onNavigate={onNavigate} />)}
      </div>
    </div>
  );
}

/** Account row at the foot of the sidebar: initials, name, role, sign out. */
export function AccountRow({ user, signOutAction }: { user: ShellUser; signOutAction?: (formData: FormData) => void | Promise<void> }) {
  const { roleLabels } = useShellConfig();
  const initials = (user.name || user.email).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join('');
  return (
    <div className="flex items-center gap-2.5 border-t border-line px-1.5 pt-2.5">
      <span aria-hidden className="grid size-8 flex-none place-items-center rounded-full bg-accentsoft text-xs font-semibold text-accent-ink">{initials}</span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate font-medium">{user.name || user.email}</span>
        <span className="text-xs text-ink3">{roleLabels[user.role] ?? user.role}</span>
      </span>
      {signOutAction && (
        <form action={signOutAction}>
          <button type="submit" className="flex min-h-11 items-center gap-1 text-xs text-ink3 hover:text-ink" aria-label="Sign out">
            <LogOut className="size-3.5" aria-hidden />
            Sign out
          </button>
        </form>
      )}
    </div>
  );
}

/** 232px glass sidebar (≥ 900px). */
export function Sidebar({
  user,
  properties,
  currentPropertyId,
  allowAllProperties,
  signOutAction
}: {
  user: ShellUser;
  properties: PropertyOption[];
  currentPropertyId: number | 'all';
  allowAllProperties?: boolean;
  signOutAction?: (formData: FormData) => void | Promise<void>;
}) {
  const pathname = usePathname();
  const { nav, brand } = useShellConfig();
  return (
    <aside
      aria-label="Main navigation"
      className="glass ls-sidebar sticky top-3.5 hidden h-[calc(100dvh-28px)] flex-col gap-3 overflow-y-auto px-3 py-4 min-[900px]:flex"
    >
      <Logo brand={brand} />
      <PropertySwitcher properties={properties} currentPropertyId={currentPropertyId} allowAll={allowAllProperties} />
      <nav aria-label="Main" className="flex-1">
        <NavLinks pathname={pathname} nav={nav} />
      </nav>
      <AccountRow user={user} signOutAction={signOutAction} />
    </aside>
  );
}
