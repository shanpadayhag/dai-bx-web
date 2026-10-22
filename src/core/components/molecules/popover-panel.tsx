import type { ReactNode } from 'react';
import joinClassNames from '@/core/class-names';

type PopoverPanelProps = {
  id: string;
  label: string;
  className?: string;
  children: ReactNode;
};

const PopoverPanel = ({ id, label, className, children }: PopoverPanelProps) => (
  <div
    id={id}
    popover="auto"
    role="dialog"
    aria-label={label}
    className={joinClassNames(
      'm-auto w-[min(440px,calc(100vw-2rem))] rounded-2xl border border-border bg-background p-0 text-foreground shadow-lift backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]',
      className,
    )}
  >
    {children}
  </div>
);

export default PopoverPanel;
