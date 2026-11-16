'use client';

import * as React from 'react';
import {
  applyAccent,
  DEFAULT_ACCENT,
  normalizeHex,
  readStoredAccent,
  storeAccent,
  THEME_STORAGE_KEY
} from './accent';

export type Theme = 'light' | 'dark';
export type ThemeMode = Theme | 'auto';

type ThemeContextValue = {
  /** Resolved theme currently on <html data-theme>. */
  theme: Theme;
  /** What the user picked: explicit light/dark or auto (follows the OS). */
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  /** Current accent hex (#RRGGBB, uppercase). */
  accent: string;
  /** Apply (and cache on this device) a new accent. Pass null for the default. */
  setAccent: (hex: string | null) => void;
  /** Apply without caching, e.g. a live preview while dragging a color input. */
  previewAccent: (hex: string) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function systemTheme(): Theme {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

/**
 * Wrap the app once (root layout). The pre-paint script (bootScript() inlined in <head>) has
 * already set data-theme and the accent, so this only keeps them in sync.
 *
 * `brandAccent`: an accent that belongs to the current tenant/property (from the
 * server). When given it wins over the device cache and is cached for next paint.
 */
export function ThemeProvider({ children, brandAccent }: { children: React.ReactNode; brandAccent?: string | null }) {
  const [mode, setModeState] = React.useState<ThemeMode>('auto');
  const [theme, setTheme] = React.useState<Theme>('light');
  const [accent, setAccentState] = React.useState<string>(DEFAULT_ACCENT);
  const accentRef = React.useRef(accent);

  // initial sync with what the boot script did
  React.useEffect(() => {
    const m = readMode();
    setModeState(m);
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    const brand = normalizeHex(brandAccent);
    const a = brand ?? readStoredAccent();
    if (brand) storeAccent(brand);
    accentRef.current = a;
    setAccentState(a);
    applyAccent(a);
  }, [brandAccent]);

  // follow the OS while in auto
  React.useEffect(() => {
    if (mode !== 'auto' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => commitTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const commitTheme = React.useCallback((t: Theme) => {
    document.documentElement.setAttribute('data-theme', t);
    applyAccent(accentRef.current);
    setTheme(t);
  }, []);

  const setMode = React.useCallback(
    (m: ThemeMode) => {
      try {
        if (m === 'auto') localStorage.removeItem(THEME_STORAGE_KEY);
        else localStorage.setItem(THEME_STORAGE_KEY, m);
      } catch {
        /* ignore */
      }
      setModeState(m);
      commitTheme(m === 'auto' ? systemTheme() : m);
    },
    [commitTheme]
  );

  const toggle = React.useCallback(() => {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    setMode(cur === 'dark' ? 'light' : 'dark');
  }, [setMode]);

  const setAccent = React.useCallback((hex: string | null) => {
    const n = normalizeHex(hex);
    const a = n ?? DEFAULT_ACCENT;
    storeAccent(n);
    accentRef.current = a;
    setAccentState(a);
    applyAccent(a);
  }, []);

  const previewAccent = React.useCallback((hex: string) => {
    const n = normalizeHex(hex);
    if (n) applyAccent(n);
  }, []);

  const value = React.useMemo(
    () => ({ theme, mode, setMode, toggle, accent, setAccent, previewAccent }),
    [theme, mode, setMode, toggle, accent, setAccent, previewAccent]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Theme context. Outside a provider it returns an inert fallback (Storybook-safe). */
export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (ctx) return ctx;
  return {
    theme: 'light',
    mode: 'auto',
    setMode: () => {},
    toggle: () => {
      const r = document.documentElement;
      r.setAttribute('data-theme', r.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      applyAccent(readStoredAccent());
    },
    accent: DEFAULT_ACCENT,
    setAccent: (h) => applyAccent(normalizeHex(h) ?? DEFAULT_ACCENT),
    previewAccent: (h) => applyAccent(h)
  };
}

/**
 * Subscribe to theme/accent changes on <html> (data-theme or inline style).
 * Returns a counter that bumps on every change; used by charts to re-read CSS vars.
 */
export function useThemeVersion(): number {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const mo = new MutationObserver(() => setV((x) => x + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });
    return () => mo.disconnect();
  }, []);
  return v;
}
