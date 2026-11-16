'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '../cn';
import { useTheme, useThemeVersion } from './theme-provider';

/** 40px glass icon button that flips light/dark (stores the choice per device). */
export function ThemeToggle({ className }: { className?: string }) {
  const { toggle } = useTheme();
  useThemeVersion();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const dark = mounted && document.documentElement.getAttribute('data-theme') === 'dark';
  return (
    <button
      type="button"
      onClick={() => {
        toggle();
      }}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
      className={cn(
        'grid size-10 place-items-center rounded-ctl border border-line bg-glass2 text-ink2 transition-colors hover:text-ink',
        className
      )}
    >
      {dark ? <Sun className="size-[18px]" aria-hidden /> : <Moon className="size-[18px]" aria-hidden />}
    </button>
  );
}
