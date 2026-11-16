import * as React from 'react';
import { cn } from '../cn';
import { deptColor, deptIcon, deptName } from '../departments';

/** Department icon in the department's color (custom departments get a tag icon). */
export function DeptIcon({ code, size = 15, className, label }: { code: string; size?: number; className?: string; label?: string }) {
  const I = deptIcon(code);
  return (
    <I
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('flex-none', className)}
      style={{ width: size, height: size, color: deptColor(code) }}
      strokeWidth={2.1}
    />
  );
}

/** Department chip: tinted square with its icon (for card headers and rows). */
export function DeptBadge({ code, className }: { code: string; className?: string }) {
  const c = deptColor(code);
  return (
    <span aria-hidden className={cn('grid size-9 flex-none place-items-center rounded-[10px]', className)} style={{ background: c + '24' }}>
      <DeptIcon code={code} size={18} />
    </span>
  );
}

export { deptName };
