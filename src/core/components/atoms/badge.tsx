import type { ReactNode } from 'react';
import joinClassNames from '@/core/class-names';

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const toneClassNames: Record<BadgeTone, string> = {
  neutral: 'bg-surface-strong text-muted-foreground',
  primary: 'bg-primary-soft text-primary-soft-foreground',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

type BadgeProps = {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
};

const Badge = ({ tone = 'neutral', className, children }: BadgeProps) => (
  <span
    className={joinClassNames(
      'inline-flex h-5.5 items-center gap-1 rounded-md px-1.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3',
      toneClassNames[tone],
      className,
    )}
  >
    {children}
  </span>
);

export default Badge;
