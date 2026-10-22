import type { ReactNode } from 'react';

const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-border-strong bg-background px-1 font-sans text-[11px] font-medium text-muted-foreground">
    {children}
  </kbd>
);

export default Kbd;
