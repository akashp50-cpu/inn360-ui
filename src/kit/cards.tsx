/**
 * Canvas kit: the building blocks of the approved Claude Design screens (styles in styles/canvas.css).
 * Server-safe (no hooks) unless noted. Every INN360 page uses these so light/dark and motion stay consistent.
 */
import * as React from 'react';
import Link from 'next/link';
import { Info, type LucideIcon } from 'lucide-react';
import { cn } from '../cn';

export type Tone = 'accent' | 'ok' | 'warn' | 'or' | 'gr' | 'ne';

/** Glass card with an optional tinted header (title, icon, right slot). */
export function Card({
  title,
  icon: Icon,
  tone = 'accent',
  right,
  children,
  className,
  bodyClassName,
  id,
  as = 'article'
}: {
  title?: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  right?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
  as?: 'article' | 'section' | 'div';
}) {
  const T = as;
  return (
    <T id={id} className={cn('ls-card flex flex-col', className)}>
      {title != null && (
        <header className={cn('ls-hd', tone !== 'accent' && tone)}>
          {Icon && (
            <span className="ls-ic" aria-hidden>
              <Icon className="size-[18px]" strokeWidth={2.2} />
            </span>
          )}
          <h2 className="ls-ct">{title}</h2>
          {right}
        </header>
      )}
      {bodyClassName ? <div className={bodyClassName}>{children}</div> : children}
    </T>
  );
}

/** Small (i) button with a native tooltip and an accessible label. */
export function Tip({ label }: { label: string }) {
  return (
    <button type="button" className="ls-tip" aria-label={label} title={label}>
      <Info className="size-3.5" aria-hidden />
    </button>
  );
}

/** KPI tile: label (+ tip), big value, optional footer. `value` can be an <AnimatedNumber/>. */
export function Kpi({ label, tip, value, children, className }: { label: string; tip?: string; value: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <article className={cn('ls-card ls-kpi', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="ls-lbl">{label}</span>
        {tip && <Tip label={tip} />}
      </div>
      <span className="ls-big my-auto">{value}</span>
      {children}
    </article>
  );
}

/** Row of KPI tiles. */
export function KpiRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section aria-label="Summary" className={cn('grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4', className)}>
      {children}
    </section>
  );
}

export function Pill({ tone = 'gray', children, className }: { tone?: 'ok' | 'bad' | 'warn' | 'info' | 'gray'; children: React.ReactNode; className?: string }) {
  return <span className={cn('ls-pill', tone, className)}>{children}</span>;
}

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('ls-tag', className)}>{children}</span>;
}

/** Horizontal bar; `pct` 0–100. */
export function Bar({ pct, color, className, label }: { pct: number; color?: string; className?: string; label?: string }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <span className={cn('ls-bar', className)} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <span style={{ width: `${w.toFixed(1)}%`, background: color ?? 'var(--accent)' }} />
    </span>
  );
}

export function Btn({ href, children, className, ...rest }: { href?: string; children: React.ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  if (href) return <Link href={href} className={cn('ls-btn ls-run ls-run-solid', className)}>{children}</Link>;
  return <button type="button" {...rest} className={cn('ls-btn ls-run ls-run-solid', className)}>{children}</button>;
}
export function Btn2({ href, children, className, ...rest }: { href?: string; children: React.ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  if (href) return <Link href={href} className={cn('ls-btn2 ls-run', className)}>{children}</Link>;
  return <button type="button" {...rest} className={cn('ls-btn2 ls-run', className)}>{children}</button>;
}

/** Card footer link ("Fix these →"). */
export function CardFoot({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="ls-ft">
      {children}
      <span aria-hidden>→</span>
    </Link>
  );
}
