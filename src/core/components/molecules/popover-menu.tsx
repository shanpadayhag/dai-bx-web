import type { ReactNode } from 'react';
import joinClassNames from '@/core/class-names';

type PopoverMenuProps = {
  id: string;
  label: string;
  placement?: 'start' | 'end';
  className?: string;
  children: ReactNode;
};

const placementClassNames = {
  start: 'supports-[position-area:bottom]:[position-area:bottom_span-right]',
  end: 'supports-[position-area:bottom]:[position-area:bottom_span-left]',
} as const;

const PopoverMenu = ({ id, label, placement = 'end', className, children }: PopoverMenuProps) => (
  <div
    id={id}
    popover="auto"
    role="menu"
    aria-label={label}
    className={joinClassNames(
      'm-auto w-56 rounded-xl border border-border bg-background p-1.5 text-foreground shadow-lift backdrop:bg-transparent supports-[position-area:bottom]:m-0 supports-[position-area:bottom]:mt-1 supports-[position-area:bottom]:[position-try-fallbacks:flip-block]',
      placementClassNames[placement],
      className,
    )}
  >
    {children}
  </div>
);

export const MenuSeparator = () => <div role="separator" className="mx-1 my-1 h-px bg-border" />;

export default PopoverMenu;
