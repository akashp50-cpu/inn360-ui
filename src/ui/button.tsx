import * as React from 'react';
import { Slot as SlotPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../cn';

/**
 * Glass button. `default` is the dark pill (primary action), `accent` uses the
 * brand accent with auto-contrast text, `ghost`/`outline` are glass, `link` is
 * an inline text link.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[transform,opacity,background-color,color,border-color] duration-200 ease-glass hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none motion-reduce:hover:translate-y-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 aria-invalid:border-bad",
  {
    variants: {
      variant: {
        default: 'bg-pill text-pillink',
        accent: 'bg-accent text-on-accent',
        ghost: 'bg-glass2 text-ink border border-line hover:border-[var(--line2)]',
        outline: 'bg-transparent text-ink border border-[var(--line2)] hover:bg-glass2',
        secondary: 'bg-glass3 text-ink border border-line',
        destructive: 'bg-bad text-white',
        quiet: 'bg-transparent text-ink2 hover:text-ink hover:bg-glass2 hover:translate-y-0',
        link: 'h-auto min-h-0 px-0 py-0 rounded-none font-[550] text-accent-ink underline decoration-current/30 underline-offset-[3px] hover:decoration-current hover:translate-y-0'
      },
      size: {
        default: 'min-h-10 px-[18px] py-2 text-sm max-[899px]:min-h-11',
        sm: 'min-h-8 px-3.5 py-1 text-[13px] max-[899px]:min-h-11',
        lg: 'min-h-11 px-6 py-2.5 text-[15px]',
        icon: 'size-10 rounded-ctl p-0 max-[899px]:size-11'
      }
    },
    compoundVariants: [{ variant: 'link', className: 'min-h-0 px-0 py-0 max-[899px]:min-h-0' }],
    defaultVariants: { variant: 'default', size: 'default' }
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : 'button';
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
