import type { InputHTMLAttributes } from 'react';
import joinClassNames from '@/core/class-names';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  isFullWidth?: boolean;
};

const Input = ({ className, isFullWidth = true, ...inputProps }: InputProps) => (
  <input
    className={joinClassNames(
      'h-10 min-w-0 rounded-[10px] border border-border-strong bg-background px-3 text-sm text-foreground shadow-soft transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none',
      isFullWidth && 'w-full',
      className,
    )}
    {...inputProps}
  />
);

export default Input;
