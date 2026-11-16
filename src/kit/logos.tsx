'use client';

import * as React from 'react';
import { cn } from '../cn';

/**
 * A vendor logo the module ships. `test` matches the vendor name; `src` is the asset URL (kept in the module's
 * `public/`); `h` = default height; `k` = how much taller than a wide wordmark the logo sits when a height is
 * passed (stacked logos need more).
 */
export type VendorLogoDef = { test: RegExp; src: string; h: number; k: number };

const LogoContext = React.createContext<VendorLogoDef[]>([]);

/**
 * Provide the module's vendor logos to every <VendorLogo/> below. Without a provider (or without a match)
 * VendorLogo falls back to the vendor name as a wordmark.
 * Build the list in a client file (RegExp cannot cross the server/client boundary as a prop).
 */
export function LogoProvider({ logos, children }: { logos: VendorLogoDef[]; children: React.ReactNode }) {
  return <LogoContext.Provider value={logos}>{children}</LogoContext.Provider>;
}

/** Real vendor logo when the module has one, otherwise the vendor name as a wordmark. */
export function VendorLogo({ name, className, height }: { name: string; className?: string; height?: number }) {
  const logos = React.useContext(LogoContext);
  const hit = logos.find((l) => l.test.test(name));
  if (hit) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={hit.src} alt={name} className={cn('ls-vendor-logo block w-auto', className)} style={{ height: height ? Math.round(height * hit.k) : hit.h }} />;
  }
  return <span className={cn('text-[13px] font-bold tracking-[-0.01em] whitespace-nowrap text-ink', className)}>{name}</span>;
}
