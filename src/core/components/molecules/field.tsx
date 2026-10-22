import type { ReactNode } from 'react';

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  trailing?: ReactNode;
  children: ReactNode;
};

const Field = ({ label, htmlFor, hint, trailing, children }: FieldProps) => (
  <div className="grid content-start gap-1.5">
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground">
        {label}
      </label>
      {trailing}
    </div>
    {children}
    {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
  </div>
);

export default Field;
