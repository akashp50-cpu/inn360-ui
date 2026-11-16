'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export type Crumb = { href: string; label: string };
type Head = { title?: string; crumbs?: Crumb[]; actions?: React.ReactNode } | null;
const Ctx = React.createContext<{ head: Head; set: React.Dispatch<React.SetStateAction<Head>> }>({ head: null, set: () => {} });

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [head, set] = React.useState<Head>(null);
  return <Ctx.Provider value={{ head, set }}>{children}</Ctx.Provider>;
}
export function usePageHead() {
  return React.useContext(Ctx).head;
}

/** Render inside a page to replace the header title, add a back crumb and header actions. Renders nothing itself. */
export function PageTitle({ title, crumbs, actions }: { title?: string; crumbs?: Crumb[]; actions?: React.ReactNode }) {
  const { set } = React.useContext(Ctx);
  React.useEffect(() => {
    set({ title, crumbs, actions });
    return () => set(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, JSON.stringify(crumbs)]);
  React.useEffect(() => {
    set((h) => (h ? { ...h, actions } : h) as Head);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions]);
  return null;
}

export function Crumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-ink3">
      {crumbs.map((c, i) => (
        <React.Fragment key={c.href}>
          {i > 0 && <span aria-hidden>/</span>}
          <Link href={c.href} className="inline-flex min-h-8 items-center gap-1 text-ink3 no-underline hover:text-ink">
            {i === 0 && <ChevronLeft className="size-3.5" aria-hidden />}
            {c.label}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}
