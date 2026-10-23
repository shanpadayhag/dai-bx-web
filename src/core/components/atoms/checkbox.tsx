import type { InputHTMLAttributes } from 'react';
import joinClassNames from '@/core/class-names';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
};

const Checkbox = ({ label, id, className, ...inputProps }: CheckboxProps) => (
  <label
    htmlFor={id}
    className={joinClassNames(
      'inline-flex items-center gap-2.5 text-sm text-foreground',
      className,
    )}
  >
    <input
      id={id}
      type="checkbox"
      className="size-4 shrink-0 rounded border-border-strong accent-primary"
      {...inputProps}
    />
    {label}
  </label>
);

export default Checkbox;
