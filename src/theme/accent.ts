/**
 * Accent engine: one hex in, the whole accent theme out.
 * Library-free and framework-free so it can run in the pre-paint boot script,
 * in React, in Storybook and on the server.
 *
 * Tokens produced: --accent (fills, bars), --accent2 (gradient partner),
 * --accentsoft (tinted backgrounds), --accent-ink (accent used as TEXT, always
 * >= 4.5:1 on glass), --on-accent (text on an accent fill), --bg (page glow),
 * --hero (hero KPI gradient that keeps white text >= 5:1).
 */

export const DEFAULT_ACCENT = '#0064E0';
export const ACCENT_STORAGE_KEY = 'ls-accent';
export const THEME_STORAGE_KEY = 'ls-theme';
export const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export type AccentPreset = { name: string; hex: string; note?: string };

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: 'Blue', hex: '#0064E0', note: 'Lotus default' },
  { name: 'Navy', hex: '#1F3A6E' },
  { name: 'Teal', hex: '#08767D' },
  { name: 'Violet', hex: '#7340FE' },
  { name: 'Jade', hex: '#2F6B5A', note: 'Muted teal' },
  { name: 'Hilton blue', hex: '#104C97', note: 'Approximate' },
  { name: 'Deep blue', hex: '#1D4F7A' },
  { name: 'Gold', hex: '#8C6A1F' },
  { name: 'Rose', hex: '#A8456B' },
  { name: 'Leaf', hex: '#4E7A1F' },
  { name: 'Graphite', hex: '#3B3F46' }
];

export type AccentTokens = Record<
  '--accent' | '--accent2' | '--accentsoft' | '--accent-ink' | '--on-accent' | '--bg' | '--hero',
  string
>;

/**
 * Pure token computation. Self-contained on purpose (no outer references, no
 * spread) because its source is also inlined into the pre-paint boot script.
 */
