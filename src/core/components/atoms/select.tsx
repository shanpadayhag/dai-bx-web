import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';
import joinClassNames from '@/core/class-names';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

const Select = ({ className, wrapperClassName, children, ...selectProps }: SelectProps) => (
  <span className={joinClassNames('relative block min-w-0', wrapperClassName)}>
    <select
      className={joinClassNames(
        'h-10 w-full min-w-0 appearance-none truncate rounded-[10px] border border-border-strong bg-background pr-8 pl-3 text-sm text-foreground shadow-soft transition-[border-color,box-shadow] duration-150 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none disabled:opacity-50',
        className,
      )}
      {...selectProps}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
    />
  </span>
);

export default Select;
