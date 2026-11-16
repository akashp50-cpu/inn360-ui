'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

/** One sidebar / phone-tab entry. */
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** key of the NavGroup this item sits in; items without one sit in the top box (Overview) or the bottom box (Import, Settings) */
  group?: string;
  /** 'top' = the box above the groups, 'bottom' = the box below them */
  box?: 'top' | 'bottom';
  tag?: string;
  /** phone tab bar only: marks the "More" tab, which is lit whenever the page is not one of the other tabs */
  more?: boolean;
};

export type NavGroup = { key: string; label: string; icon: LucideIcon };

/** Navigation of a module: sidebar groups, sidebar items (in order) and the phone tab bar. */
export type ShellNav = { groups: NavGroup[]; items: NavItem[]; mobileTabs: NavItem[] };

/** Product name and logo mark shown at the top of the sidebar. The first word is light, the rest bold ("Lotus **Supply**"). */
export type ShellBrand = {
  name: string;
  /** URL of the mark (image in the module's public/); omit for a name-only logo */
  markSrc?: string;
  /** where the logo links to */
  href?: string;
};

/** Brand logo for a property (by property brand name); no match → building icon. */
export type PropertyLogoDef = { test: RegExp; src: string; alt: string };

/** One ⌘K search hit. */
export type SearchHit = {
  href: string;
  title: string;
  subtitle?: string;
  /** right-aligned value, e.g. an amount */
  right?: string;
  icon?: LucideIcon;
  /** background tint of the icon square */
  tint?: 'blue' | 'orange' | 'green' | 'neutral';
};
export type SearchGroup = { key: string; label: string; items: SearchHit[] };

/** ⌘K Spotlight. The shell GETs `${url}?q=<text>`; the response is `{ groups: SearchGroup[] }` unless `parse` maps it. */
export type SearchConfig = {
  url: string;
  placeholder?: string;
  /** accessible label of the input (default: the placeholder) */
  label?: string;
  /** map the module's own response to groups */
  parse?: (json: any) => SearchGroup[];
  /** label of the group of navigation pages appended to every result (default "Pages"; null hides it) */
  pagesLabel?: string | null;
};

export type ShellConfig = {
  nav: ShellNav;
  brand: ShellBrand;
  search?: SearchConfig;
  propertyLogos: PropertyLogoDef[];
  /** called when the property picker changes (persist the choice, e.g. in a cookie); the shell then refreshes the route */
  onPropertyChange?: (id: number | 'all') => void;
  /** role code → label shown under the user's name */
  roleLabels: Record<string, string>;
};

export const DEFAULT_ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  regional: 'Regional Manager',
  gm: 'General Manager',
  dept: 'Department Manager',
  accounting: 'Accounting'
};

const ShellContext = React.createContext<ShellConfig | null>(null);

export function ShellConfigProvider({ value, children }: { value: ShellConfig; children: React.ReactNode }) {
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShellConfig(): ShellConfig {
  const v = React.useContext(ShellContext);
  if (!v) throw new Error('@inn360/ui shell components must be rendered inside <AppShell>.');
  return v;
}

const under = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + '/');

/** True when `href` is the most specific nav item containing the path. */
export function isActive(pathname: string | null | undefined, href: string, items: NavItem[]): boolean {
  if (!pathname || !under(pathname, href)) return false;
  return !items.some((n) => n.href !== href && n.href.startsWith(href + '/') && under(pathname, n.href));
}

/** Title for the page header from the current path (sidebar items first, then the phone tabs, e.g. "More"). */
export function titleForPath(pathname: string | null | undefined, nav: ShellNav): string {
  if (!pathname) return '';
  const more = nav.mobileTabs.find((t) => t.more);
  if (more && isActive(pathname, more.href, nav.items)) return more.label;
  return nav.items.find((n) => isActive(pathname, n.href, nav.items))?.label ?? '';
}
