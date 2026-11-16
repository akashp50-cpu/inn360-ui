'use client';

import * as React from 'react';
import { Sidebar, type ShellUser } from './sidebar';
import { TopBar } from './top-bar';
import { MobileTabs } from './mobile-tabs';
import { PageTitleProvider } from './page-title';
import type { PropertyOption } from './property-switcher';
import {
  DEFAULT_ROLE_LABELS,
  ShellConfigProvider,
  type PropertyLogoDef,
  type SearchConfig,
  type ShellBrand,
  type ShellConfig,
  type ShellNav
} from './config';

export type { ShellUser, PropertyOption };

const DEFAULT_BRAND: ShellBrand = { name: 'INN360', href: '/' };
const NO_LOGOS: PropertyLogoDef[] = [];

/**
 * Signed-in app frame (canvas layout): 232px glass sidebar (≥ 900px) with logo, property, grouped nav and account;
 * page header (big title, search + theme pill, filters), content, and the phone tab bar.
 * Module-agnostic: navigation, brand, search and property logos come in as props.
 */
export function AppShell({
  user,
  properties,
  currentPropertyId,
  nav,
  brand = DEFAULT_BRAND,
  search,
  propertyLogos = NO_LOGOS,
  onPropertyChange,
  roleLabels = DEFAULT_ROLE_LABELS,
  title,
  children,
  filters,
  notice,
  topBarActions,
  allowAllProperties = true,
  signOutAction
}: {
  user: ShellUser;
  properties: PropertyOption[];
  currentPropertyId: number | 'all';
  /** sidebar groups + items and the phone tab bar */
  nav: ShellNav;
  /** product name and logo mark at the top of the sidebar */
  brand?: ShellBrand;
  /** ⌘K Spotlight; omit to leave search out */
  search?: SearchConfig;
  /** brand logos for properties (matched against the property's brand name) */
  propertyLogos?: PropertyLogoDef[];
  /** persist the property choice (e.g. a cookie); the shell refreshes the route afterwards */
  onPropertyChange?: (id: number | 'all') => void;
  roleLabels?: Record<string, string>;
  title?: string;
  children: React.ReactNode;
  filters?: React.ReactNode;
  notice?: React.ReactNode;
  topBarActions?: React.ReactNode;
  allowAllProperties?: boolean;
  signOutAction?: (formData: FormData) => void | Promise<void>;
}) {
  const config = React.useMemo<ShellConfig>(
    () => ({ nav, brand, search, propertyLogos, onPropertyChange, roleLabels }),
    [nav, brand, search, propertyLogos, onPropertyChange, roleLabels]
  );
  return (
    <ShellConfigProvider value={config}>
      <PageTitleProvider>
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-pill px-4 py-2 text-pillink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <div className="relative z-[1] grid min-h-dvh grid-cols-[minmax(0,1fr)] items-start gap-4 px-3 pt-3 pb-28 min-[900px]:grid-cols-[232px_minmax(0,1fr)] min-[900px]:p-4">
          <Sidebar
            user={user}
            properties={properties}
            currentPropertyId={currentPropertyId}
            allowAllProperties={allowAllProperties}
            signOutAction={signOutAction}
          />
          <div className="flex min-w-0 flex-col gap-7">
            <TopBar title={title} filters={filters} actions={topBarActions} />
            {notice}
            <main id="main" tabIndex={-1} className="flex min-w-0 flex-col gap-4 pb-5 outline-none">
              {children}
            </main>
          </div>
        </div>
        <MobileTabs />
      </PageTitleProvider>
    </ShellConfigProvider>
  );
}