export function accentTokens(input: string, dark: boolean): AccentTokens {
  function rgb(h: string): number[] | null {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim());
    if (!m) return null;
    var n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function hex(c: number[]): string {
    return (
      '#' +
      c
        .map(function (v) {
          return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
        })
        .join('')
        .toUpperCase()
    );
  }
  function mix(c: number[], d: number[], t: number): number[] {
    return c.map(function (v, i) {
      return v + (d[i] - v) * t;
    });
  }
  function lum(c: number[]): number {
    var f = function (v: number) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  }
  function ratio(a: number[], b: number[]): number {
    var x = lum(a),
      y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function a(c: number[], o: number): string {
    return 'rgba(' + c.map(Math.round).join(',') + ',' + o + ')';
  }
  // Dark mode is always black and gold, whatever the team accent.
  if (dark) {
    return {
      '--accent': '#D4AF37',
      '--accent2': '#E9C964',
      '--accentsoft': 'rgba(212,175,55,0.16)',
      '--accent-ink': '#E9C964',
      '--on-accent': '#14120E',
      '--bg': 'radial-gradient(900px 600px at 8% -10%,rgba(212,175,55,.16),transparent 60%),radial-gradient(800px 520px at 100% 0%,rgba(160,120,40,.10),transparent 60%),radial-gradient(1000px 800px at 60% 100%,rgba(212,175,55,.07),transparent 65%),linear-gradient(160deg,#0E0D0B,#050505)',
      '--hero': 'linear-gradient(150deg,#2A2416,#14120E)'
    };
  }
  var W = [255, 255, 255],
    INK = [26, 26, 31],
    DARKGLASS = [24, 27, 36];
  var src = rgb(input) || [31, 58, 110];
  var base = src.slice();
  var i = 0;
  // Fills must reach 3:1 against the light page (graphics / large text).
  if (!dark) {
    while (ratio(base, W) < 3 && i < 14) {
      base = mix(base, INK, 0.1);
      i++;
    }
  }
  var acc = dark ? mix(base, W, 0.38) : base;
  if (dark) {
    i = 0;
    while (ratio(acc, DARKGLASS) < 3 && i < 14) {
      acc = mix(acc, W, 0.12);
      i++;
    }
  }
  var acc2 = mix(acc, W, dark ? 0.25 : 0.28);
  var on = ratio(acc, W) >= ratio(acc, INK) ? '#FFFFFF' : '#1A1A1F';
  // Accent as text: 4.5:1 on glass.
  var ink = acc.slice();
  i = 0;
  if (dark) {
    ink = mix(src, W, 0.45);
    while (ratio(ink, DARKGLASS) < 5 && i < 16) {
      ink = mix(ink, W, 0.12);
      i++;
    }
  } else {
    while (ratio(ink, W) < 5 && i < 16) {
      ink = mix(ink, INK, 0.12);
      i++;
    }
  }
  // Hero: both gradient stops keep white text >= 5:1.
  var hb = src.slice();
  i = 0;
  while (ratio(hb, W) < 5.6 && i < 16) {
    hb = mix(hb, INK, 0.12);
    i++;
  }
  var t = 0.16,
    hl = mix(hb, W, t);
  while (ratio(hl, W) < 5 && t > 0.01) {
    t -= 0.03;
    hl = mix(hb, W, Math.max(0, t));
  }
  var bg =
    'radial-gradient(900px 600px at 8% -10%,' + a(src, 0.18) + ',transparent 60%),radial-gradient(800px 520px at 100% 0%,rgba(13,183,175,.12),transparent 60%),radial-gradient(1000px 800px at 60% 100%,' + a(src, 0.1) + ',transparent 65%),linear-gradient(160deg,#EEF4FB,#DCE7F4)';
  return {
    '--accent': hex(acc),
    '--accent2': hex(acc2),
    '--accentsoft': a(acc, dark ? 0.22 : 0.13),
    '--accent-ink': hex(ink),
    '--on-accent': on,
    '--bg': bg,
    '--hero': 'linear-gradient(150deg,' + hex(hl) + ',' + hex(hb) + ')'
  };
}

/* ---------- helpers for the UI ---------- */

export function normalizeHex(h: string | null | undefined): string | null {
  if (!h) return null;
  const v = h.trim().startsWith('#') ? h.trim() : '#' + h.trim();
  return HEX_RE.test(v) ? v.toUpperCase() : null;
}

function lum(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
}

/** WCAG contrast ratio of two #RRGGBB colors. */
export function contrastRatio(a: string, b: string): number {
  const x = lum(a),
    y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Plain-language contrast label for the accent picker (against white). */
export function contrastLabel(hex: string): { ratio: number; label: string; tone: 'ok' | 'warn' | 'info' } {
  const n = normalizeHex(hex) ?? DEFAULT_ACCENT;
  const r = contrastRatio(n, '#FFFFFF');
  if (r >= 4.5) return { ratio: r, label: 'White text on it reads well', tone: 'ok' };
  if (r >= 3) return { ratio: r, label: 'Fine for big text: small text is darkened automatically', tone: 'info' };
  return { ratio: r, label: 'Light color: buttons switch to dark text', tone: 'warn' };
}

export function isDarkTheme(root: HTMLElement = document.documentElement): boolean {
  return root.getAttribute('data-theme') === 'dark';
}

/** Apply an accent to an element (default <html>). Reads the current theme. */
export function applyAccent(hex: string, root: HTMLElement = document.documentElement): void {
  const tokens = accentTokens(normalizeHex(hex) ?? DEFAULT_ACCENT, isDarkTheme(root));
  for (const k in tokens) root.style.setProperty(k, tokens[k as keyof AccentTokens]);
}

export function readStoredAccent(): string {
  try {
    return normalizeHex(localStorage.getItem(ACCENT_STORAGE_KEY)) ?? DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

export function storeAccent(hex: string | null): void {
  try {
    if (hex) localStorage.setItem(ACCENT_STORAGE_KEY, hex);
    else localStorage.removeItem(ACCENT_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

/**
 * Inline <script> body for <head>: sets data-theme (stored choice, else
 * prefers-color-scheme) and applies the stored accent before first paint.
 */
export function bootScript(): string {
  return (
    '(function(){try{var d=document.documentElement,t=null,c=null;' +
    'try{t=localStorage.getItem(' + JSON.stringify(THEME_STORAGE_KEY) + ');c=localStorage.getItem(' + JSON.stringify(ACCENT_STORAGE_KEY) + ')}catch(e){}' +
    "var dark=t==='dark'||(t!=='light'&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);" +
    "d.setAttribute('data-theme',dark?'dark':'light');" +
    'if(!/^#[0-9A-Fa-f]{6}$/.test(c||""))c=' + JSON.stringify(DEFAULT_ACCENT) + ';' +
    // shim for bundlers that wrap named functions (esbuild keepNames)
    'var __name=function(f){return f};' +
    'var f=' + accentTokens.toString() + ';' +
    'var k=f(c,dark);for(var p in k)d.style.setProperty(p,k[p]);' +
    '}catch(e){}})();'
  );
}
