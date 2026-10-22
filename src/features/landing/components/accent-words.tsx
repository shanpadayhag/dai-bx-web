import type { ReactNode } from 'react';

const AccentWords = ({ children }: { children: ReactNode }) => (
  <span className="font-serif text-[1.1em] font-normal tracking-[-0.02em] text-primary italic">
    {children}
  </span>
);

export default AccentWords;
