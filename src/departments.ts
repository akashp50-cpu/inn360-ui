/**
 * The 7 INN360 hotel departments: code, names, color and icon. Shared by every module so a department
 * looks the same everywhere (Housekeeping is always blue, Breakfast always orange, ...).
 * Module-specific taxonomy (categories, count-sheet prefixes, classifier keywords) stays in the module.
 *
 * Teams can add custom departments and recolor built-in ones: the module calls applyDepartmentOverrides()
 * whenever its team taxonomy loads, and deptName() / deptColor() / the kit's DeptIcon pick it up.
 */
import {
  SprayCan,
  Coffee,
  Wrench,
  ConciergeBell,
  Briefcase,
  ShoppingBag,
  Megaphone,
  Tag as TagIcon,
  type LucideIcon
} from 'lucide-react';

export const SYSTEM_DEPT_CODES = ['HK', 'BF', 'MT', 'FO', 'BO', 'MK', 'SM'] as const;
export type SystemDeptCode = (typeof SYSTEM_DEPT_CODES)[number];

export interface DepartmentInfo {
  code: string;
  /** full name, e.g. "Front Office" */
  name: string;
  /** compact label for tight spots (chips, table headers) */
  short: string;
  /** name with a qualifier where it helps, e.g. "Guest Market (resale)" */
  label: string;
  /** brand color (hex), checked against the light and dark surfaces */
  color: string;
  icon: LucideIcon;
}

/** The built-in departments in their fixed order. */
export const SYSTEM_DEPARTMENTS: Record<SystemDeptCode, DepartmentInfo> = {
  HK: { code: 'HK', name: 'Housekeeping', short: 'Housekeeping', label: 'Housekeeping', color: '#2a78d6', icon: SprayCan },
  BF: { code: 'BF', name: 'Breakfast', short: 'Breakfast', label: 'Breakfast', color: '#d95926', icon: Coffee },
  MT: { code: 'MT', name: 'Maintenance', short: 'Maintenance', label: 'Maintenance', color: '#199e70', icon: Wrench },
  FO: { code: 'FO', name: 'Front Office', short: 'Front office', label: 'Front Office', color: '#b07400', icon: ConciergeBell },
  BO: { code: 'BO', name: 'Back Office', short: 'Back office', label: 'Back Office / Admin', color: '#d55181', icon: Briefcase },
  MK: { code: 'MK', name: 'Guest Market', short: 'Market', label: 'Guest Market (resale)', color: '#0ca30c', icon: ShoppingBag },
  SM: { code: 'SM', name: 'Sales & Marketing', short: 'Sales', label: 'Sales & Marketing', color: '#7a6be0', icon: Megaphone }
};

/** Icon for departments a team adds itself. */
export const CUSTOM_DEPT_ICON: LucideIcon = TagIcon;

/**
 * Department colors (hex). The first seven are the built-in departments in their fixed order (HK, BF, MT, FO, BO, MK, SM),
 * checked with the dataviz palette validator against the light (#f6f8fb) and dark (#12141a) surfaces: lightness band,
 * chroma floor, adjacent-pair colorblind separation (worst ΔE 9.4), normal-vision floor (worst ΔE 18.1) and >= 3:1 contrast
 * all pass in both modes. The rest are extra choices for custom departments.
 */
export const DEPT_COLOR_PRESETS = ['#2a78d6', '#d95926', '#199e70', '#b07400', '#d55181', '#0ca30c', '#7a6be0', '#2a87b5', '#a5508f', '#7a7f1d', '#5b6cf0', '#c2410c'] as const;

/* ---------------- runtime overrides (custom departments, recolors) ---------------- */
let CODES: string[] = [...SYSTEM_DEPT_CODES];
let NAMES: Record<string, string> = {};
let COLORS: Record<string, string> = {};

export interface DepartmentOverride {
  code: string;
  name: string;
  /** a color this team picked; null keeps the default (built-in) or a preset by position (custom) */
  color: string | null;
  /** true for the built-in departments: only the color override applies */
  system: boolean;
}

/**
 * Merge a team's departments into the shared lookups. Idempotent; pass [] to reset to the built-ins.
 * Custom departments are listed after the built-ins in the order given.
 */
export function applyDepartmentOverrides(defs: DepartmentOverride[]): void {
  CODES = [...SYSTEM_DEPT_CODES];
  NAMES = {};
  COLORS = {};
  for (const d of defs) {
    if (!d.system && !(SYSTEM_DEPT_CODES as readonly string[]).includes(d.code)) {
      CODES.push(d.code);
      NAMES[d.code] = d.name;
    }
    if (d.color) COLORS[d.code] = d.color;
  }
}

/** True for a built-in code or a team's custom code. */
export function isDeptCode(code: unknown): code is string {
  return typeof code === 'string' && CODES.includes(code);
}

/** Department name by code ("Front Office"); unknown codes come back as given. */
export function deptName(code: string): string {
  return NAMES[code] ?? (SYSTEM_DEPARTMENTS as Record<string, DepartmentInfo>)[code]?.name ?? code;
}

/** The department's color: the team's pick, else the built-in default, else a preset by position. */
export function deptColor(code: string): string {
  return (
    COLORS[code] ??
    (SYSTEM_DEPARTMENTS as Record<string, DepartmentInfo>)[code]?.color ??
    DEPT_COLOR_PRESETS[Math.max(0, CODES.indexOf(code)) % DEPT_COLOR_PRESETS.length]
  );
}

/** The department's icon (custom departments get a tag icon). */
export function deptIcon(code: string): LucideIcon {
  return (SYSTEM_DEPARTMENTS as Record<string, DepartmentInfo>)[code]?.icon ?? CUSTOM_DEPT_ICON;
}
