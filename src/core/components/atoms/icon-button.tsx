import type { ButtonHTMLAttributes, ReactNode } from 'react';
import joinClassNames from '@/core/class-names';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: 'default' | 'danger' | 'primary';
  children: ReactNode;
};

const toneClassNames = {
  default: 'text-muted-foreground hover:bg-surface-strong hover:text-foreground',
  danger: 'text-muted-foreground hover:bg-danger-soft hover:text-danger',
  primary: 'text-primary hover:bg-primary-soft',
} as const;

const IconButton = ({
  label,
  tone = 'default',
  className,
  children,
  type = 'button',
  ...buttonProps
}: IconButtonProps) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={joinClassNames(
      'inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 [&_svg]:size-4',
      toneClassNames[tone],
      className,
    )}
    {...buttonProps}
  >
    {children}
  </button>
);

export default IconButton;
