# @inn360/ui

The INN360 design system. Every INN360 hotel module (Lotus Supply, night audit brief, front desk, ...) installs this one package, so all modules look identical and a design change made here reaches every module.

It ships **TypeScript source and CSS** (no build step). Tokens, light/dark theme with accent engine, motion, the app shell (sidebar, top bar, filter bar, date-range picker, phone tabs) and the component kit (Card, Kpi, Pill, Bar, ...).

## Install

```bash
npm i github:akashp50-cpu/inn360-ui#v0.1.0
```

Two lines of consumer config:

```ts
// next.config.ts
const nextConfig = { transpilePackages: ['@inn360/ui'] };
```

```css
/* app/globals.css (path in @source is relative to this file) */
@import "tailwindcss";
@import "@inn360/ui/styles.css";
@source "../node_modules/@inn360/ui/src";
```

Peer dependencies: `react`, `react-dom`, `next`, `lucide-react`, `radix-ui`, `tailwindcss` (v4). The module also loads Inter (see the layout below).

Local development against a checkout: `"@inn360/ui": "file:../path/to/inn360-ui"` plus `install-links=true` in the module's `.npmrc` (npm then copies the package instead of symlinking it, which avoids a second copy of React and lets Tailwind scan it). Re-run `npm install` after editing the package.

## Entry points

| Import | What |
| --- | --- |
| `@inn360/ui` | everything below |
| `@inn360/ui/shell` | `AppShell`, `Sidebar`, `TopBar`, `MobileTabs`, `MoreNav`, `PageTitle`, `PropertySwitcher`, `FilterBar`, `DateRangePicker`, nav/search types |
| `@inn360/ui/theme` | `ThemeProvider`, `ThemeToggle`, `useTheme`, `bootScript`, accent engine |
| `@inn360/ui/kit` | `Card`, `Kpi`, `KpiRow`, `Pill`, `Tag`, `Bar`, `Btn`, `Btn2`, `CardFoot`, `Tip`, `VendorLogo`, `LogoProvider`, `DeptIcon`, `DeptBadge`, `AnimatedNumber` |
| `@inn360/ui/ui` | `Button`, `DropdownMenu*` |
| `@inn360/ui/format` | `usd`, `pct`, `formatNumber`, `titleCase`, dates for display |
| `@inn360/ui/departments` | the 7 departments (name, color, icon), `deptName`, `deptColor` |
| `@inn360/ui/dates` | calendar math on `YYYY-MM-DD` strings |
| `@inn360/ui/styles.css` | all CSS |

## Minimal module

```tsx
// app/layout.tsx (server)
import './globals.css';
import { ThemeProvider, bootScript } from '@inn360/ui/theme';
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript() }} />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
      </head>
      <body><ThemeProvider><Providers>{children}</Providers></ThemeProvider></body>
    </html>
  );
}

// app/providers.tsx ('use client'): logos hold RegExps, so build them in a client file
export function Providers({ children }: { children: React.ReactNode }) {
  return <LogoProvider logos={[{ test: /acme/i, src: '/logos/acme.svg', h: 14, k: 1 }]}>{children}</LogoProvider>;
}

// app/(app)/layout.tsx ('use client' wrapper, because nav icons and callbacks are not serializable)
<AppShell user={user} properties={properties} currentPropertyId="all" nav={{ groups: [], items: [{ href: '/', label: 'Overview', icon: LayoutGrid, box: 'top' }], mobileTabs: [] }}
  brand={{ name: 'Night Audit', markSrc: '/brand/mark.png', href: '/' }} search={{ url: '/api/search' }}>{children}</AppShell>

// app/(app)/page.tsx
<><PageTitle title="Overview" />
  <KpiRow><Kpi label="Revenue" value={<AnimatedNumber value={12840} format="usd0" />} /></KpiRow>
  <Card title="Rooms Sold" icon={BedDouble}>...</Card></>
```

Module-specific pieces stay in the module and come in as props: nav groups/items/tabs, brand, search (`{ url, placeholder, parse? }`; response `{ groups: [{ key, label, items: [{ href, title, subtitle?, right?, icon?, tint? }] }] }`), property logos, vendor logos (`LogoProvider`), the filter bar's chips/values/callbacks, and the period math (`DateRangeAdapter`). Cookies, queries and business rules never live here.

## Rules every module follows

- Title Case for every title, label and category (`titleCase()`).
- No caption that restates a chart (the chart and its title say it).
- Period controls read `MTD`, `QTD`, `YTD`, `Custom`.
- Where money is shown, amounts include tax and freight.
- Dark mode is black and gold, whatever the team accent.
- Colors, spacing and motion come from tokens and the kit; no one-off hex values in modules.

## Changing the design

1. Edit this package (tokens in `src/styles/tokens.css`, components in `src/`).
2. `npx tsc --noEmit`, then commit and tag a new version (`git tag v0.1.1 && git push --tags`).
3. In each module: `npm i github:akashp50-cpu/inn360-ui#v0.1.1`, check it visually, deploy.

Only bump a module when you are ready for it to change; modules pinned to an older tag keep their look.
