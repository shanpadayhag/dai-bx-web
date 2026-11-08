import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

type MoreOptionsProps = {
  children: ReactNode;
};

const MoreOptions = ({ children }: MoreOptionsProps) => (
  <details className="group grid gap-3">
    <summary className="-mx-1 flex w-fit cursor-pointer list-none items-center gap-1 rounded-md px-1 py-0.5 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
      <ChevronRight
        aria-hidden="true"
        className="size-3.5 transition-transform duration-150 group-open:rotate-90"
      />
      More options
    </summary>
    <div className="grid gap-3 pt-3">{children}</div>
  </details>
);

export default MoreOptions;
