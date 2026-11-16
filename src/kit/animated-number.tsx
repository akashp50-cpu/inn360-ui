'use client';

import * as React from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { formatNumber, type NumberFormat } from '../format';

/**
 * Count-up number. First mount counts from 0; later value changes (filter
 * changes via router.refresh) animate from the previous value. Reduced motion
 * shows the final value at once. Screen readers get only the final value.
 */
export function AnimatedNumber({
  value,
  format = 'int',
  duration = 0.9,
  className
}: {
  value: number | null | undefined;
  format?: NumberFormat;
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const prev = React.useRef<number | null>(null);
  const reduce = useReducedMotion();
  const final = formatNumber(value, format);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value == null || !Number.isFinite(value)) {
      el.textContent = final;
      prev.current = null;
      return;
    }
    const from = prev.current ?? 0;
    prev.current = value;
    const off = reduce || document.documentElement.getAttribute('data-motion') === 'off';
    if (off || from === value) {
      el.textContent = final;
      return;
    }
    el.textContent = formatNumber(from, format);
    const ctl = animate(from, value, {
      duration,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => {
        el.textContent = formatNumber(v, format);
      },
      onComplete: () => {
        el.textContent = final;
      }
    });
    return () => ctl.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, format]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden className="tnum">
        {final}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
