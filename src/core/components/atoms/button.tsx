import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import joinClassNames from '@/core/class-names';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  children: ReactNode;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(12_19_36/0.2)] hover:bg-primary-hover',
  secondary:
    'border border-border-strong bg-background text-foreground shadow-soft hover:border-primary/40 hover:bg-surface',
  ghost: 'text-muted-foreground hover:bg-surface-strong hover:text-foreground',
  danger: 'bg-danger text-white hover:bg-danger/90',
  inverse: 'bg-ink-foreground text-ink hover:bg-white',
};

const sizeClassNames: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-9 gap-2 rounded-[10px] px-3.5 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-[15px]',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  href,
  className,
  children,
  type = 'button',
  ...buttonProps
}: ButtonProps) => {
  const buttonClassName = joinClassNames(
    'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
    variantClassNames[variant],
    sizeClassNames[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={buttonClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={buttonClassName} {...buttonProps}>
      {children}
    </button>
  );
};

export default Button;
